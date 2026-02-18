import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { decrypt } from '@/lib/auth';

// Initialize OpenAI client with xAI configuration
const xaiClient = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1',
});

export async function POST(req: NextRequest) {
  try {
    const { content, userName, poll } = await req.json();
    
    // 1. Authenticate
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      decrypt(sessionCookie.value);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const systemPrompt = `
You are "Aegis", the community moderation engine for LCC. Your role is to moderate student posts before they are published to the community feed.
You must ensure a professional, safe, and growth-oriented environment.

GUIDELINES:
1. REJECT (Decision: REJECTED) if:
   - Contains profanity, slurs, or hate speech.
   - Bullying or mocking other students, specifically regarding their grades or GPA.
   - Sharing private info (Student ID, phone numbers, addresses).
   - Asking for or offering cheating services/exam leaks.
   - Toxic comments about faculty or staff.

2. APPROVE (Decision: APPROVED) if:
   - Academic questions or study tips.
   - Positive social interactions.
   - Constructive feedback about school facilities.
   - Mental health support or encouragement.

3. CATEGORIZE (Topic):
   - Choose exactly one: "Academics", "Campus Life", "Career", "Well-being", "General".

OUTPUT FORMAT (Strict JSON):
{
  "decision": "APPROVED" | "REJECTED",
  "topic": "Topic Name",
  "reason": "Brief explanation",
  "growth_tip": "Advice for the student",
  "safety_score": 0-100
}
`.trim();

    const postContext = `
USER: ${userName}
POST CONTENT: ${content}
${poll ? `POLL QUESTION: ${poll.question}
POLL OPTIONS: ${poll.options.join(', ')}` : ''}
`.trim();

    // 2. Inference Call with xAI
    try {
        const response = await xaiClient.chat.completions.create({
          model: 'grok-3',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: postContext },
          ],
          response_format: { type: "json_object" }
        });

        const resultText = response.choices[0].message.content || "{}";
        
        let result;
        try {
          result = JSON.parse(resultText);
        } catch (e) {
          result = {
            decision: resultText.includes("APPROVED") ? "APPROVED" : "REJECTED",
            reason: "Manual check required",
            growth_tip: "Ensure your post follows school guidelines.",
            safety_score: 50
          };
        }

        return NextResponse.json(result);
    } catch (xaiError: any) {
        console.error('xAI fallback failed:', xaiError.message);
        return NextResponse.json({ error: 'All AI services failed to review post.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Fallback API Error:', error);
    return NextResponse.json({ error: 'Failed to review post: ' + error.message }, { status: 500 });
  }
}
