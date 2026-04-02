import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { 
  ChatPromptTemplate, 
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { z } from "zod";
import { decrypt } from '@/lib/auth';

export const maxDuration = 300;

const triviaQuestionSchema = z.object({
  category: z.string(),
  type: z.string().default("multiple"),
  difficulty: z.string(),
  question: z.string(),
  correct_answer: z.string(),
  incorrect_answers: z.array(z.string()).length(3),
});

const questQuestionsSchema = z.object({
  questions: z.array(triviaQuestionSchema).length(10)
});

export async function POST(req: NextRequest) {
  try {
    const { category, difficulty } = await req.json();
    
    // Authenticate
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      decrypt(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Initialize GitHub Model (Azure AI Inference)
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      apiKey: process.env.GIT_MODEL_TOKEN || '',
      configuration: {
        baseURL: "https://models.inference.ai.azure.com",
      },
      temperature: 0.8,
    });

    const structuredLlm = model.withStructuredOutput(questQuestionsSchema);

    const systemPrompt = `
You are the "LCC Quest Master". Your job is to generate 10 unique, challenging, and engaging trivia questions for a student.
Category: ${category || 'General Knowledge'}
Difficulty: ${difficulty || 'Mixed'}

Guidelines:
1. Provide exactly 10 questions.
2. Each question must have 1 correct answer and exactly 3 incorrect answers.
3. Ensure the questions are relevant to the category.
4. If difficulty is "Easy", "Medium", or "Hard", tailor the questions accordingly.
5. Avoid repetitive questions.
6. The tone should be academic yet engaging.
`.trim();

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      HumanMessagePromptTemplate.fromTemplate("Generate 10 trivia questions."),
    ]);

    const result = await prompt.pipe(structuredLlm).invoke({});
    
    // Add difficulty to each question if not present
    const questions = result.questions.map(q => ({
      ...q,
      difficulty: q.difficulty || difficulty || 'medium'
    }));

    return NextResponse.json({ questions });

  } catch (error) {
    console.error('Quest Generation API Error:', error);
    return NextResponse.json({ error: 'Failed to generate questions: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
}
