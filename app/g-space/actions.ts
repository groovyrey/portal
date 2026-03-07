"use server";

import { ClassroomAssignment, ClassroomCourse } from "@/types/g-space";
import { Student } from "@/types";
import { getStudentGrades, getStudentSchedule } from "@/lib/data-service";

/**
 * Academic Workload Analyzer - Rebuilt Version
 * 
 * Logic:
 * 1. Parallel Data Aggregation: Fetch grades and schedule immediately.
 * 2. Context Injection: Provide all data (Assignments + Academic Standing + Schedule) in one prompt.
 * 3. Single-Turn Generation: Use a direct chat completion without complex tool loops.
 */
export async function analyzeAssignments(
  assignments: ClassroomAssignment[], 
  student?: Student,
  courses?: ClassroomCourse[]
) {
  const API_TOKEN = process.env.AI_WORKER_API;
  const ACCOUNT_ID = "6fc752615c51f96c4ce397b92c40fdd6";
  const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"; 

  if (!API_TOKEN) throw new Error("AI System configuration is missing.");
  if (!assignments?.length) return "No active assignments found for analysis.";

  // --- 1. Data Aggregation (Pre-fetching) ---
  // We fetch everything upfront to avoid the latency and complexity of AI tool-calling loops.
  const [grades, schedule] = await Promise.all([
    student?.id ? getStudentGrades(student.id).catch(() => []) : Promise.resolve([]),
    student?.id ? getStudentSchedule(student.id).catch(() => []) : Promise.resolve([])
  ]);

  // --- 2. Context Preparation ---
  const now = new Date();
  const currentDateStr = now.toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const context = {
    currentTime: currentDateStr,
    studentProfile: student ? {
      program: student.course,
      year: student.yearLevel,
      semester: student.semester
    } : "Standard Profile",
    academicStanding: grades.length > 0 ? grades.map(g => ({
      subject: g.description,
      grade: g.grade,
      status: g.remarks
    })) : "No grade data available.",
    classSchedule: schedule.length > 0 ? schedule.map(s => ({
      subject: s.subject,
      time: s.time,
      room: s.room
    })) : "No schedule data available.",
    assignments: assignments.map(a => ({
      title: a.title,
      course: a.courseName,
      status: a.state,
      due: a.dueDate ? `${a.dueDate.year}-${a.dueDate.month}-${a.dueDate.day}` : 'No due date',
      description: a.description || 'N/A'
    }))
  };

  // --- 3. Prompt Construction ---
  const systemPrompt = `
    You are the "Academic Success AI". 
    Analyze the student's workload and provide a strategic "Workload Insight Report".
    
    GUIDELINES:
    - Tone: Professional, supportive, and direct academic coach.
    - Audience: Address the student as "you".
    - Formatting: Use Markdown (Tables for assignments, Bold for emphasis, Blockquotes for pro-tips).
    - Logic: 
      1. Cross-reference assignments with Academic Standing. If a student is struggling in a subject (Grade > 3.0 or "Failed"), prioritize those assignments.
      2. Use the Class Schedule to suggest specific study windows (e.g., "Between your 10AM and 1PM classes").
      3. Calculate urgency based on the Current Time.

    REPORT STRUCTURE:
    ### 📊 Workload Status
    Summary of current pressure (High/Moderate/Low).
    
    ### 🔍 Priority Analysis
    A table of tasks sorted by a mix of Urgency (Due Date) and Academic Risk (Subject Grade).
    
    ### 💡 Strategic Study Plan
    Actionable advice on WHEN and WHAT to study based on the student's actual gaps in their schedule.
  `;

  const userPrompt = `
    Analyze my current academic situation and generate my report:
    ${JSON.stringify(context, null, 2)}
  `;

  // --- 4. AI Execution (Single Turn) ---
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/v1/chat/completions`,
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ 
          model: MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2500,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare AI Error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;

    return typeof content === 'string' ? content : JSON.stringify(content) || "Analysis complete.";

  } catch (error: any) {
    console.error("Workload Analysis Error:", error);
    throw new Error(error.message || "The AI system is currently unavailable.");
  }
}

/**
 * Meeting Transcription Summarizer
 * 
 * Logic:
 * 1. Takes the raw transcript and summarizes it into a study guide.
 */
export async function summarizeMeeting(
  transcript: string,
  student?: Student
) {
  const API_TOKEN = process.env.AI_WORKER_API;
  const ACCOUNT_ID = "6fc752615c51f96c4ce397b92c40fdd6";
  const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"; 

  if (!API_TOKEN) throw new Error("AI System configuration is missing.");
  if (!transcript) return "No transcript provided for analysis.";

  const systemPrompt = `
    You are the "Academic Success AI". 
    Provide a professional and structured "Meeting Insight Report" based on the provided class or meeting transcript.
    
    GUIDELINES:
    - Tone: Strictly professional, objective, and academic.
    - Audience: Address the student directly and concisely.
    - Formatting: Use Markdown. Ensure clear section headers and bulleted lists.
    - Constraint: Do not use emojis or informal language.
    
    REPORT STRUCTURE:
    ### Meeting Summary
    A concise overview (2-3 sentences) of the primary objectives and topics discussed during the session.
    
    ### Key Points
    A structured list of the most critical concepts, data points, or announcements mentioned.
    
    ### Strategic Action Items
    A prioritized list of specific tasks or follow-up actions the student must undertake based on the session content.
  `;

  const userPrompt = `
    Summarize this meeting transcript for me:
    ---
    ${transcript}
    ---
    Student Name: ${student?.name || "Student"}
  `;

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/v1/chat/completions`,
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ 
          model: MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2500,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare AI Error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result.choices[0].message.content || "Summary complete.";

  } catch (error: any) {
    console.error("Meeting Summary Error:", error);
    throw new Error(error.message || "The AI system is currently unavailable.");
  }
}
