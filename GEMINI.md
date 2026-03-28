# LCC Hub - Student Portal

## 1. Project Overview

LCC Hub is a sophisticated student portal for La Concepcion College (LCC) students. It acts as a modern, AI-enhanced wrapper around the legacy "Schoolista" portal. It scrapes data from the official portal, enhances it with local caching and AI features, and presents it in a responsive Next.js 16 application.

**Core Value Proposition:**
*   **Modern UX:** A responsive, mobile-first interface replacing the legacy portal.
*   **AI Study Companion:** "Schoolista" Assistant (Gemini-powered) with Python execution and interactive visualizations.
*   **Resilience:** Caches data to allow access even when the official portal is down.
*   **Integration:** Connects with Google Classroom (G-Space) and provides realtime updates.

## 2. Technical Architecture

### Frontend (Client)
*   **Framework:** Next.js 16 (App Router)
*   **State Management:** React Query (`@tanstack/react-query`) for server state; Context API for global UI state.
*   **Styling:** Tailwind CSS v4, Framer Motion (animations), Lucide React (icons).
*   **Components:** Modular architecture in `components/`.
    *   `components/layout`: App shell (Navbar, Sidebar, Footer).
    *   `components/dashboard`: Widgets for grades, schedule, financials.
    *   `components/shared`: Reusable UI elements (Providers, Toast).

### Backend (Server)
*   **Runtime:** Next.js Server Actions & API Routes (Node.js environment).
*   **Database:**
    *   **Firebase Firestore:** Stores user profiles, logs, settings, and cached portal data.
    *   **LibSQL (Turso):** Relational data (likely for analytics or structured features).
*   **Authentication:** Hybrid approach.
    *   **Credential Scraping:** Logs into the legacy portal to validate identity.
    *   **Session Management:** Custom encrypted HTTPOnly cookie (`session_token`).
*   **Realtime:** **Ably** for pushing notifications and status updates.

### AI & Intelligence Layer
*   **Orchestrator:** **LangChain**
*   **LLM:** **Google Gemini** (`gemma-3-27b-it` via `ChatGoogleGenerativeAI`).
*   **Code Execution:** **Vercel Sandbox** (`@vercel/sandbox`) for running Python math/data analysis secure.
* **Visualization:** **Cloudflare Workers AI** (`@cf/nvidia/nemotron-3-120b-a12b`) for generating interactive HTML/JS components on the fly.
*   **Voice:** **Deepgram** for speech-to-text.

## 3. Key Workflows & Implementation Details

### 3.1 Authentication & Scraping (`app/api/student/login`)
The login process is complex to ensure security and reliability:
1.  **Request:** User submits Student ID and Password.
2.  **Session Proxy:** `lib/session-proxy.ts` manages a persistent connection jar. It checks for an existing valid session to avoid unnecessary logins.
3.  **Locking:** Uses `acquireRefreshLock` to prevent race conditions during login.
4.  **Scraping:** Uses `cheerio` to parse the legacy ASP.NET portal.
    *   Extracts `__VIEWSTATE`, `__EVENTVALIDATION`, etc.
    *   Submits the login form.
    *   Checks for success indicators (absence of login button, presence of student name).
5.  **Sync:** `SyncService` scrapes the dashboard (Schedule, Financials, Grades) immediately upon login and caches it to Firestore.
6.  **Token Generation:**
    *   Encrypts `userId` and `password` using AES-256-CBC (`lib/auth.ts`).
    *   Sets `session_token` (HTTPOnly) and `portal_session_active` (Client-readable) cookies.

