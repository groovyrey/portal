import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

const evaluationSchema = z.object({
  score: z.number().min(0).max(100).describe("How accurate the answer is from 0 to 100"),
  isCorrect: z.boolean().describe("Whether the answer is acceptable (true) or not (false)"),
  feedback: z.string().describe("Brief feedback (max 10 words) explaining why")
});

export async function POST(req: NextRequest) {
  try {
    const { question, userAnswer, correctAnswer } = await req.json();

    if (!userAnswer) {
      return NextResponse.json({ score: 0, isCorrect: false, feedback: "No answer provided." });
    }

    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      apiKey: process.env.GIT_MODEL_TOKEN || '',
      configuration: { baseURL: "https://models.inference.ai.azure.com" },
      temperature: 0, // Deterministic
    });

    const structuredLlm = model.withStructuredOutput(evaluationSchema);

    const systemPrompt = `
You are an expert academic evaluator. Your task is to determine if a student's answer to a given question is logical, relevant, and demonstrates critical thinking.

Question: "${question}"
Evaluation Guidelines/Key Concepts: "${correctAnswer}"
Student's Answer: "${userAnswer}"

INSTRUCTIONS:
1. Be lenient with grammar and spelling.
2. Focus on the core logic and relevance.
3. If the question is situational or subjective, accept any answer that provides a reasonable, justified explanation.
4. If the answer is "I don't know" or completely irrelevant, mark it as incorrect.
5. Provide a short, encouraging feedback.
6. **LATEX SUPPORT (CRITICAL):** Use LaTeX for ANY mathematical formulas, scientific notation, or equations mentioned in the feedback. Wrap inline math in single '$' and block equations in double '$$'.
`.trim();

    const result = await structuredLlm.invoke(systemPrompt);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Evaluation Error:', error);
    // Fallback: simple string inclusion if AI fails
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}
