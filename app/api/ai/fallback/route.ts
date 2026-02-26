import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { 
  ChatPromptTemplate, 
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { z } from "zod";
import { decrypt } from '@/lib/auth';

// Define schema for structured output
const moderationSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  topic: z.string(),
  reason: z.string(),
  growth_tip: z.string(),
  safety_score: z.number().min(0).max(100)
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

    // 2. Initialize LangChain model for xAI
    const model = new ChatOpenAI({
      modelName: "grok-beta", // Or your preferred Grok model
      apiKey: process.env.XAI_API_KEY || '',
      configuration: {
        baseURL: "https://api.x.ai/v1",
      },
      temperature: 0.1,
    });

    const structuredLlm = model.withStructuredOutput(moderationSchema);

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
`.trim();

    const postContext = `
USER: ${userName}
POST CONTENT: ${content}
${poll ? `POLL QUESTION: ${poll.question}
POLL OPTIONS: ${poll.options.join(', ')}` : ''}
`.trim();

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      HumanMessagePromptTemplate.fromTemplate(postContext),
    ]);

    const chain = prompt.pipe(structuredLlm);

    // 3. Inference Call
    try {
        const result = await chain.invoke({});
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