### 3.2 AI Assistant (`app/api/ai/assistant`)
The assistant is a "ReAct-style" agent with custom tool handling:
*   **System Prompt:** Defines the persona ("Portal Assistant"), strict rules (LaTeX for math, no hallucinations), and available tools.
*   **Tool Calling:** The model outputs a specific token `||| { "name": "..." }`. The server parses this, executes the tool, and feeds the result back to the model.
*   **Tools:**
    *   `execute_math`: Runs Python code in a secure Vercel Sandbox. Supports `numpy`, `pandas`, `scipy`, `matplotlib` (headless), `sympy`.
    *   `render_html`: Generates a "Specialized Agent" prompt for Cloudflare AI to create UI components (Dashboards, 2D visualizations, interactive demos).
    *   `get_grades` / `get_schedule`: Fetches data from the local Firestore cache.
    *   `web_search` / `youtube_search`: External lookups.
*   **Streaming:** Responses are streamed via `TransformStream` to the client.

### 3.3 Data Synchronization
*   **Strategy:** "Stale-while-revalidate" inspired.
*   **Primary Source:** Firestore cache is the source of truth for the UI (`useStudentQuery` in `lib/hooks.ts`).
*   **Background Sync:** The `ScraperService` runs periodically (or on specific triggers) to fetch fresh data from the legacy portal and update Firestore.
*   **Client:** React Query handles caching on the frontend. `localStorage` is used for an immediate "offline-first" render before the query freshens the data.

## 4. Directory Structure

```
/
├── app/                    # Next.js App Router
│   ├── api/                # Backend API endpoints
│   │   ├── student/        # Student-related endpoints (login, me, grades)
│   │   ├── ai/             # AI endpoints (assistant, chat)
│   │   └── admin/          # Admin endpoints
│   ├── (routes)/           # UI Pages (dashboard, settings, etc.)
│   └── layout.tsx          # Root layout with Providers
├── components/             # React Components
│   ├── auth/               # Login forms & modals
│   ├── dashboard/          # Student dashboard widgets
│   ├── shared/             # Layout & generic UI
│   └── ui/                 # Design system primitives
├── lib/                    # Business Logic
│   ├── ai-service.ts       # AI visualization logic
│   ├── auth.ts             # Encryption & Role checks
│   ├── db.ts               # Firebase init
│   ├── scraper-service.ts  # Legacy portal scraping logic
│   └── session-proxy.ts    # Connection management
├── types/                  # TypeScript Interfaces
└── public/                 # Static assets
```

## 5. Configuration & Environment

The application requires a robust `.env.local` configuration:

### Critical Keys
*   `SESSION_SECRET`: 32-byte hex string for cookie encryption.
*   `NEXT_PUBLIC_FIREBASE_*`: Firebase configuration.
*   `FIREBASE_ADMIN_*`: Service account for server-side Firestore access.

### AI Services
*   `GEMINI_API_KEY` / `GOOGLE_API_KEY`: For the main chat model.
*   `AI_WORKER_API`: Cloudflare Workers AI token.
*   `VERCEL_PROJECT_ID` / `VERCEL_TEAM_ID`: For Vercel Sandbox.
*   `YOUTUBE_API_KEY`: For video search.

### Integration
*   `ABLY_API_KEY`: For realtime updates.

## 6. Development Guidelines

*   **Type Safety:** Strict TypeScript usage. defined in `types/index.ts`.
*   **Styling:** Mobile-first Tailwind. Use `clsx` or `cn` helper for class merging.
*   **Commits:** Follow conventional commits.
*   **Testing:** (Placeholder - no explicit test runner seen in `package.json`, possibly manual or using Next.js default).

## 7. Database Schema (Inferred)

### Firestore Collections
*   `students/{studentId}`: Main profile document.
    *   `schedule`: Array of classes.
    *   `financials`: Balance and payment history.
    *   `grades`: Nested or array of semester grades.
    *   `settings`: User preferences (notifications, AI settings).
*   `logs/{logId}`: Activity logs (logins, errors).
*   `admin_stats`: aggregated statistics.

## 8. Common Scripts

*   `npm run dev`: Start development server.
*   `npm run build`: Production build.
*   `npm run start`: Start production server.
*   `npm run lint`: Run ESLint.
