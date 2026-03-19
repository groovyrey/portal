"use server";

import { Student } from "@/types";

/**
 * Specialized Visualization Agent
 * Uses Cloudflare Llama 3.3 70B to generate complex HTML/Three.js payloads.
 */
export async function generateVisualization(
  prompt: string,
  context?: string
) {
  const API_TOKEN = process.env.AI_WORKER_API;
  const ACCOUNT_ID = "6fc752615c51f96c4ce397b92c40fdd6";
  const MODEL = "@cf/qwen/qwen2.5-coder-32b-instruct"; 

  if (!API_TOKEN) throw new Error("Academic system configuration is missing.");

  const systemPrompt = `
    You are the "Specialized Academic Frontend Architect" for LCC Hub.
    Your goal is to generate a premium, responsive, and interactive HTML/Tailwind component that visualizes the provided data.

    ### 1. COMPONENT STRUCTURE (CRITICAL)
    - **Root Element:** You MUST wrap everything in a single container: \`<div class="w-full min-h-screen flex flex-col p-4 md:p-6 space-y-6 bg-background text-foreground animate-in fade-in duration-700">\`.
    - **Layout:** Use \`flex\` or \`grid\`. For dashboards, use \`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\`.
    - **Responsiveness:** Always design for mobile portrait first, then add \`md:\` and \`lg:\` modifiers.
    - **Theme Integration:** You MUST use these Tailwind classes to match the app theme:
      - Backgrounds: \`bg-background\` (main), \`bg-card\` (panels/cards), \`bg-accent\` (interactive).
      - Text: \`text-foreground\` (primary), \`text-muted-foreground\` (secondary), \`text-primary\` (brand).
      - Borders: \`border border-border\`.
    
    ### 2. DESIGN LANGUAGE (Apple/Vercel Style)
    - **Cards:** \`bg-card/50 backdrop-blur-md border border-border/50 rounded-3xl shadow-sm p-6 hover:shadow-md transition-all\`.
    - **Typography:** San-serif "Inter". Headings: \`font-bold tracking-tight\`.
    - **Icons:** Use Lucide icons: \`<i data-lucide="icon-name" class="w-5 h-5"></i>\`.
    
    ### 3. INTERACTIVITY & LIBRARIES (Pre-installed)
    - **Charts (Chart.js):** \`<canvas id="myChart"></canvas>\` + \`<script>new Chart(...)</script>\`.
    - **Animations (GSAP):** \`gsap.from(".card", {y: 20, opacity: 0, stagger: 0.1})\`.
    - **Math/3D:** Use Three.js only for complex spatial concepts.
    
    ### 4. DATA HANDLING
    - If specific student data (grades, schedule, finance) is provided in the context, visualize it accurately.
    - If no data is provided, generate a realistic "Skeleton" or "Demo" state to show layout.
    
    ### 5. OUTPUT RULES
    - Return **ONLY** the raw HTML code. 
    - **DO NOT** use markdown code blocks (\`\`\`).
    - **DO NOT** include \`<!DOCTYPE html>\` or \`<html>\` tags. Return the component fragment only.
    - **DO NOT** add conversational text.
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
            { role: "user", content: `DATA CONTEXT:\n${context || "No specific data provided."}\n\nREQUEST:\n${prompt}` }
          ],
          temperature: 0.1, // Lower temperature for more stable code generation
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) throw new Error("Specialized agent visualization failed");

    const result = await response.json();
    let html = result.choices[0].message.content || "";
    
    // Improved Robust Extraction Logic:
    const extractHtml = (str: string) => {
        let content = str.trim();
        
        // 1. Check for markdown code blocks first
        const match = content.match(/```(?:html|xml|javascript|js|css)?\s*([\s\S]*?)```/i);
        if (match) return match[1].trim();
        
        // 2. Look for the first < and last >
        const firstTag = content.indexOf('<');
        const lastTag = content.lastIndexOf('>');
        
        if (firstTag !== -1 && lastTag !== -1 && lastTag > firstTag) {
            return content.substring(firstTag, lastTag + 1).trim();
        }
        
        return content;
    };

    html = extractHtml(html);
    return html;
  } catch (error) {
    console.error("Specialized Agent Visualization Error:", error);
    return `<div class="p-8 text-center bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 font-bold uppercase tracking-tight">Visualization Engine Offline</div>`;
  }
}
