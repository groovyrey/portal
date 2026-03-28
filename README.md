<div align="center">
  <h1>LCC HUB</h1>
  <h3>The Intelligent Student Portal</h3>
  <p>
    A next-generation academic ecosystem for La Concepcion College. <br />
    Refining the student experience with AI, Realtime Sync, and Modern Design.
  </p>

  <p>
    <img src="https://img.shields.io/badge/Status-Beta-blue?style=for-the-badge" alt="Status" />
    <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Framework" />
    <img src="https://img.shields.io/badge/AI-Gemma_3_&_Nemotron_3-orange?style=for-the-badge&logo=google-gemini" alt="AI" />
    <img src="https://img.shields.io/badge/Realtime-Ably-green?style=for-the-badge&logo=ably" alt="Realtime" />
  </p>
</div>

<br />

> **LCC Hub** fundamentally re-imagines the academic experience by wrapping the legacy ASP.NET "Schoolista" portal in a modern, responsive, and AI-enhanced interface. Beyond simple data viewing, it acts as an intelligent study companion.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **🎓 Student Dashboard** | Instant access to grades, schedules, and financials in a unified, **mobile-first** interface built with Tailwind CSS v4. Widgets include **Grade Stats**, **Financial Summary**, **Schedule Table**, and **Upcoming Holidays**. |
| **🤖 Portal Assistant** | A specialized ReAct agent powered by **Gemma 3 27B**. It possesses a deep understanding of student records and can perform complex math, web searches, and YouTube lookups. |
| **🎨 AI Architect** | A secondary agent powered by **Nvidia Nemotron 3 120B**. It generates interactive **2D visualizations**, **Dynamic Charts**, and **GSAP animations** on demand to visualize academic concepts. |
| **⚡ Realtime Sync** | Powered by **Ably**, providing instant notifications for grades and announcements. The **Dual-Database** strategy (Firestore + Turso) ensures data is always available, even offline. |
| **🏆 Badge System** | Gamified academic tracking. The system automatically awards badges (e.g., **'Perfect Grade'** for 1.00 GPAs) during data synchronization. |
| **🛡️ Secure & Private** | **AES-256-CBC** encryption for session data. No passwords are ever stored. Granular privacy controls for AI data access. |

---

## 🗺️ Portal Guide

### 📚 Academic Core

<details>
<summary><strong>Dashboard & Grades</strong></summary>

*   **Unified Dashboard:** View your next class, recent grades, and financial summary at a glance. Includes a **Dashboard Insights** widget for AI-driven academic advice.
*   **Smart Gradebook:** View grades from all semesters with automatic **Weighted GPA Calculation**.
*   **Downloadable Reports:** Access official report cards and academic records directly from the system.
</details>

<details>
<summary><strong>Schedule & Subjects</strong></summary>

*   **Interactive Schedule:** Weekly calendar view with conflict detection and room/instructor details. Supports daily and weekly views via AI.
*   **Subject Catalog:** Searchable list of enrolled subjects with unit values and prerequisites. Data is cached and refreshed periodically from the official prospectus.
*   **EAF Access:** View and download your official Enrollment Assessment Form (EAF).
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

*   **Security:** Manage active sessions and security settings.
*   **Privacy Controls:** Toggle "Academic Context Awareness" to control AI access to your personal records.
*   **Assistant Preferences:** Customize AI behavior, including "Save History" and "Auto-Speak" features.
</details>

---

## 🧠 Schoolista AI Deep Dive

The **Portal Assistant** is a multi-agent system designed to act as a proactive academic advisor.

### 1. The Orchestrator (Google Gemma 3 27B)
The main persona handles conversation flow, context understanding, and tool delegation.
*   **Strict Operational Rules:** Mandates **LaTeX** for math, structured narrative responses, and forbids hallucinations.
*   **Context Injection:** Securely accesses student profile, grades, and schedule if "Context Awareness" is enabled.

### 2. The Computational Engine (Python Sandbox)
For math and data analysis, the assistant executes **Python 3.13** code in a secure **Vercel Sandbox**.
*   **Libraries:** `numpy`, `pandas`, `scipy`, `sympy`, `scikit-learn`, `networkx`, `statsmodels`, `matplotlib`.
*   **Capabilities:** Symbolic math, statistical analysis of grades, and complex model simulations.

### 3. The Visualization Architect (Cloudflare Workers AI)
Delegates to a specialized **"Visualizer"** agent (powered by `Nvidia Nemotron 3 120B`) to generate raw HTML/JS payloads.
*   **Interactive Demos:** 2D Visualizations, Interactive Charts (`Chart.js`), and SVG Animations.

*   **Responsiveness:** All generated visualizations are designed to be fully responsive and mobile-friendly.

### 4. Knowledge & Voice
*   **Real-time Tools:** Web search, YouTube lookup, and direct URL fetching for research.
*   **LCC Knowledge Base:** Deep knowledge of LCC's Vision, Mission, Grading System, and Procedures.
*   **Voice Suite:** Powered by **Deepgram Nova-3** (STT) and **Aura** (TTS) for natural, low-latency voice interactions.

---

## 🔄 Synchronization & Data Strategy

LCC Hub uses a robust **"Stale-While-Revalidate"** strategy to ensure offline resilience.

1.  **Dual-Database Architecture:**
    *   **Firebase Firestore:** Primary store for user profiles, grades, schedules, and settings.
    *   **Turso (LibSQL):** High-performance SQL store for structured analytics and logs.
2.  **Smart Sync:**
    *   **Trigger:** Runs on login, manual refresh, or background interval.
    *   **Scope:** Synchronizes Student Info, Schedule, Financials, and Grades from the legacy portal.
    *   **Offline-First:** Immediate rendering from `localStorage` followed by background freshness updates via React Query.

---

## 🏗️ Technical Stack

| Layer | Technology | Usage |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/) | App Router, React 19, Tailwind CSS v4 |
| **State** | **React Query** | Server state management and background syncing |
| **Database** | **Firestore / Turso** | Hybrid NoSQL/SQL data strategy |
| **Realtime** | **Ably** | Global Pub/Sub for instant notifications |
| **AI Core** | **Gemma 3 27B** | LLM orchestration via LangChain |
| **Sandbox** | **Vercel Sandbox** | Secure Python 3.13 code execution |
| **Speech** | **Deepgram** | STT (Nova-3) and TTS (Aura) |

---

## 📜 Documentation & Manual

The **LCC Hub Manual** is a modernized documentation system built directly into the portal.
*   **Interactive TOC:** Automatically generated from markdown headers.
*   **Glassmorphism Design:** Aligned with the overall application aesthetic.
*   **Proactive Search:** Built-in table of contents for quick navigation.
*   **Rich Content:** Support for Markdown, LaTeX, and custom notification callouts.

---

<div align="center">
  <p>
    <sub>© 2026 LCC Hub Project. Created for the La Concepcion College Community.</sub><br />
    <sub>Not officially affiliated with the LCC IT Department's legacy system providers.</sub>
  </p>
</div>
