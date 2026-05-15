# LCC Hub - Student Portal

LCC Hub is a modern, AI-enhanced academic workspace designed for students of La Concepcion College (LCC). It acts as a sophisticated wrapper around the legacy "Schoolista" portal, scraping academic data and enhancing it with local caching, realtime notifications, and a Gemini-powered study assistant.

> [!IMPORTANT]
> **LCC Hub** is an unofficial, student-led project. It is not affiliated with, authorized, or endorsed by La Concepcion College.

## 🚀 Key Features

- **🎓 Unified Dashboard:** Mobile-first interface built with Tailwind CSS v4, providing instant access to grades, schedules, and financials.
- **🤖 Gemini-Powered Assistant:** A specialized ReAct agent with access to student records, capable of performing complex math (Python), web searches, and research.
- **⚡ Realtime Synchronization:** Powered by **Ably**, ensuring instant updates for grades and school announcements.
- **💾 Offline Resilience:** A "Local-First" strategy using **Turso (LibSQL)** allows access to academic records even when the official portal is offline.
- **🏆 Academic Gamification:** A badge system that automatically tracks and awards achievements based on academic performance.
- **🛡️ Secure Session Management:** AES-256-CBC encryption for session tokens with no permanent storage of user passwords.

## 🛠️ Technical Architecture

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **State Management:** [TanStack Query v5](https://tanstack.com/query/latest) for server state; [Zustand](https://zustand-demo.pmnd.rs/) for global UI state.
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), and [Lucide React](https://lucide.dev/).
- **Charts:** [Recharts](https://recharts.org/) for academic data visualization.

### Backend
- **Runtime:** Next.js Server Actions & API Routes (Node.js).
- **Database:** [Turso (LibSQL)](https://turso.tech/) for edge-optimized data storage.
- **Realtime:** [Ably](https://ably.com/) for pub/sub messaging and notifications.
- **Scraping:** [Cheerio](https://cheerio.js.org/) and [Axios](https://axios-http.com/) with cookie jar support for legacy portal integration.

### AI & Intelligence
- **Orchestration:** [LangChain](https://js.langchain.com/) for agentic workflows.
- **Main Model:** [Google Gemini](https://aistudio.google.com/) (`gemma-4-26b-a4b-it`).
- **Code Execution:** [Vercel Sandbox](https://vercel.com/docs/functions/serverless-functions/runtime#sandbox) for secure Python 3.13 math execution.
- **Speech:** [Deepgram](https://www.deepgram.com/) for low-latency Speech-to-Text (STT) and Text-to-Speech (TTS).

## 📂 Project Structure

```
/
├── app/                    # Next.js App Router (Pages & API)
│   ├── api/                # Backend API endpoints (AI, Student, Auth)
│   └── (routes)/           # UI Pages (Dashboard, Grades, Settings)
├── components/             # React Components
│   ├── dashboard/          # Academic widgets (Grades, Schedule, etc.)
│   ├── layout/             # App shell (Navbar, Sidebar)
│   └── shared/             # Reusable UI primitives
├── lib/                    # Business Logic & Core Services
│   ├── scraper-service.ts  # Legacy portal scraping logic
│   ├── sync-service.ts     # Data synchronization engine
│   ├── turso.ts            # LibSQL client configuration
│   └── auth.ts             # Encryption & Session management
├── public/                 # Static assets & documentation
└── types/                  # TypeScript interface definitions
```

## ⚙️ Development Setup

### Prerequisites
- Node.js 20+
- Turso CLI (for local DB testing)
- API Keys for: Gemini, Ably, Deepgram, and Vercel Sandbox.

### Environment Configuration
Create a `.env.local` file based on `.env.example`:

```bash
# Core
SESSION_SECRET=your_32_byte_hex_string
TURSO_DATABASE_URL=your_turso_url
TURSO_AUTH_TOKEN=your_turso_token

# AI & Services
GEMINI_API_KEY=your_gemini_key
ABLY_API_KEY=your_ably_key
DEEPGRAM_API_KEY=your_deepgram_key
VERCEL_PROJECT_ID=your_vercel_project_id
```

### Installation
```bash
npm install
npm run dev
```

## 📜 Technical Implementation Notes

### Authentication & Scraping
The system uses a custom session proxy (`lib/session-proxy.ts`) to manage persistent connections to the Schoolista portal. It extracts `__VIEWSTATE` and `__EVENTVALIDATION` tokens to simulate a browser session, allowing for secure data extraction without storing passwords in plain text.

### AI Tool Suite
The Portal Assistant is equipped with several tools:
- `execute_math`: Runs Python code in a secure sandbox with support for `numpy`, `pandas`, and `sympy`.
- `get_grades` / `get_schedule`: Direct access to the cached Turso data.
- `web_search` / `youtube_search`: Real-time external research capabilities.

### Data Strategy
LCC Hub uses a "Stale-While-Revalidate" approach. Data is immediately served from the local Turso cache for sub-second load times, while a background sync (`SyncService`) fetches fresh data from the legacy portal and updates the cache.

---
<div align="center">
  <p>
    <sub>© 2026 LCC Hub Project.</sub><br />
    <sub>Built for the La Concepcion College Community.</sub>
  </p>
</div>
