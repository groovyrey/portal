import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';
import { decrypt } from '@/lib/auth';
import { getStudentSchedule } from '@/lib/data-service';
import { ChatOpenAI } from "@langchain/openai";
import { 
  ChatPromptTemplate, 
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { z } from "zod";
import { getPHDate } from '@/lib/utils';

const triviaQuestionSchema = z.object({
  category: z.string(),
  type: z.enum(["multiple", "boolean", "open"]),
  difficulty: z.string(),
  question: z.string(),
  correct_answer: z.string(),
  incorrect_answers: z.array(z.string()), 
});

const questQuestionsSchema = z.object({
  questions: z.array(triviaQuestionSchema).min(5).max(15) // Relaxed for robustness
});

const DIFFICULTY_PROMPTS: Record<string, string> = {
  easy: "Focus on fundamental concepts, basic definitions, and simple terminology. Questions should be clear and unambiguous, suitable for beginners.",
  medium: "Incorporate a mix of core principles and their practical applications. Include some detailed scenarios and standard academic problem-solving.",
  hard: "Focus on advanced topics, niche details, and complex relationships. Require higher-order thinking, analysis, and deep subject matter expertise.",
  extreme: "Create extremely challenging, high-level academic questions that require profound knowledge, complex multi-step reasoning, and critical evaluation of specialized case studies."
};

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

    // 1. Fetch all quests for this user to check cooldowns
    const result = await query(
      'SELECT * FROM daily_quests WHERE user_id = ?',
      [userId]
    );

    const today = getPHDate();
    const quests = result.rows.map(q => ({
      ...q,
      questions: typeof q.questions === 'string' ? JSON.parse(q.questions) : q.questions
    }));

    // Find the currently active (incomplete) quest if any
    const activeQuest = quests.find(q => !q.is_completed);

    // Check if any quest was completed today
    const completedTodayQuest = quests.find(q => q.is_completed && q.quest_date === today);

    return NextResponse.json({ 
      quests, 
      activeQuest,
      completedToday: !!completedTodayQuest,
      completedTodayQuest,
      is_new: !activeQuest 
    });
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
    
    const { 
      category: requestedCategory, 
      difficulty: requestedDifficulty, 
      excludedQuestions: clientExcluded = [], 
      force = false,
      practice = false
    } = await req.json();
    const today = getPHDate();

    // 0. Global Daily Limit Check
    const anyCompletedToday = await query(
      'SELECT * FROM daily_quests WHERE user_id = ? AND quest_date = ? AND is_completed = 1',
      [userId, today]
    );

    if (anyCompletedToday.rowCount > 0 && !force && !practice) {
      return NextResponse.json({ 
        error: "You have already completed your daily quest challenge for today!",
        globalCooldown: true
      }, { status: 400 });
    }

    // Determine the category early to avoid issues with null requestedCategory
    let category = requestedCategory || 'General Knowledge';
    let isAcademicQuest = !!requestedCategory && requestedCategory.length > 3 && !['General', 'Computers', 'Math', 'Science', 'History', 'Geography', 'Sports', 'Gaming', 'Art'].includes(requestedCategory);

    // 1. Fetch current quest status for THIS CATEGORY
    const existingResult = await query(
      'SELECT * FROM daily_quests WHERE user_id = ? AND category = ?',
      [userId, category]
    );

    const existingQuest = existingResult.rowCount > 0 ? existingResult.rows[0] : null;
    
    // Cooldown logic: Once a day per category
    if (existingQuest && !force && !practice) {
      const lastUpdate = new Date(existingQuest.updated_at);
      const daysSinceLastRun = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);

      // If quest exists, was updated recently, and is either active or completed
      if (daysSinceLastRun < 1) {
        // If incomplete, return the existing quest to continue
        if (!existingQuest.is_completed) {
          return NextResponse.json({
            ...existingQuest,
            questions: typeof existingQuest.questions === 'string' ? JSON.parse(existingQuest.questions) : existingQuest.questions,
            message: `Continuing your ${category} quest...`
          });
        }
        
        // If completed and within cooldown, block regeneration
        return NextResponse.json({ 
          error: `Category "${category}" is on a 24-hour cooldown. Come back tomorrow!`,
          cooldown: true
        }, { status: 400 });
      }
    }

    // 2. Fetch Student Level, Schedule (for Subject-Sync), & Recent Question History
    const [statsResult, schedule, historyResult] = await Promise.all([
      query('SELECT level FROM student_stats WHERE user_id = ?', [userId]),
      getStudentSchedule(userId).catch(() => []),
      query('SELECT questions FROM daily_quests WHERE user_id = ? ORDER BY quest_date DESC LIMIT 3', [userId])
    ]);

    const studentLevel = statsResult.rowCount > 0 ? statsResult.rows[0].level : 1;
    
    // Determine the category: use requested, or fallback to a subject from their schedule
    if (!requestedCategory && schedule && schedule.length > 0) {
      // Filter out non-academic or generic entries and pick a random subject
      const academicSubjects = schedule
        .map((s: any) => s.description)
        .filter((desc: string) => desc && desc.length > 5 && !desc.includes('BREAK') && !desc.includes('LUNCH'));
      
      if (academicSubjects.length > 0) {
        // Pick a random subject for today
        category = academicSubjects[Math.floor(Math.random() * academicSubjects.length)];
        isAcademicQuest = true;
      }
    }

    console.log(`Generating quest for ${userId}: Category=${category}, Level=${studentLevel}, Difficulty=${requestedDifficulty}`);

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
      maxRetries: 2,
    });

    const structuredLlm = model.withStructuredOutput(questQuestionsSchema);
    const selectedDifficulty = (requestedDifficulty || 'medium').toLowerCase();
    const difficultyGuideline = DIFFICULTY_PROMPTS[selectedDifficulty] || "Mixed difficulty.";

    const systemPrompt = `
You are the "LCC Quest Master". Your job is to generate 10 unique, challenging, and engaging trivia questions for a student.

${isAcademicQuest ? `CONTEXT: The student is currently enrolled in "${category}". Your questions MUST focus on core concepts, terminology, and practical applications related to this specific academic subject.` : `CATEGORY: ${category}`}

TARGET DIFFICULTY: ${selectedDifficulty.toUpperCase()}
DIFFICULTY GUIDELINE: ${difficultyGuideline}

QUESTION TYPES:
- Generate a mix of "Multiple Choice" (type: "multiple"), "True or False" (type: "boolean"), and "Open Ended" (type: "open").
- For "Multiple Choice": provide 1 correct_answer and exactly 3 incorrect_answers.
- For "True or False": **CRITICAL: set \`correct_answer\` to exactly "True" or "False". Provide exactly 1 incorrect_answer (the opposite of the correct one).**
- For "Open Ended": provide a brief "Evaluation Guideline" or "Key Concepts" in the correct_answer field. For this type, set incorrect_answers to an EMPTY ARRAY []. **CRITICAL: Open-ended questions MUST focus on problem-solving, critical thinking, or situational "What would you do?" scenarios.**

STUDENT CONTEXT:
- Level: ${studentLevel}
- Category: ${category}

DIFFICULTY SCALING RULES:
- EASY: Focus on fundamental concepts. Clear, unambiguous questions.
- MEDIUM: Introduce more specific details, dates, and complex relationships. Standard academic challenges.
- HARD: High-level academic questions, niche facts, and advanced problem-solving.
- EXTREME: Expert-level specialization, complex case studies, and profound conceptual analysis.

Rules:
1. Provide exactly 10 questions.
2. Ensure the questions are relevant to ${isAcademicQuest ? `the subject "${category}"` : `the category "${category}"`} and the requested difficulty level.
3. **LATEX SUPPORT:** Use LaTeX for ALL mathematical formulas, equations, scientific notation, and chemical symbols. Use single '$' for inline (e.g., $E=mc^2$) and double '$$' for block equations.
4. **DO NOT** repeat questions.
5. **NO MARKERS:** Do not include any special characters like ">", "*", or "->" in the fields.
6. **BOOLEAN NORMALIZATION:** For boolean types, use EXACTLY "True" or "False".
7. Ensure no fields are left blank.
`.trim();

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      HumanMessagePromptTemplate.fromTemplate("Generate 10 trivia questions (mix multiple, boolean, and open-ended)."),
    ]);

    let result;
    try {
      result = await prompt.pipe(structuredLlm).invoke({});
    } catch (e) {
      console.error("AI Generation attempt 1 failed:", e);
      try {
        // Fallback: Retry with a slightly simpler prompt and no structured output if it fails again
        const fallbackRes = await model.invoke(systemPrompt + "\n\nReturn ONLY a JSON object matching the schema: { \"questions\": [ { \"category\": \"...\", \"type\": \"multiple|boolean|open\", \"difficulty\": \"...\", \"question\": \"...\", \"correct_answer\": \"...\", \"incorrect_answers\": [...] } ] }");
        const content = typeof fallbackRes.content === 'string' ? fallbackRes.content : JSON.stringify(fallbackRes.content);
        // Extract JSON if model wrapped it in markdown
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse JSON from fallback");
        }
      } catch (e2) {
        console.error("AI Generation attempt 2 failed:", e2);
        return NextResponse.json({ error: 'The Quest Master is tired. Please try again in a few minutes.' }, { status: 503 });
      }
    }

    if (!result || !result.questions || result.questions.length === 0) {
      return NextResponse.json({ error: 'Model returned no questions.' }, { status: 500 });
    }
    
    // Ensure we provide exactly 10 questions to the UI for consistency, if possible.
    const finalQuestions = result.questions.slice(0, 10).map((q: any) => ({
      ...q,
      // Backend cleanup to ensure no weird artifacts
      correct_answer: (q.correct_answer || "").toString().replace(/^[>*\-\s]+|["']/g, '').trim(),
      incorrect_answers: (q.incorrect_answers || []).map((ans: any) => 
        (ans || "").toString().replace(/^[>*\-\s]+|["']/g, '').trim()
      )
    }));

    const questionsJson = JSON.stringify(finalQuestions);

    // 3. Save to Turso (Skip if practice mode)
    if (!practice) {
      await query(
        `INSERT INTO daily_quests (user_id, quest_date, category, questions, current_index, score, is_completed, stats_updated, updated_at)
         VALUES (?, ?, ?, ?, 0, 0, 0, 0, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, category) DO UPDATE SET
         quest_date = excluded.quest_date,
         questions = excluded.questions,
         current_index = 0,
         score = 0,
         is_completed = 0,
         stats_updated = 0,
         updated_at = CURRENT_TIMESTAMP`,
        [userId, today, category, questionsJson]
      );
    }

    return NextResponse.json({
      category,
      questions: finalQuestions,
      current_index: 0,
      score: 0,
      is_completed: 0,
      stats_updated: 0
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
    
    const { currentIndex, score, isCompleted, category, questions } = await req.json();

    if (!category) return NextResponse.json({ error: 'Category required' }, { status: 400 });

    if (questions) {
      await query(
        `UPDATE daily_quests 
         SET current_index = ?, score = ?, is_completed = ?, questions = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND category = ?`,
        [currentIndex, score, isCompleted ? 1 : 0, JSON.stringify(questions), userId, category]
      );
    } else {
      await query(
        `UPDATE daily_quests 
         SET current_index = ?, score = ?, is_completed = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND category = ?`,
        [currentIndex, score, isCompleted ? 1 : 0, userId, category]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
