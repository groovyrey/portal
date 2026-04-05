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

    const quests = result.rows.map(q => ({
      ...q,
      questions: typeof q.questions === 'string' ? JSON.parse(q.questions) : q.questions
    }));

    // Find the currently active (incomplete) quest if any
    const activeQuest = quests.find(q => !q.is_completed);

    return NextResponse.json({ 
      quests, 
      activeQuest,
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

    // 1. Fetch current quest status for THIS CATEGORY
    const existingResult = await query(
      'SELECT * FROM daily_quests WHERE user_id = ? AND category = ?',
      [userId, requestedCategory]
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
            message: `Continuing your ${requestedCategory} quest...`
          });
        }
        
        // If completed and within cooldown, block regeneration
        return NextResponse.json({ 
          error: `Category "${requestedCategory}" is on a 24-hour cooldown. Come back tomorrow!`,
          cooldown: true
        }, { status: 400 });
      }
    }

    // 2. Fetch Student Level, Schedule (for Subject-Sync), & Recent Question History
    const [statsResult, schedule, historyResult] = await Promise.all([
      query('SELECT level FROM student_stats WHERE user_id = ?', [userId]),
      getStudentSchedule(userId),
      query('SELECT questions FROM daily_quests WHERE user_id = ? ORDER BY quest_date DESC LIMIT 3', [userId])
    ]);

    const studentLevel = statsResult.rowCount > 0 ? statsResult.rows[0].level : 1;
    
    // Determine the category: use requested, or fallback to a subject from their schedule
    let category = requestedCategory || 'General Knowledge';
    let isAcademicQuest = false;

    if (!requestedCategory && schedule.length > 0) {
      // Filter out non-academic or generic entries and pick a random subject
      const academicSubjects = schedule
        .map(s => s.description)
        .filter(desc => desc && desc.length > 5 && !desc.includes('BREAK') && !desc.includes('LUNCH'));
      
      if (academicSubjects.length > 0) {
        // Pick a random subject for today
        category = academicSubjects[Math.floor(Math.random() * academicSubjects.length)];
        isAcademicQuest = true;
      }
    }

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

${isAcademicQuest ? `CONTEXT: The student is currently enrolled in "${category}". Your questions MUST focus on core concepts, terminology, and practical applications related to this specific academic subject.` : `CATEGORY: ${category}`}

QUESTION TYPES:
- Generate a mix of "Multiple Choice" (type: "multiple"), "True or False" (type: "boolean"), and "Open Ended" (type: "open").
- For "Multiple Choice": provide 1 correct_answer and exactly 3 incorrect_answers.
- For "True or False": **CRITICAL: set \`correct_answer\` to exactly "True" or "False". Provide exactly 1 incorrect_answer (the opposite of the correct one).**
- For "Open Ended": provide a brief "Evaluation Guideline" or "Key Concepts" in the correct_answer field. For this type, set incorrect_answers to an EMPTY ARRAY []. **CRITICAL: Open-ended questions MUST focus on problem-solving, critical thinking, or situational "What would you do?" scenarios.**

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
2. Ensure the questions are relevant to ${isAcademicQuest ? `the subject "${category}"` : `the category "${category}"`} and the student's level.
3. **DO NOT** repeat any of the questions listed in the "RECENTLY ANSWERED QUESTIONS" section.
4. **NO MARKERS:** Do not include any special characters like ">", "*", or "->" in the \`correct_answer\` or \`incorrect_answers\` fields.
5. **BOLLAN NORMALIZATION:** For boolean types, use EXACTLY "True" or "False".
6. Ensure no fields are left blank.
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
        // Retry with slightly higher temperature for variety/jitter
        result = await prompt.pipe(structuredLlm).invoke({});
      } catch (e2) {
        console.error("AI Generation attempt 2 failed:", e2);
        return NextResponse.json({ error: 'Failed to generate questions. Please try again later.' }, { status: 503 });
      }
    }

    if (!result || !result.questions || result.questions.length === 0) {
      return NextResponse.json({ error: 'Model returned no questions.' }, { status: 500 });
    }
    
    // Ensure we provide exactly 10 questions to the UI for consistency, if possible.
    const finalQuestions = result.questions.slice(0, 10).map(q => ({
      ...q,
      // Backend cleanup to ensure no weird artifacts
      correct_answer: (q.correct_answer || "").toString().replace(/^[>*\-\s]+|["']/g, '').trim(),
      incorrect_answers: (q.incorrect_answers || []).map(ans => 
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
