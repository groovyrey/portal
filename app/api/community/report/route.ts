import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/turso';
import { decrypt } from '@/lib/auth';
import { publishUpdate } from '@/lib/realtime';
import { createNotification } from '@/lib/notification-service';

export async function POST(req: NextRequest) {
  try {
    const { postId: postIdStr } = await req.json();
    if (!postIdStr) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

    const postId = parseInt(postIdStr, 10);
    if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted);
    const reporterUserId = sessionData.userId;

    // 1. Fetch the post to be reported
    const postRes = await query(`
      SELECT p.* FROM community_posts p WHERE p.id = $1
    `, [postId]);

    if (postRes.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = postRes.rows[0];

    // Fetch poll if exists
    let poll = null;
    if (post.poll_question) {
      const optionsRes = await query(`
        SELECT option_text FROM community_poll_options WHERE post_id = $1
      `, [post.id]);
      poll = {
        question: post.poll_question,
        options: optionsRes.rows.map(r => r.option_text)
      };
    }

    // 2. Call AI Review Service
    const origin = req.nextUrl.origin;
    const reviewRes = await fetch(`${origin}/api/ai/review`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || ''
      },
      body: JSON.stringify({ 
        content: post.content, 
        userName: post.user_name,
        poll: poll
      }),
    });

    if (!reviewRes.ok) {
      return NextResponse.json({ error: 'AI Moderation service unavailable' }, { status: 503 });
    }

    const result = await reviewRes.json();

    // 3. Take Action based on AI Decision
    if (result.decision === 'REJECTED') {
      const authorId = post.user_id;
      const postPreview = post.content?.substring(0, 30) || 'your post';

      // Delete the post if AI rejects it
      await query('DELETE FROM community_posts WHERE id = $1', [postId]);
      
      // Notify the author of the deletion and the reason
      try {
        await createNotification({
          userId: authorId,
          title: 'Post Removed',
          message: `Your post "${postPreview}..." was removed because it violated our community guidelines. Reason: ${result.reason}`,
          type: 'error'
        });
      } catch (notifyError) {
        console.error('Failed to notify author of post removal:', notifyError);
      }

      // Notify all clients of post deletion
      await publishUpdate('community', { type: 'POST_DELETED', postId });
      
      return NextResponse.json({ 
        success: true, 
        decision: 'REJECTED',
        reason: result.reason 
      });
    }

    return NextResponse.json({ 
      success: true, 
      decision: 'APPROVED',
      reason: 'AI analysis determined the post is safe.' 
    });

  } catch (error: any) {
    console.error('Report post error:', error);
    return NextResponse.json({ error: 'Failed to process report' }, { status: 500 });
  }
}
