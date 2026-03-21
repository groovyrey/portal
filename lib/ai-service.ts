"use server";

import { Student } from "@/types";

/**
 * Specialized Visualization Agent
 * Uses Cloudflare Qwen 2.5 Coder 32B to generate high-performance HTML/Tailwind/JS payloads.
 */
export async function generateVisualization(
  prompt: string,
  context?: string
) {
  const API_TOKEN = process.env.AI_WORKER_API;
  const ACCOUNT_ID = process.env.ACCOUNT_ID;
  const MODEL = "@cf/qwen/qwen2.5-coder-32b-instruct"; 

  if (!API_TOKEN) throw new Error("Academic system configuration is missing.");

  const systemPrompt = `
    You are the "LCC Hub Visualizer", a world-class frontend engineer specializing in educational simulations and data dashboards.
    Generate a high-performance, responsive, and aesthetically pleasing HTML/Tailwind/JS fragment.

    ### DESIGN STANDARDS
    - **Container:** Use <div class="w-full h-full min-h-[400px] flex flex-col bg-card/60 backdrop-blur-md text-card-foreground rounded-3xl border border-border shadow-xl animate-in fade-in duration-500 overflow-hidden relative">.
    - **Theming:** Support dark mode using "dark:" utilities and Tailwind's semantic colors (primary, card, border, etc.).
    - **Fluid Layout:** Use percentage-based widths (e.g., "w-full", "w-1/2") or "flex-1" for main content areas. Avoid fixed pixel widths for containers. Ensure content resizes gracefully.
    - **Mobile-First:** Ensure all layouts flow naturally on small screens (flex-col on mobile, flex-row on desktop). Controls should be touch-friendly (min-height 44px).

    ### PERFORMANCE & LOGIC
    - **Efficiency:** Minimize DOM operations. Use requestAnimationFrame for smooth 60FPS animations.
    - **Responsiveness:**
      - Listen for window resize events to dynamically update Canvas dimensions.
      - Use 'resize' event listeners or ResizeObserver on the container.
      - Ensure 'touch' and 'pointer' events are handled for mobile interaction.
      - Add 'touch-action: none' to interactive canvases to prevent scrolling while interacting.
    - **Lightweight:** Only load external libraries if strictly necessary. Prefer native browser APIs.
    - **State Management:** Manage UI and simulation state within a single JavaScript object.

    ### FEATURES & ASSETS
    - **Interactivity:** Include a compact "Control Deck" for parameters (sliders, toggles).
    - **Visuals:** Use Canvas 2D for complex graphics and SVG for diagrams. No external images.
    - **Libraries (CDN):** Chart.js, GSAP, Matter.js, Lucide Icons, Anime.js.

    ### OUTPUT PROTOCOL
    - **STRICTLY RAW HTML ONLY.** No markdown blocks, no preamble, no doctype.
    - Encapsulate all CSS (<style>) and JS (<script>) within the fragment.
    - Code must be production-ready, error-free, and handle missing data gracefully.
  `.trim();

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
          temperature: 0.1,
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudflare AI API Error Response:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText
        });
        throw new Error(`Specialized agent visualization failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    let html = result.choices[0].message.content || "";
    
    // Robust Extraction Logic:
    const extractHtml = (str: string) => {
        let content = str.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        
        // 1. Check for markdown code blocks
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

