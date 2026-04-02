import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';
import { decrypt } from '@/lib/auth';
import { ChatOpenAI } from "@langchain/openai";
import { 
  ChatPromptTemplate, 
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { z } from "zod";

const triviaQuestionSchema = z.object({
  category: z.string(),
  type: z.enum(["multiple", "boolean"]),
  difficulty: z.string(),
  question: z.string(),
  correct_answer: z.string(),
  incorrect_answers: z.array(z.string()).min(1).max(3),
});

const questQuestionsSchema = z.object({
  questions: z.array(triviaQuestionSchema).length(10)
});

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    let userId: string;
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      userId = sessionData.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // 1. Check if quest exists for today
    const result = await query(
      'SELECT * FROM daily_quests WHERE user_id = ? AND quest_date = ?',
      [userId, today]
    );

    if (result.rowCount > 0) {
      const quest = result.rows[0];
      return NextResponse.json({
        ...quest,
        questions: typeof quest.questions === 'string' ? JSON.parse(quest.questions) : quest.questions,
        is_new: false
      });
    }

    return NextResponse.json({ is_new: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quest' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    let userId: string;
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      userId = sessionData.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const { category, difficulty: requestedDifficulty, excludedQuestions: clientExcluded = [], force = false } = await req.json();
    const today = new Date().toISOString().split('T')[0];

    // 1. FREE TIER ENFORCEMENT: Check if a quest ALREADY exists for today
    // We do not allow re-generation to save AI tokens, UNLESS 'force' is true.
    const existingResult = await query(
      'SELECT * FROM daily_quests WHERE user_id = ? AND quest_date = ?',
      [userId, today]
    );

    if (existingResult.rowCount > 0 && !force) {
      const quest = existingResult.rows[0];
      return NextResponse.json({
        questions: typeof quest.questions === 'string' ? JSON.parse(quest.questions) : quest.questions,
        current_index: quest.current_index,
        score: quest.score,
        is_completed: quest.is_completed,
        message: "You already have a quest for today. Continuing..."
      });
    }

    // 2. Fetch Student Level & Recent Question History (as fallback)
    const [statsResult, historyResult] = await Promise.all([
      query('SELECT level FROM student_stats WHERE user_id = ?', [userId]),
      query('SELECT questions FROM daily_quests WHERE user_id = ? ORDER BY quest_date DESC LIMIT 3', [userId])
    ]);

    const studentLevel = statsResult.rowCount > 0 ? statsResult.rows[0].level : 1;
    
    // Combine client-side exclusion list with a small DB fallback
    const dbExcluded: string[] = historyResult.rows.flatMap(row => {
      try {
        const qs = typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions;
        return Array.isArray(qs) ? qs.map((q: any) => q.question) : [];
      } catch (e) {
        return [];
      }
    });

    const finalExclusionList = Array.from(new Set([...clientExcluded, ...dbExcluded]));

    // 3. Generate 10 questions using Git Model
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      apiKey: process.env.GIT_MODEL_TOKEN || '',
      configuration: { baseURL: "https://models.inference.ai.azure.com" },
      temperature: 0.8,
    });

    const structuredLlm = model.withStructuredOutput(questQuestionsSchema);
    const systemPrompt = `
You are the "LCC Quest Master". Your job is to generate 10 unique, challenging, and engaging trivia questions for a student.

QUESTION TYPES:
- Generate a mix of "Multiple Choice" (4 options total) and "True or False" (2 options total).
- For "Multiple Choice": type is "multiple", provide 1 correct_answer and exactly 3 incorrect_answers.
- For "True or False": type is "boolean", provide 1 correct_answer (True or False) and exactly 1 incorrect_answer (the opposite).

STUDENT CONTEXT:
- Level: ${studentLevel}
- Category: ${category}
- Requested Base Difficulty: ${requestedDifficulty || 'Mixed'}

DIFFICULTY SCALING RULES:
- Level 1-5: Focus on fundamental concepts. Clear, unambiguous questions. (Easy to Medium)
- Level 6-12: Introduce more specific details, dates, and complex relationships. (Medium to Hard)
- Level 13-20: High-level academic questions, niche facts, and advanced problem-solving. (Hard to Expert)
- Level 21+: Extremely challenging, specialized knowledge, and complex scenarios.

CRITICAL: RECENTLY ANSWERED QUESTIONS (DO NOT REPEAT THESE):
${finalExclusionList.length > 0 ? finalExclusionList.map(q => `- ${q}`).join('\n') : 'None'}

Rules:
1. Provide exactly 10 questions.
2. Ensure the questions are relevant to the category and the student's level.
3. **DO NOT** repeat any of the questions listed in the "RECENTLY ANSWERED QUESTIONS" section.
4. The tone should be academic yet engaging.
`.trim();

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      HumanMessagePromptTemplate.fromTemplate("Generate 10 trivia questions."),
    ]);

    const result = await prompt.pipe(structuredLlm).invoke({});
    const questionsJson = JSON.stringify(result.questions);

    // 3. Save to Turso
    await query(
      `INSERT INTO daily_quests (user_id, quest_date, category, questions, current_index, score, is_completed, stats_updated)
       VALUES (?, ?, ?, ?, 0, 0, 0, 0)
       ON CONFLICT(user_id, quest_date) DO UPDATE SET
       category = excluded.category,
       questions = excluded.questions,
       current_index = 0,
       score = 0,
       is_completed = 0,
       stats_updated = 0`,
      [userId, today, category, questionsJson]
    );

    return NextResponse.json({
      questions: result.questions,
      current_index: 0,
      score: 0,
      is_completed: 0
    });
  } catch (error) {
    console.error('Quest Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate quest' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    let userId: string;
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      userId = sessionData.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const { currentIndex, score, isCompleted } = await req.json();
    const today = new Date().toISOString().split('T')[0];

    await query(
      `UPDATE daily_quests 
       SET current_index = ?, score = ?, is_completed = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND quest_date = ?`,
      [currentIndex, score, isCompleted ? 1 : 0, userId, today]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
