import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/turso';
import { decrypt } from '@/lib/auth';
import { publishUpdate } from '@/lib/realtime';
import { createNotification, notifyAllStudents } from '@/lib/notification-service';
import { SyncService } from '@/lib/sync-service';
import { logActivity } from '@/lib/activity-service';

function parseJsonArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
}

function parseSessionUserId(req: NextRequest): string | null {
  const sessionCookie = req.cookies.get('session_token');
  if (!sessionCookie?.value) return null;

  try {
    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted);
    return sessionData.userId || null;
  } catch {
    return null;
  }
}

async function getCanonicalUserName(userId: string): Promise<string> {
  const nameRes = await query('SELECT name FROM students WHERE id = $1', [userId]);
  const name = (nameRes.rows[0]?.name || '').trim();
  if (name) return name;
  return 'Anonymous Student';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postIdStr = searchParams.get('postId');
    const userIdFilter = searchParams.get('userId');
    const topicFilter = searchParams.get('topic');
    const searchFilter = searchParams.get('search');
    const typeFilter = searchParams.get('type');
    const sortFilter = searchParams.get('sort') || 'newest';

    const limitParam = Number.parseInt(searchParams.get('limit') || '20', 10);
    const offsetParam = Number.parseInt(searchParams.get('offset') || '0', 10);
    const pageLimit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20;
    const pageOffset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;

    if (postIdStr) {
      const postId = parseInt(postIdStr, 10);
      if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });

      const postRes = await query(`
        SELECT 
          p.*,
          (SELECT COUNT(*) FROM community_post_likes WHERE post_id = p.id) as "likeCount",
          (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) as "commentCount",
          (SELECT json_group_array(user_id) FROM community_post_likes WHERE post_id = p.id) as likes
        FROM community_posts p
        WHERE p.id = $1
      `, [postId]);

      if (postRes.rows.length === 0) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      const post = postRes.rows[0];
      let poll = null;
      if (post.poll_question) {
        const optionsRes = await query(`
          SELECT 
            o.id, 
            o.option_text as text,
            (SELECT json_group_array(user_id) FROM community_poll_votes WHERE option_id = o.id) as votes
          FROM community_poll_options o
          WHERE o.post_id = $1
          ORDER BY o.id ASC
        `, [post.id]);

        poll = {
          question: post.poll_question,
          options: optionsRes.rows.map(opt => ({
            id: opt.id,
            text: opt.text,
            votes: parseJsonArray(opt.votes)
          }))
        };
      }

      const postData = {
        id: post.id.toString(),
        userId: post.user_id,
        userName: post.user_name,
        content: post.content,
        topic: post.topic,
        imageUrl: post.image_url,
        isUnreviewed: post.is_unreviewed,
        createdAt: post.created_at.toISOString(),
        likes: parseJsonArray(post.likes),
        commentCount: parseInt(post.commentCount, 10),
        poll
      };

      return NextResponse.json({ success: true, post: postData });
    }

    let queryStr = `
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM community_post_likes WHERE post_id = p.id) as "likeCount",
        (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) as "commentCount",
        (SELECT json_group_array(user_id) FROM community_post_likes WHERE post_id = p.id) as likes
      FROM community_posts p
    `;
    const queryParams: unknown[] = [];
    const whereConditions: string[] = [];

    if (userIdFilter) {
      whereConditions.push(`p.user_id = $${queryParams.length + 1}`);
      queryParams.push(userIdFilter);
    }

    if (topicFilter && topicFilter !== 'All') {
      whereConditions.push(`p.topic = $${queryParams.length + 1}`);
      queryParams.push(topicFilter);
    }

    if (searchFilter) {
      whereConditions.push(`(p.content ILIKE $${queryParams.length + 1} OR p.user_name ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${searchFilter}%`);
    }

    if (typeFilter === 'polls') {
      whereConditions.push(`p.poll_question IS NOT NULL`);
    } else if (typeFilter === 'posts') {
      whereConditions.push(`p.poll_question IS NULL`);
    }

    if (whereConditions.length > 0) {
      queryStr += ` WHERE ` + whereConditions.join(' AND ');
    }

    if (sortFilter === 'popular') {
      queryStr += ` ORDER BY "likeCount" DESC, p.created_at DESC`;
    } else if (sortFilter === 'commented') {
      queryStr += ` ORDER BY "commentCount" DESC, p.created_at DESC`;
    } else {
      queryStr += ` ORDER BY p.created_at DESC`;
    }

    const fetchLimit = pageLimit + 1;
    queryStr += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(fetchLimit, pageOffset);

    const postsRes = await query(queryStr, queryParams);
    const hasMore = postsRes.rows.length > pageLimit;
    const pageRows = hasMore ? postsRes.rows.slice(0, pageLimit) : postsRes.rows;

    const pollPostIds = pageRows.filter((p) => !!p.poll_question).map((p) => p.id);
    const pollOptionsByPost = new Map<number, Array<{ id: number; text: string; votes: string[] }>>();

    if (pollPostIds.length > 0) {
      const placeholders = pollPostIds.map((_, idx) => `$${idx + 1}`).join(', ');
      const optionsRes = await query(
        `
          SELECT
            o.post_id,
            o.id,
            o.option_text as text,
            (SELECT json_group_array(user_id) FROM community_poll_votes WHERE option_id = o.id) as votes
          FROM community_poll_options o
          WHERE o.post_id IN (${placeholders})
          ORDER BY o.id ASC
        `,
        pollPostIds
      );

      for (const row of optionsRes.rows) {
        const existing = pollOptionsByPost.get(row.post_id) || [];
        existing.push({
          id: row.id,
          text: row.text,
          votes: parseJsonArray(row.votes),
        });
        pollOptionsByPost.set(row.post_id, existing);
      }
    }

    const posts = pageRows.map((post) => ({
      id: post.id.toString(),
      userId: post.user_id,
      userName: post.user_name,
      content: post.content,
      topic: post.topic,
      imageUrl: post.image_url,
      isUnreviewed: post.is_unreviewed,
      createdAt: post.created_at.toISOString(),
      likes: parseJsonArray(post.likes),
      commentCount: parseInt(post.commentCount, 10),
      poll: post.poll_question
        ? {
            question: post.poll_question,
            options: pollOptionsByPost.get(post.id) || [],
          }
        : null,
    }));

    return NextResponse.json({ success: true, posts, hasMore, limit: pageLimit, offset: pageOffset });
  } catch (error: unknown) {
    console.error('Fetch posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = await getClient();
  try {
    const { content, poll, isUnreviewed, topic, imageUrl } = await req.json();
    if (!content && !poll && !imageUrl) return NextResponse.json({ error: 'Content, Poll, or Image required' }, { status: 400 });

    const userId = parseSessionUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const canonicalUserName = await getCanonicalUserName(userId);

    await client.query('BEGIN');

    await client.query(`
      INSERT INTO students (id, name, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING
    `, [userId, canonicalUserName]);

    const postRes = await client.query(`
      INSERT INTO community_posts (user_id, user_name, content, topic, image_url, is_unreviewed, poll_question)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      userId,
      canonicalUserName,
      content || '',
      topic || 'General',
      imageUrl || null,
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

    logActivity(
      userId,
      'Community',
      {
        message: poll ? 'Created a poll' : 'Shared a post',
        content: poll ? poll.question : content,
        topic: topic || 'General',
        postId: postId
      },
      `/post/${postId}`
    ).catch((e) => console.error('Activity log error:', e));

    try {
      const countRes = await query(`
        SELECT COUNT(*) as "postCount"
        FROM community_posts
        WHERE user_id = $1
      `, [userId]);

      const postCount = parseInt(countRes.rows[0].postCount, 10);
      if (postCount >= 5) {
        const syncer = new SyncService(userId);
        await syncer.grantBadge('community_active');
      }
    } catch (badgeError) {
      console.error('[BadgeSystem] Error checking for community_active badge:', badgeError);
    }

    const senderName = canonicalUserName || 'A fellow student';
    notifyAllStudents({
      excludeUserId: userId,
      title: 'New Community Post',
      message: `${senderName} just posted in Community: "${content?.substring(0, 30) || 'New Poll'}..."`,
      type: 'info',
      link: `/post/${postId}`
    }).catch((e) => console.error('Background notification error:', e));

    await publishUpdate('community', {
      type: 'POST_CREATED',
      postId,
      userName: canonicalUserName
    });

    return NextResponse.json({ success: true, id: postId.toString() });
  } catch (error: unknown) {
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

    const userId = parseSessionUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const postRes = await query('SELECT user_id FROM community_posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (postRes.rows[0].user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own posts' }, { status: 403 });
    }

    await query('DELETE FROM community_posts WHERE id = $1', [postId]);

    await publishUpdate('community', { type: 'POST_DELETED', postId });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
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

    const userId = parseSessionUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (action === 'like') {
      await query(`
        INSERT INTO community_post_likes (post_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [postId, userId]);

      logActivity(
        userId,
        'Community',
        {
          message: 'Liked a post',
          postId: postId
        },
        `/post/${postId}`
      ).catch(() => {});

      const postRes = await query('SELECT user_id, content FROM community_posts WHERE id = $1', [postId]);
      if (postRes.rows.length > 0) {
        const postOwnerId = postRes.rows[0].user_id;
        const postPreview = postRes.rows[0].content?.substring(0, 30) || 'your post';

        if (postOwnerId !== userId) {
          const likerRes = await query('SELECT name FROM students WHERE id = $1', [userId]);
          const likerName = likerRes.rows[0]?.name || 'A student';

          createNotification({
            userId: postOwnerId,
            title: 'New Like',
            message: `${likerName} liked your post: "${postPreview}..."`,
            type: 'success',
            link: `/post/${postId}`
          }).catch((e) => console.error('Like notification error:', e));
        }
      }

      await publishUpdate('community', {
        type: 'LIKE_UPDATE',
        postId,
        userId,
        isLiked: true
      });

    } else if (action === 'unlike') {
      await query(`
        DELETE FROM community_post_likes
        WHERE post_id = $1 AND user_id = $2
      `, [postId, userId]);

      await publishUpdate('community', {
        type: 'LIKE_UPDATE',
        postId,
        userId,
        isLiked: false
      });

    } else if (action === 'vote') {
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

      logActivity(
        userId,
        'Community',
        {
          message: 'Voted in a poll',
          postId: postId,
          optionId: targetOptionId
        },
        `/post/${postId}`
      ).catch(() => {});

      await publishUpdate('community', {
        type: 'VOTE_UPDATE',
        postId,
        optionId: targetOptionId,
        userId
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
