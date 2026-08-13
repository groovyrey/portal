import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';
import { decrypt } from '@/lib/auth';
import { publishUpdate } from '@/lib/realtime';
import { createNotification } from '@/lib/notification-service';
import { logActivity } from '@/lib/activity-service';

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

async function getCanonicalUserName(userId: string): Promise<string> {
  const nameRes = await query('SELECT name FROM students WHERE id = $1', [userId]);
  const name = (nameRes.rows[0]?.name || '').trim();
  return name || 'Anonymous Student';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postIdStr = searchParams.get('postId');

    if (!postIdStr) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const postId = parseInt(postIdStr, 10);
    if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });

    const commentsRes = await query(`
      SELECT c.*, s.profile_photo_url as userPhoto, s.badges as userBadges
      FROM community_comments c
      LEFT JOIN students s ON s.id = c.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [postId]);

    const comments = commentsRes.rows.map(row => ({
      ...row,
      id: row.id.toString(),
      postId: row.post_id.toString(),
      userId: row.user_id,
      userName: row.user_name,
      parentId: row.parent_id != null ? row.parent_id.toString() : null,
      userPhoto: row.userPhoto || null,
      isStaff: parseJsonArray(row.userBadges).includes('staff'),
      createdAt: row.created_at.toISOString()
    }));

    return NextResponse.json({ success: true, comments });
  } catch (error: unknown) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { postId: postIdStr, content, parentId: parentIdStr } = await req.json();
    if (!postIdStr || !content) return NextResponse.json({ error: 'Post ID and content required' }, { status: 400 });

    const postId = parseInt(postIdStr, 10);
    if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });

    let parentId: number | null = null;
    if (parentIdStr) {
      parentId = parseInt(parentIdStr, 10);
      if (isNaN(parentId)) return NextResponse.json({ error: 'Invalid parent comment ID' }, { status: 400 });

      const parentCheck = await query(
        'SELECT id FROM community_comments WHERE id = $1 AND post_id = $2',
        [parentId, postId]
      );
      if (parentCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 400 });
      }
    }

    const userId = parseSessionUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const canonicalUserName = await getCanonicalUserName(userId);

    await query(`
      INSERT INTO students (id, name, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING
    `, [userId, canonicalUserName]);

    const commentRes = await query(`
      INSERT INTO community_comments (post_id, user_id, user_name, content, parent_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [postId, userId, canonicalUserName, content, parentId]);

    const postRes = await query('SELECT user_id, content FROM community_posts WHERE id = $1', [postId]);
    if (postRes.rows.length > 0) {
      const postOwnerId = postRes.rows[0].user_id;
      const postPreview = postRes.rows[0].content?.substring(0, 30) || 'your post';

      if (postOwnerId !== userId) {
        createNotification({
          userId: postOwnerId,
          title: 'New Comment',
          message: `${canonicalUserName} commented on "${postPreview}...": "${content.substring(0, 50)}..."`,
          type: 'info',
          link: `/post/${postId}`
        }).catch(e => console.error('Comment notification error:', e));
      }
    }

    if (parentId) {
      const parentRes = await query('SELECT user_id FROM community_comments WHERE id = $1', [parentId]);
      const parentOwnerId = parentRes.rows[0]?.user_id;
      if (parentOwnerId && parentOwnerId !== userId) {
        createNotification({
          userId: parentOwnerId,
          title: 'New Reply',
          message: `${canonicalUserName} replied to your comment: "${content.substring(0, 50)}..."`,
          type: 'info',
          link: `/post/${postId}`
        }).catch(e => console.error('Reply notification error:', e));
      }
    }

    const newComment = {
      id: commentRes.rows[0].id.toString(),
      postId: postId.toString(),
      userId,
      userName: canonicalUserName,
      content,
      parentId: parentId ? parentId.toString() : null,
      createdAt: commentRes.rows[0].created_at.toISOString()
    };

    logActivity(
      userId,
      'Community',
      {
        message: `Commented on post #${postId}`,
        post: postRes.rows[0]?.content?.substring(0, 50),
        comment: content.substring(0, 100),
        postId: postId
      },
      `/post/${postId}`
    ).catch(e => console.error('Activity log error:', e));

    await publishUpdate('community', { type: 'COMMENT_CREATED', postId });

    return NextResponse.json({
      success: true,
      id: newComment.id,
      comment: newComment
    });
  } catch (error: unknown) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const commentIdStr = searchParams.get('id');

    if (!commentIdStr) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    const commentId = parseInt(commentIdStr, 10);
    if (isNaN(commentId)) return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });

    const userId = parseSessionUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const commentCheck = await query('SELECT user_id, post_id FROM community_comments WHERE id = $1', [commentId]);
    if (commentCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (commentCheck.rows[0].user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
    }

    const commentData = commentCheck.rows[0];
    await query(`
      WITH RECURSIVE subtree AS (
        SELECT id FROM community_comments WHERE id = $1
        UNION ALL
        SELECT c.id FROM community_comments c JOIN subtree s ON c.parent_id = s.id
      )
      DELETE FROM community_comments WHERE id IN (SELECT id FROM subtree)
    `, [commentId]);

    await publishUpdate('community', { type: 'COMMENT_DELETED', postId: commentData.post_id });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
