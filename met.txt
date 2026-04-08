# LCC Hub: Project Methodology & Action Plan

## PART 1: RESEARCH METHODOLOGY

### 1. Research Design & Approach
The project follows a System Development Life Cycle (SDLC) approach, specifically utilizing an iterative prototyping model. This allows for continuous refinement of the scraping logic and AI response accuracy.
- Method: Applied Research (Modernizing Legacy Systems).
- Framework: Agile-Scrum (Iterative sprints for UI, Scraping, and AI layers).

### 2. System Architecture Design
The architecture is divided into four distinct layers to ensure modularity and scalability:
- Presentation Layer: Next.js 16 (App Router) with Tailwind CSS v4 for a mobile-first, responsive interface.
- Intelligence Layer: LangChain orchestrating Google Gemini for natural language processing and task execution.
- Data Acquisition Layer: A custom scraping engine using `cheerio` and `lib/session-proxy.ts` to interface with the legacy ASP.NET portal.
- Persistence Layer: Hybrid storage using Firebase Firestore (unstructured student data) and Turso (relational analytics).

### 3. Data Collection & Processing Methodology
Since the project relies on external data, a multi-stage synchronization strategy is employed:
1. Authentication Proxying: Encrypted credential forwarding to validate identity against the legacy "Schoolista" system.
2. Web Scraping: Extraction of HTML nodes (Grades, Schedules, Financials) using CSS selectors.
3. Data Normalization: Converting raw HTML/ASP.NET state data into structured JSON format.
4. Caching (Stale-While-Revalidate): Implementing an "offline-first" approach where Firestore serves as the immediate source of truth, updated by background syncs.

### 4. AI Implementation Strategy (The "Assistant" Protocol)
The AI Assistant uses a ReAct (Reasoning and Acting) pattern:
- Prompt Engineering: Strict system instructions (LaTeX for math, persona-driven responses).
- Dynamic Tool Calling:
    - Code Execution: Python-based math/data analysis via Vercel Sandbox.
    - Generative UI: Using Cloudflare Workers AI to create interactive HTML/JS components for data visualization.
- Real-time Communication: Leveraging Ably for low-latency feedback during complex AI operations.

### 5. Security & Privacy Framework
To protect sensitive student information, the methodology incorporates:
- Encryption: AES-256-CBC for local session token storage.
- Session Isolation: HTTPOnly cookies to prevent Cross-Site Scripting (XSS).
- Secure Sandboxing: Isolating all AI-generated code execution within ephemeral environments.

### 6. Verification & Evaluation
The system's effectiveness is measured against three key metrics:
1. Sync Reliability: Success rate of scraping operations across different network conditions.
2. Latency: Response time of the Gemini-powered assistant vs. manual portal navigation.
3. UI/UX Accessibility: Evaluation of the modern interface compared to the legacy ASP.NET portal's usability.

---

## PART 2: ACTION PLAN

### Phase 1: Infrastructure & Authentication (Foundations)
- Step 1.1: Environment Setup: Configure Firebase (Firestore), Turso (LibSQL), and Ably API keys in `.env.local`.
- Step 1.2: Database Initialization: Run `lib/db-init.ts` to set up Firestore collections.
- Step 1.3: Secure Auth Bridge: Implement the AES-256-CBC encryption in `lib/auth.ts` to safely store legacy portal credentials.
- Step 1.4: Proxy Implementation: Finalize `lib/session-proxy.ts` to handle persistent cookie jars for the legacy portal.

### Phase 2: Data Acquisition & Synchronization (The Engine)
- Step 2.1: Scraper Development: Build CSS selectors in `lib/scraper-service.ts` to extract Grades, Schedules, and Financials from the legacy HTML.
- Step 2.2: Login Workflow: Finalize `app/api/student/login` to perform the "Handshake" (Scrape -> Authenticate -> Sync).
- Step 2.3: Sync Service: Implement the background `SyncService` to refresh Firestore data whenever a student accesses the dashboard.
- Step 2.4: Error Handling: Create robust retry logic for when the legacy portal is slow or down (Offline-First mode).

### Phase 3: AI Assistant & Intelligence Layer (The Brain)
- Step 3.1: LLM Integration: Set up the Gemini orchestrator in `app/api/ai/assistant`.
- Step 3.2: Tool Protocol: Implement the "ReAct" parser to handle `execute_math` (Vercel Sandbox) and `render_html` (Cloudflare Workers AI).
- Step 3.3: Contextual Memory: Connect the assistant to the Firestore `grades` and `schedule` data so it can answer personal student questions.
- Step 3.4: Streaming UI: Build the frontend chat interface in `components/assistant` with support for LaTeX and interactive widgets.

### Phase 4: Frontend Development (The Face)
- Step 4.1: Layout & Navigation: Implement the `Navbar`, `Drawer`, and `TabbedPageLayout` in `components/layout`.
- Step 4.2: Dashboard Widgets: Build the visual cards for `GradesList`, `ScheduleTable`, and `FinancialSummary` using Framer Motion.
- Step 4.3: Real-time UI: Integrate Ably in `components/shared/RealtimeProvider.tsx` to push live notifications to the student.
- Step 4.4: Theme & Styling: Apply the Tailwind CSS v4 design system with a dark/light mode toggle.

### Phase 5: Testing & Optimization (The Quality)
- Step 5.1: Performance Audit: Optimize Next.js Image components and minimize CSS bundle size.
- Step 5.2: Scraping Resilience: Stress-test the scraper against different legacy portal states (e.g., during maintenance).
- Step 5.3: Security Review: Audit the `session_token` (HTTPOnly) and ensure no API keys are leaked in client-side bundles.
- Step 5.4: User Acceptance: Verify that data displayed in LCC Hub perfectly matches the legacy "Schoolista" portal.

### Phase 6: Deployment & Maintenance (The Launch)
- Step 6.1: Vercel Deployment: Configure the project on Vercel, ensuring all environment variables are synced.
- Step 6.2: Analytics: Set up admin monitoring in `components/admin/MonitoringTab.tsx` to track sync successes and AI usage.
- Step 6.3: Documentation: Update the `README.md` and `GEMINI.md` with final API documentation and troubleshooting guides.
