import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { logIncident } from "./incident-service";

const model = new ChatGoogleGenerativeAI({
  model: "gemma-3-27b-it",
  apiKey: process.env.AI_SCRAPPER_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "NO_KEY",
  temperature: 0,
});

/**
 * AI-Powered Scraper Fallback
 * Extracts structured data from raw HTML using GPT-4o-mini when Cheerio fails.
 */
export async function aiExtract(html: string, task: 'student_info' | 'schedule' | 'financials' | 'grades' | 'offered_subjects', userId?: string) {
  console.log(`[AI-Scraper] Start extraction: ${task}`);
  
  // Clean HTML to reduce tokens
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/\s+/g, ' ')
    .substring(0, 40000); 

  console.log(`[AI-Scraper] Clean HTML length: ${cleanHtml.length}`);

  const systemPrompts = {
    student_info: "Extract student profile information (Name, Student ID, Course, Year, Semester, Email, Address, Mobile). Return a clean JSON object matching the Student interface.",
    schedule: "Extract the class schedule table. Return a JSON array of objects with: subject, description, section, units, time, room, instructor.",
    financials: "Extract financial data (Total Assessment, Outstanding Balance, Due Today, Installment plans). Return a structured JSON object.",
    grades: "Extract the subjects and grades from the report card table. Return a JSON array of objects with: code, description, grade, units, remarks.",
    offered_subjects: "Extract the list of offered subjects. Return a JSON array of objects with: code, description, units, preReq."
  };

  const prompt = `
    You are an expert web scraper for a legacy ASP.NET student portal. 
    Analyze the provided HTML and extract the ${task.replace('_', ' ')}.

    ### HTML SNIPPET:
    ${cleanHtml}

    ### OUTPUT RULES:
    1. Return ONLY a valid JSON object/array.
    2. NO conversational text, NO markdown code blocks.
    3. If data is missing, use null or empty string.
  `;

  let responseContent = '';
  try {
    console.log(`[AI-Scraper] Invoking model for ${task}...`);
    
    const combinedPrompt = `
SYSTEM INSTRUCTION:
${systemPrompts[task]}

USER REQUEST:
${prompt}
    `.trim();

    const response = await model.invoke([
      new HumanMessage(combinedPrompt)
    ]);
    console.log(`[AI-Scraper] Model responded for ${task}`);

    responseContent = response.content.toString();
    const content = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(content);
    console.log(`[AI-Scraper] Successfully parsed JSON for ${task}`);

    // Log this successful repair as a warning-level incident
    await logIncident({
        task: `repair_${task}`,
        user_id: userId,
        error_message: `Cheerio failed, AI repair triggered.`,
        ai_result: parsed,
        raw_html: cleanHtml,
        severity: 'warning'
    });

    return parsed;
  } catch (error) {
    console.error(`[AI-Scraper] Repair failed for ${task}:`, error);

    // Log the fatal AI failure as an error-level incident
    await logIncident({
        task: `fatal_repair_${task}`,
        user_id: userId,
        error_message: error instanceof Error ? error.message : String(error),
        ai_result: responseContent || 'No response',
        raw_html: cleanHtml,
        severity: 'error'
    });

    return null;
  }
}
