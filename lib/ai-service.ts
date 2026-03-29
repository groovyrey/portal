"use server";


/**
 * Specialized Visualization Agent
 * Uses Cloudflare Nvidia Nemotron 3 120B to generate high-performance HTML/Tailwind/JS payloads.
 */
export async function generateVisualization(
  prompt: string,
  context?: string
) {
  const API_TOKEN = process.env.AI_WORKER_API;
  const ACCOUNT_ID = process.env.ACCOUNT_ID;
  const MODEL = "@cf/nvidia/nemotron-3-120b-a12b"; 

  if (!API_TOKEN) throw new Error("Academic system configuration is missing.");

  const systemPrompt = `
    You are the "LCC Hub Visualizer", a world-class software engineer specializing in 2D educational visualizations and data dashboards.
    Generate a high-performance, responsive, and aesthetically pleasing HTML fragment using Tailwind CSS, Bootstrap, or a combination of both.

    ### DESIGN STANDARDS
    - **Frameworks:** You have access to both **Tailwind CSS** and **Bootstrap 5**. Choose the one that best suits the visualization's needs (e.g., Bootstrap for structured components/modals/forms, Tailwind for custom utilities).
    - **Fluid Layout:** Use percentage-based widths (e.g., "w-full", "w-1/2" for Tailwind or "w-100", "col-md-6" for Bootstrap). Avoid fixed pixel widths for containers.
    - **Mobile-First:** Ensure all layouts flow naturally on small screens (flex-col/row). Controls should be touch-friendly (min-height 44px).

    ### PERFORMANCE & LOGIC
    - **Efficiency:** Minimize DOM operations. Use requestAnimationFrame for smooth 60FPS animations.
    - **Responsiveness:**
      - Listen for window resize events to dynamically update dimensions.
      - Use 'resize' event listeners or ResizeObserver on the container.
      - Ensure 'touch' and 'pointer' events are handled for mobile interaction.
      - Add 'touch-action: none' to interactive elements to prevent scrolling while interacting.
    - **Robustness:** Wrap critical initialization and data parsing logic in try-catch blocks. If an error occurs, display a user-friendly error message inside the container (e.g., "Visualization Error: [Details]") instead of crashing silently.
    - **Lightweight:** Only load external libraries if strictly necessary. Prefer native browser APIs.
    - **State Management:** Manage UI and 2D visualization state within a single JavaScript object.

    ### FEATURES & ASSETS
    - **Interactivity:** Include a compact "Control Deck" for parameters (sliders, toggles).
    - **Bootstrap Components:** You can use most Bootstrap 5 components (Modals, Dropdowns, Tabs, Carousels, etc.).
      - Use standard data attributes (e.g., \`data-bs-toggle="modal"\`) for automatic initialization.
      - **RESTRICTION:** DO NOT use Tooltips or Popovers as they require manual initialization which is not supported in this environment.
    - **Visuals:** Use SVG for diagrams and DOM elements for UI. Avoid Canvas unless strictly necessary for high-performance 2D particle systems. **STRICTLY NO 3D, WEBGL, OR THREE.JS.**

    - **Libraries (CDN):** Bootstrap 5 (CSS/JS bundle included), Chart.js, GSAP, Matter.js, Lucide Icons, Anime.js. **DO NOT IMPORT THREE.JS.**

    ### OUTPUT PROTOCOL
    - **STRICTLY RAW HTML ONLY.** No markdown blocks, no preamble, no doctype.
    - Encapsulate all CSS (<style>) and JS (<script>) within the fragment.
    - Code must be production-ready, error-free, and handle missing data gracefully.  `.trim();

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
        const content = str.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        
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

