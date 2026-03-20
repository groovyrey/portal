<div align="center">
  <h1>LCC HUB</h1>
  <h3>The Intelligent Student Portal</h3>
  <p>
    A next-generation academic ecosystem for La Consolacion College. <br />
    Refining the student experience with AI, Realtime Sync, and Modern Design.
  </p>

  <p>
    <img src="https://img.shields.io/badge/Status-Beta-blue?style=for-the-badge" alt="Status" />
    <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Framework" />
    <img src="https://img.shields.io/badge/AI-Gemini_&_Qwen-orange?style=for-the-badge&logo=google-gemini" alt="AI" />
    <img src="https://img.shields.io/badge/Realtime-Ably-green?style=for-the-badge&logo=ably" alt="Realtime" />
  </p>
</div>

<br />

> **LCC Hub** fundamentally re-imagines the academic experience by wrapping the legacy ASP.NET "Schoolista" portal in a modern, responsive, and AI-enhanced interface. Beyond simple data viewing, it acts as an intelligent study companion.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **🎓 Student Dashboard** | Instant access to grades, schedules, and financials in a unified, **mobile-first** interface built with Tailwind CSS v4. Widgets include **Grade Stats**, **Financial Summary**, and **Schedule Table**. |
| **🤖 AI Architect** | A specialized "Frontend Architect" agent powered by **Cloudflare Qwen 2.5**. It generates interactive **3D simulations (Three.js)**, **Charts (Chart.js)**, and **GSAP animations** on demand to explain concepts. |
| **⚡ Realtime Sync** | Powered by **Ably**, get instant notifications. The **Dual-Database** strategy (Firestore + Turso) ensures data is always available, even offline. |
| **🏆 Badge System** | Gamified academic tracking. The system automatically awards badges (e.g., **'Perfect Grade'** for 1.00 GPAs) during data synchronization. |
| **🛡️ Secure & Private** | **AES-256-CBC** encryption for session data. No passwords are ever stored in the database. Granular privacy controls for AI data access. |

---

## 🗺️ Portal Guide

### 📚 Academic Core

<details>
<summary><strong>Dashboard & Grades</strong></summary>

*   **Unified Dashboard:** View your next class, recent grades, and financial summary at a glance. Includes a **Dashboard Insights** widget for AI-driven academic advice.
*   **Smart Gradebook:** View grades from all semesters with automatic **Weighted GPA Calculation**.
*   **Downloadable Reports:** Access official report cards directly from the legacy system.
</details>

<details>
<summary><strong>Schedule & Subjects</strong></summary>

*   **Interactive Schedule:** Weekly calendar view with conflict detection and room/instructor details.
*   **Subject Catalog:** Searchable list of enrolled subjects with unit values and prerequisites. Data is cached weekly from the official prospectus.
*   **EAF Access:** View and download your official Enrollment Assessment Form.
</details>

### 💼 Financial & Admin

<details>
<summary><strong>Accounts & Ledger</strong></summary>

*   **Realtime Ledger:** View outstanding balance, payment history, and official receipts.
*   **Assessment Breakdown:** Detailed view of tuition, miscellaneous, and lab fees.
*   **Installment Tracker:** Track payments for Prelims, Midterms, and Finals with "Due Today" alerts.
</details>

<details>
<summary><strong>Settings & Profile</strong></summary>

*   **Security:** Manage passwords (syncs with legacy portal) and active sessions.
*   **Privacy Controls:** Toggle "Academic Context Awareness" to hide data from the AI.
*   **Notifications:** Customize alerts for grades and announcements.
</details>

### 💬 Campus Life

*   **Community Feed:** A moderated social space for polls, questions, and announcements.
*   **Rich Media:** Supports **Markdown** and **LaTeX** for academic discourse.
*   **AI Moderation:** Real-time analysis ensures a safe and respectful community environment.

---

## 🧠 Schoolista AI Deep Dive

The **Schoolista AI** is not just a chatbot; it's a multi-agent system designed to act as a proactive academic advisor.

