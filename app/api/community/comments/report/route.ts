import { NextRequest, NextResponse } from 'next/server';
import { InferenceClient } from '@huggingface/inference';
import { decrypt } from '@/lib/auth';
import { query } from '@/lib/turso';
import { createNotification } from '@/lib/notification-service';
import { publishUpdate } from '@/lib/realtime';

export async function POST(req: NextRequest) {
  try {
    const { commentId: commentIdStr } = await req.json();
    
    if (!commentIdStr) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    const commentId = parseInt(commentIdStr, 10);
    if (isNaN(commentId)) return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });

    // 1. Authenticate reporter
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      decrypt(sessionCookie.value);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 2. Fetch comment details
    const commentRes = await query('SELECT * FROM community_comments WHERE id = $1', [commentId]);
    if (commentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    const comment = commentRes.rows[0];

    const systemPrompt = `
You are "Aegis", the community moderation engine for LCC. Your role is to review reported comments and decide if they should be removed.
You must ensure a professional, safe, and growth-oriented environment.

GUIDELINES:
1. REJECT (Decision: REJECTED) if:
   - Contains profanity, slurs, or hate speech.
   - Bullying or mocking other students.
   - Sharing private info (Student ID, phone numbers, addresses).
   - Asking for or offering cheating services/exam leaks.
   - Toxic comments about faculty or staff.
   - Harassment or spam.

2. APPROVE (Decision: APPROVED) if:
   - Constructive criticism.
   - Disagreements expressed respectfully.
   - Academic questions or study tips.
   - Positive social interactions.

OUTPUT FORMAT (Strict JSON):
{
  "decision": "APPROVED" | "REJECTED",
  "reason": "Brief explanation of why it violates or follows guidelines"
}
`.trim();

    const reportContext = `
COMMENT AUTHOR: ${comment.user_name}
COMMENT CONTENT: ${comment.content}
`.trim();

    // 3. Inference Call
    const hfToken = process.env.HUGGINGFACE_MODERATION_TOKEN || process.env.HUGGINGFACE_API_KEY;
    const aiModel = "google/gemma-3-27b-it";

    if (!hfToken) {
       return NextResponse.json({ error: 'Moderation API token is not set.' }, { status: 500 });
    }

    const hf = new InferenceClient(hfToken);

    const response = await hf.chatCompletion({
      model: aiModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: reportContext }
      ],
      max_tokens: 500,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const resultText = response.choices[0].message.content || "{}";
    
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (e) {
      result = {
        decision: resultText.includes("APPROVED") ? "APPROVED" : "REJECTED",
        reason: "Manual check required"
      };
    }

    // 4. Handle Decision
    if (result.decision === 'REJECTED') {
      // Delete the comment
      await query('DELETE FROM community_comments WHERE id = $1', [commentId]);

      // Notify the author
      await createNotification({
        userId: comment.user_id,
        title: 'Comment Removed',
        message: `Your comment was removed because it violates our community guidelines. Reason: ${result.reason}`,
        type: 'error',
        link: `/post/${comment.post_id}`
      });

      // Notify all clients of comment deletion
      await publishUpdate('community', { type: 'COMMENT_DELETED', postId: comment.post_id });
    }

    return NextResponse.json({
      success: true,
      decision: result.decision,
      reason: result.reason
    });

  } catch (error: any) {
    console.error('Comment Report API Error:', error);
    return NextResponse.json({ error: 'Failed to process report: ' + error.message }, { status: 500 });
  }
}
