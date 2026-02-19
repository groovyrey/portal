import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/pg';
import { decrypt } from '@/lib/auth';
import { publishUpdate } from '@/lib/realtime';
import { notifyAllStudents } from '@/lib/notification-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postIdStr = searchParams.get('postId');
    const userIdFilter = searchParams.get('userId');

    if (postIdStr) {
      const postId = parseInt(postIdStr, 10);
      if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });

      // Fetch names of students who liked this specific post
      const likesRes = await query(`
        SELECT s.id, s.name 
        FROM community_post_likes l
        JOIN students s ON l.user_id = s.id
        WHERE l.post_id = $1
      `, [postId]);

      return NextResponse.json({ success: true, reactors: likesRes.rows });
    }

    // Fetch posts with like count and comment count
    let queryStr = `
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM community_post_likes WHERE post_id = p.id) as "likeCount",
        (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) as "commentCount",
        (SELECT json_agg(user_id) FROM community_post_likes WHERE post_id = p.id) as likes
      FROM community_posts p
    `;
    
    const queryParams: any[] = [];
    if (userIdFilter) {
      queryStr += ` WHERE p.user_id = $1`;
      queryParams.push(userIdFilter);
    }
    
    queryStr += ` ORDER BY p.created_at DESC LIMIT 50`;

    const postsRes = await query(queryStr, queryParams);

    // Fetch poll options for posts that have them
    const posts = await Promise.all(postsRes.rows.map(async (post) => {
      let poll = null;
      if (post.poll_question) {
        const optionsRes = await query(`
          SELECT 
            o.id, 
            o.option_text as text,
            (SELECT json_agg(user_id) FROM community_poll_votes WHERE option_id = o.id) as votes
          FROM community_poll_options o
          WHERE o.post_id = $1
        `, [post.id]);

        poll = {
          question: post.poll_question,
          options: optionsRes.rows.map(opt => ({
            ...opt,
            votes: opt.votes || []
          }))
        };
      }

      return {
        id: post.id.toString(),
        userId: post.user_id,
        userName: post.user_name,
        content: post.content,
        topic: post.topic,
        isUnreviewed: post.is_unreviewed,
        createdAt: post.created_at.toISOString(),
        likes: post.likes || [],
        commentCount: parseInt(post.commentCount, 10),
        poll
      };
    }));

    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    console.error('Fetch posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = await getClient();
  try {
    const { content, userName, poll, isUnreviewed, topic } = await req.json();
    if (!content && !poll) return NextResponse.json({ error: 'Content or Poll required' }, { status: 400 });

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted);
    const userId = sessionData.userId;

    await client.query('BEGIN');

    // Ensure student exists (minimal record if not already synced)
    await client.query(`
      INSERT INTO students (id, name, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING
    `, [userId, userName || 'Anonymous Student']);

    const postRes = await client.query(`
      INSERT INTO community_posts (user_id, user_name, content, topic, is_unreviewed, poll_question)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      userId, 
      userName || 'Anonymous Student', 
      content || '', 
      topic || 'General', 
      isUnreviewed || false,
      poll?.question || null
    ]);

    const postId = postRes.rows[0].id;

    if (poll && poll.options) {
      for (const optText of poll.options) {
        await client.query(`
          INSERT INTO community_poll_options (post_id, option_text)
          VALUES ($1, $2)
        `, [postId, optText]);
      }
    }

    await client.query('COMMIT');

    // Notify all students of new community post asynchronously to avoid blocking the user
    const senderName = userName || 'A fellow student';
    notifyAllStudents({
      excludeUserId: userId,
      title: 'New Community Post',
      message: `${senderName} just posted in Community: "${content?.substring(0, 50) || 'New Poll'}..."`,
      type: 'info',
      link: '/community'
    }).catch(e => console.error('Background notification error:', e));

    // Notify all clients of new post (Real-time community update)
    await publishUpdate('community', { 
      type: 'POST_CREATED', 
      postId,
      userName: userName || 'Anonymous Student'
    });

    return NextResponse.json({ success: true, id: postId.toString() });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { postId: postIdStr } = await req.json();
    if (!postIdStr) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

    const postId = parseInt(postIdStr, 10);
    if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted);
    const userId = sessionData.userId;

    // Check ownership
    const postRes = await query('SELECT user_id FROM community_posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (postRes.rows[0].user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own posts' }, { status: 403 });
    }

    await query('DELETE FROM community_posts WHERE id = $1', [postId]);

    // Notify all clients of post deletion
    await publishUpdate('community', { type: 'POST_DELETED', postId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { postId: postIdStr, action, optionIndex, optionId } = await req.json(); 
    if (!postIdStr || !action) return NextResponse.json({ error: 'Post ID and action required' }, { status: 400 });

    const postId = parseInt(postIdStr, 10);
    if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted);
    const userId = sessionData.userId;

    if (action === 'like') {
      await query(`
        INSERT INTO community_post_likes (post_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [postId, userId]);
    } else if (action === 'unlike') {
      await query(`
        DELETE FROM community_post_likes
        WHERE post_id = $1 AND user_id = $2
      `, [postId, userId]);
    } else if (action === 'vote') {
      // Find the option ID if not provided by index
      let targetOptionId = optionId;
      if (targetOptionId === undefined && optionIndex !== undefined) {
        const optionsRes = await query(`
          SELECT id FROM community_poll_options 
          WHERE post_id = $1 
          ORDER BY id ASC
        `, [postId]);
        if (optionsRes.rows[optionIndex]) {
          targetOptionId = optionsRes.rows[optionIndex].id;
        }
      }

      if (!targetOptionId) return NextResponse.json({ error: 'Option not found' }, { status: 404 });

      // Check if user already voted for any option in this post
      const voteCheck = await query(`
        SELECT 1 FROM community_poll_votes v
        JOIN community_poll_options o ON v.option_id = o.id
        WHERE o.post_id = $1 AND v.user_id = $2
      `, [postId, userId]);

      if (voteCheck.rows.length > 0) {
        return NextResponse.json({ error: 'Already voted' }, { status: 400 });
      }

      await query(`
        INSERT INTO community_poll_votes (option_id, user_id)
        VALUES ($1, $2)
      `, [targetOptionId, userId]);
    }

    // Notify all clients of post interaction
    await publishUpdate('community', { type: 'POST_UPDATED', postId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