### 1. The Orchestrator (Google Gemini 2.0 Flash / Gemma 2 27b)
The main "Portal Assistant" persona handles the conversation flow, context understanding, and tool delegation.
*   **Strict Operational Rules:** It adheres to a strict system prompt that forbids hallucination, mandates **LaTeX** for math, and requires structured narrative responses.
*   **Context Injection:** It knows the student's name, course, and current time. It *can* access grades and schedules, but only if the student has explicitly enabled "Context Awareness".

### 2. The Computational Engine (Python Sandbox)
For math and data analysis, the assistant does not guess. It writes and executes **Python 3.13** code in a secure **Vercel Sandbox**.
*   **Libraries:** `numpy`, `pandas`, `scipy`, `sympy`, `scikit-learn`, `networkx`, `statsmodels`.
*   **Capabilities:**
    *   Solves Calculus/Algebra problems symbolically with `sympy`.
    *   Performs statistical analysis on grades using `pandas`.
    *   Simulates economic models or physics problems.

### 3. The Visualization Architect (Cloudflare Workers AI)
When a student needs to *see* a concept, the Orchestrator delegates to a specialized **"Frontend Architect"** agent (powered by `Qwen 2.5 Coder`).
*   **Output:** Generates raw, self-contained HTML/Tailwind/JS components.
*   **Interactive Demos:** Can build:
    *   **3D Models:** Using `Three.js` (e.g., "Show me a 3D model of a DNA helix").
    *   **Interactive Charts:** Using `Chart.js` for grade trends or financial forecasts.
    *   **Physics Simulations:** Using vanilla JS canvas or GSAP animations.

### 4. Real-Time Knowledge
*   **Web Search:** Uses custom search APIs to find real-time information.
*   **YouTube Search:** Finds relevant educational videos.
*   **School Knowledge Base:** Has static knowledge of LCC's Vision, Mission, Hymn, Grading System, and Building Codes.

---

## 🔄 Synchronization & Data Strategy

LCC Hub uses a robust **"Stale-While-Revalidate"** strategy to ensure offline resilience.

1.  **Dual-Database Architecture:**
    *   **Firebase Firestore:** Stores document-based user data (Profiles, Grades, Settings, Badges).
    *   **Turso (LibSQL):** Stores structured analytics data (Student IDs, Course stats) for performant SQL querying.
2.  **Smart Sync:**
    *   **Trigger:** Runs on login, manual refresh, or background interval.
    *   **Scope:** Fetches Student Info, Schedule, Financials (Balance, Assessment, Payments), and Grades.
    *   **Prospectus Cache:** Global subject data (units, pre-reqs) is cached and refreshed only once every 7 days to save bandwidth.
    *   **Gamification:** The sync service analyzes grades in real-time to award badges like "Perfect Grade" (1.00 GPA).

---

## 🏗️ Technical Stack

| Layer | Technology | Usage |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router) | React Server Components, Tailwind CSS v4 |
| **Backend** | Secure Proxy Layer | Intercepts & secures legacy portal requests |
| **Database** | **Firebase Firestore** | Primary user data & offline cache |
| **Analytics** | **Turso / LibSQL** | Structured SQL queries & reporting |
| **Realtime** | **Ably** | Pub/Sub messaging for instant updates |
| **AI/ML** | **Google Gemini**, **LangChain** | Main Agent orchestration |
| **Visuals** | **Cloudflare Workers AI** | On-demand UI/Chart generation |
| **Speech** | **Deepgram** | High-accuracy Speech-to-Text |

---

## 🔒 Security Architecture

We strictly adhere to a "Privacy First" design philosophy.

1.  **Zero-Knowledge Auth:** Passwords are never stored. They exist only in encrypted RAM during active sessions.
2.  **AES-256 Encryption:** All session cookies are encrypted server-side using `AES-256-CBC` before reaching the browser.
3.  **Role-Based Access:** Strict middleware ensures data isolation—students can only access their own records.
4.  **Audit Logging:** Critical actions (like admin overrides) are logged to Firestore.

---

<div align="center">
  <p>
    <sub>© 2026 LCC Hub Project. Created for the La Consolacion College Community.</sub><br />
    <sub>Not officially affiliated with the LCC IT Department's legacy system providers.</sub>
  </p>
</div>
