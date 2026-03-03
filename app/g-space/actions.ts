"use server";

import { ClassroomAssignment, ClassroomCourse } from "@/types/g-space";
import { Student } from "@/types";
import { getStudentGrades, getStudentSchedule } from "@/lib/data-service";

export async function analyzeAssignments(
  assignments: ClassroomAssignment[], 
  student?: Student,
  courses?: ClassroomCourse[]
) {
  const API_TOKEN = process.env.AI_WORKER_API;
  const ACCOUNT_ID = "6fc752615c51f96c4ce397b92c40fdd6";
  const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"; 

  if (!API_TOKEN) {
    throw new Error("Academic Strategy System configuration is missing.");
  }

  if (!assignments || assignments.length === 0) {
    return "No active assignments found for analysis.";
  }

  // --- Tool Implementations (Internal functions for the tool loop) ---
  const tools = {
    get_academic_standing: async () => {
      if (!student?.id) return "Student context unavailable.";
      const grades = await getStudentGrades(student.id);
      return JSON.stringify(grades.map(g => ({
        code: g.code,
        subject: g.description,
        grade: g.grade,
        remarks: g.remarks
      })));
    },
    get_class_schedule: async () => {
      if (!student?.id) return "Schedule context unavailable.";
      const schedule = await getStudentSchedule(student.id);
      return JSON.stringify(schedule.map(s => ({
        subject: s.subject,
        description: s.description,
        time: s.time,
        room: s.room
      })));
    }
  };

  const now = new Date();
  const currentDateStr = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const assignmentContext = assignments.map(a => ({
    title: a.title,
    course: a.courseName,
    status: a.state,
    due: a.dueDate ? `${a.dueDate.year}-${a.dueDate.month}-${a.dueDate.day}` : 'No due date',
    dueTime: a.dueTime ? `${a.dueTime.hours.toString().padStart(2, '0')}:${(a.dueTime.minutes || 0).toString().padStart(2, '0')}` : 'Not specified',
    description: a.description || 'No description'
  }));

  const studentContext = student ? {
    program: student.course,
    yearLevel: student.yearLevel,
    semester: student.semester
  } : "Basic student profile.";

  const systemPrompt = `
    You are the "Academic Workload Analyzer". 
    Analyze the student's Google Classroom assignments and provide a high-impact "Workload Insight Report" specifically tailored for the student.

    CRITICAL: Always refer to the client as "the student" or "you" (addressing the student directly). Do NOT use terms like "the user" or "the client".
    
    Current System Time: ${currentDateStr}
    Student Profile Context: ${typeof studentContext === 'string' ? studentContext : JSON.stringify(studentContext)}

    MANDATORY TOOL USAGE:
    Before generating the report, you MUST call BOTH tools:
    1. get_academic_standing(): To see if the student is struggling in subjects related to their assignments.
    2. get_class_schedule(): To see the student's daily routine and identify study windows.

    Report Structure:
    1. **System Status**: Overview (High, Moderate, Clear). Use the Current System Time to calculate days remaining for each assignment.
    2. **Deep Analysis**: Urgent vs Complex tasks. Cross-reference with academic standing (from get_academic_standing) to prioritize subjects where the student is struggling.
    3. **Strategic Suggestions**: Data-driven advice for the student, including specific study windows identified from their schedule (from get_class_schedule).

    Strict Rules: 
    - Do NOT refer to yourself as an AI. Respond as a direct system report.
    - Do NOT use emojis in your response.
    - Maintain a supportive yet professional "academic coach" tone.
    - Ensure all information is visible and formatted for clarity.
    - Use Tables, Bold text, and Blockquotes for "Pro-Tips".
  `;

  let messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Here are the current assignment records:\n${JSON.stringify(assignmentContext, null, 2)}` }
  ];

  try {
    // Phase 1: Initial Call with Tool Support
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
          messages: messages,
          tools: [
            {
              type: "function",
              function: {
                name: "get_academic_standing",
                description: "Get the student's current grades and academic performance to identify subjects at risk.",
                parameters: { type: "object", properties: {} }
              }
            },
            {
              type: "function",
              function: {
                name: "get_class_schedule",
                description: "Get the student's class schedule to identify gaps and study windows between classes.",
                parameters: { type: "object", properties: {} }
              }
            }
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

    let result = await response.json();
    let message = result.choices[0].message;

    // Phase 2: Handle Tool Calls (if any)
    if (message.tool_calls && message.tool_calls.length > 0) {
      // Ensure assistant message content is at least an empty string (Cloudflare rejects null)
      messages.push({
        role: "assistant",
        content: message.content || "",
        tool_calls: message.tool_calls
      });
      
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name as keyof typeof tools;
        const toolResult = await tools[functionName]();
        
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult
        });
      }

      // Phase 3: Final Call with Tool Results
      const finalResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/v1/chat/completions`,
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ 
            model: MODEL,
            messages: messages.map(m => ({
              role: m.role,
              content: m.content || "", // Force string
              ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
              ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {})
            })),
            temperature: 0.3,
            max_tokens: 2500,
          }),
        }
      );

      if (!finalResponse.ok) {
        const errorText = await finalResponse.text();
        throw new Error(`Cloudflare AI Error (Final): ${finalResponse.status} ${errorText}`);
      }

      result = await finalResponse.json();
      message = result.choices[0].message;
    }

    return typeof message.content === 'string' ? message.content : JSON.stringify(message.content) || "";
  } catch (error: any) {
    console.error("Strategic Insight Generation Error:", error);
    throw new Error(error.message || "Failed to generate strategic insights via Cloudflare.");
  }
}
