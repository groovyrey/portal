import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  maxOutputTokens: 2048,
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  temperature: 0,
});

/**
 * AI-Powered Scraper Fallback
 * Extracts structured data from raw HTML using Gemini when Cheerio fails.
 */
export async function aiExtract(html: string, task: 'student_info' | 'schedule' | 'financials' | 'grades' | 'offered_subjects') {
  console.log(`[AI-Scraper] Attempting repair extraction for: ${task}`);
  
  // Clean HTML to reduce tokens (remove scripts, styles, etc.)
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/\s+/g, ' ')
    .substring(0, 50000); // Limit to ~50k chars to stay safe

  const systemPrompts = {
    student_info: "Extract student profile information (Name, Student ID, Course, Year, Semester, Email, Address, Mobile). Return a clean JSON object matching the Student interface.",
    schedule: "Extract the class schedule table. Return a JSON array of objects with: subject, description, section, units, time, room, instructor.",
    financials: "Extract financial data (Total Assessment, Outstanding Balance, Due Today, Installment plans). Return a structured JSON object.",
    grades: "Extract the subjects and grades from the report card table. Return a JSON array of objects with: code, description, grade, units, remarks.",
    offered_subjects: "Extract the list of offered subjects. Return a JSON array of objects with: code, description, units, preReq."
  };

  const prompt = `
    You are an expert web scraper for a legacy ASP.NET student portal. 
    The traditional parser failed. Analyze the provided HTML and extract the ${task.replace('_', ' ')}.

    ### HTML SNIPPET:
    ${cleanHtml}

    ### OUTPUT RULES:
    1. Return ONLY a valid JSON object/array.
    2. NO conversational text, NO markdown code blocks.
    3. If data is missing, use null or empty string.
    4. Be extremely precise with names and numbers.
  `;

  try {
    const response = await model.invoke([
      new SystemMessage(systemPrompts[task]),
      new HumanMessage(prompt)
    ]);

    let content = response.content.toString();
    
    // Clean up potential markdown formatting if the model ignored instructions
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(content);
  } catch (error) {
    console.error(`[AI-Scraper] Repair failed for ${task}:`, error);
    return null;
  }
}
