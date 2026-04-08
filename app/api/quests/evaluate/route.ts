import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

const evaluationSchema = z.object({
  score: z.number().min(0).max(100).describe("How accurate the answer is from 0 to 100"),
  isCorrect: z.boolean().describe("Whether the answer is acceptable (true) or not (false)"),
  feedback: z.string().describe("A concise, informative explanation (max 50 words) that reinforces the concept and explains why the answer was correct or how it can be improved.")
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
      temperature: 0.3, // Slightly higher for more natural feedback
    });

    const structuredLlm = model.withStructuredOutput(evaluationSchema);

    const systemPrompt = `
You are an expert academic evaluator and tutor. Your task is to evaluate a student's answer and provide an informative, educational response that helps them learn.

Question: "${question}"
Evaluation Guidelines/Key Concepts: "${correctAnswer}"
Student's Answer: "${userAnswer}"

INSTRUCTIONS:
1. **Evaluation:** Determine if the core logic is correct. Be lenient with grammar but strict on conceptual accuracy.
2. **Informative Feedback:** Provide a concise explanation (max 50 words). 
   - If correct: Briefly explain *why* it's correct and perhaps add a small related fact to reinforce the learning.
   - If incorrect: Identify the misconception and provide the correct reasoning or context.
3. **Tone:** Professional, encouraging, and academic.
4. **LATEX SUPPORT (CRITICAL):** Use LaTeX for ALL mathematical formulas, chemical symbols, or scientific notation in your feedback. Wrap inline math in single '$' (e.g., $H_2O$, $x^2$).
5. **No Filler:** Get straight to the point of the explanation.
`.trim();

    const result = await structuredLlm.invoke(systemPrompt);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Evaluation Error:', error);
    // Fallback: simple string inclusion if AI fails
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}
