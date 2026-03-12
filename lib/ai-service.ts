"use server";

import { Student } from "@/types";

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

  if (!API_TOKEN) throw new Error("Academic system configuration is missing.");
  if (!transcript) return "No transcript provided for analysis.";

  const systemPrompt = `
    You are the "Academic Recording System". 
    Provide a professional and structured "Insight Report" based on the provided class or meeting transcript.
    
    GUIDELINES:
    - Tone: Strictly professional, objective, and academic.
    - Audience: Address the student directly and concisely.
    - Formatting: Use Markdown. Ensure clear section headers and bulleted lists.
    - Constraint: Do not use emojis, informal language, or mention that you are an AI.
    
    REPORT STRUCTURE:
    ### Meeting Summary
    A concise overview (2-3 sentences) of the primary objectives and topics discussed during the session.
    
    ### Key Points
    A structured list of the most critical concepts, data points, or announcements mentioned.
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
