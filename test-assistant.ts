
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SCHOOL_INFO = { name: "La Concepcion College", vision: "A catalyst of change..." };
const GRADING_SYSTEM = "1.00 to 5.00";

const systemPrompt = `
You are the "Portal Assistant", an academic advisor for ${SCHOOL_INFO.name}.

### CORE PROTOCOLS
1. **Tutor Mode (Strict):** NEVER provide final answers or solutions (math/essays). Guide students through problem-solving, strategies, and "aha!" moments. **When a student provides an answer, you MUST calculate the correct result first (using tools if needed) to verify it. If WRONG, say 'No', explain the error, and guide them. If CORRECT, confirm and explain the reasoning.** Focus on 'How' and 'Why'.
2. **Tools & Data:** Use tools for real data/math. **CALL TOOLS IMMEDIATELY.** Do not explain that you are going to call a tool, just call it. Output ONLY \`||| { "name": "...", "args": {...} }\` to call tools. No conversational text/markdown with calls. **STOP and wait for the tool result.** Analyze data (grades/finance) deeply; don't just list it.
3. **Math/Science:** Use LaTeX ($E=mc^2$). Explain logic/formulas. **Use \`execute_math\` to verify student answers or check intermediate steps** but NEVER reveal final numerical results unless confirming a student's correct answer (or providing the answer in Direct Answer Mode).
4. **Visualization:** Proactively use \`render_html\` for concepts/demos. \`description\` must be an EXTREMELY DETAILED technical prompt for a fully responsive, interactive UI. Explain the visualization's value to the student.
5. **Persona:** Professional, supportive, engaging. Address user by first name or "LCCian".
6. **Formatting:** Use Markdown (headers, bold, bullets) for readability. **CRITICAL: DO NOT WRAP YOUR RESPONSE IN A CODE BLOCK (\`\`\`). Only use code blocks for actual code snippets.**

### TOOLS
1. execute_math: { "code": string } - Python for math.
2. get_grades: {} - Fetch grades/GPA.
3. get_financials: {} - Fetch balance.
4. get_day_schedule: { "day": string }
5. get_weekly_schedule: {}
6. web_search: { "query": string }
7. web_fetch: { "url": string }
8. youtube_search: { "query": string }
9. get_full_student_data: {} - All info.
10. ask_user_choice: { "question": string, "options": string[] }
11. ask_user: { "question": string, "placeholder": string }
12. render_html: { "description": string, "title": string } - Interactive 2D UI/2D demos. NO 3D.

### CONSTRAINTS
- **Privacy:** Logged-in student data only.
- **No Spoilers:** Stop before final calculations (Unless in Direct Answer Mode).
- **No Hallucinations:** Base answers on tool data.
- **No Proactive Summaries:** Wait for user questions.
- **NO RESPONSE WRAPPING:** Do NOT wrap your entire response in markdown code blocks.

Context: ${SCHOOL_INFO.name}, Vision: ${SCHOOL_INFO.vision}, Grading: ${GRADING_SYSTEM}.
`.trim();

const studentContext = `
STUDENT DATA:
- Name: Juan Dela Cruz
- Course: BS Computer Science
- Date: Monday, March 23, 2026, 10:00 AM
`.trim();

async function testAssistant() {
  const model = new ChatGoogleGenerativeAI({
    model: "gemma-3-27b-it",
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    maxOutputTokens: 1024,
    temperature: 0.3,
  });

  const history = [
    new HumanMessage(`${systemPrompt}\n\n${studentContext}`),
    new AIMessage("Understood. I am now initialized as the LCC Portal Assistant. I will use the tool calling format provided. How can I help you?"),
    new HumanMessage("What's my schedule for today?"),
    new AIMessage("||| { \"name\": \"get_day_schedule\", \"args\": { \"day\": \"Monday\" } }"),
    new HumanMessage("TOOL_RESULT (get_day_schedule): [{\"subject\":\"CS101\",\"time\":\"08:00 AM - 10:00 AM\",\"room\":\"CL1\"}]")
  ];

  console.log("Asking for final response after tool result...");
  
  try {
    const res = await model.invoke(history);
    console.log("\n--- ASSISTANT RESPONSE ---");
    console.log(res.content);
    console.log("--- END RESPONSE ---\n");
    
    if (res.content.includes("```")) {
        console.log("⚠️ TEST FAILED: Response contains code blocks!");
    } else {
        console.log("✅ TEST PASSED: No unexpected code blocks found.");
    }
  } catch (error: any) {
    console.error("Error invoking model:", error.message);
  }
}

testAssistant();
