# LCC Hub: Research Methodology & Implementation Framework

## PART 1: RESEARCH METHODOLOGY

### 1. Research Design: Legacy System Modernization (LSM)
This research employs an **Iterative Prototyping and Applied Research** design to address the "Legacy Gap" in educational institutions. The project serves as a case study in modernizing monolithic ASP.NET applications through an intelligent middleware layer without direct database access.
- **Approach:** Design Science Research (DSR).
- **Primary Objective:** To evaluate the effectiveness of LLM-orchestrated middleware in enhancing student data accessibility and academic engagement.

### 2. Multi-Agent System Architecture
The system architecture is engineered as a decoupled, four-tier stack to ensure high availability and intelligence:
- **Presentation Layer (The Aesthetic Interface):** Next.js 16 (App Router) utilizing **Tailwind CSS v4** for high-performance, mobile-first design and **Framer Motion** for cognitive-load reduction through fluid transitions.
- **Intelligence Layer (The Cognitive Core):** A dual-agent orchestration pattern:
    - **Primary Orchestrator:** **Google Gemma 3 27B** (via LangChain) for natural language reasoning, intent classification, and tool delegation.
    - **Visual Architect:** **Nvidia Nemotron 3 120B** (via Cloudflare Workers AI) for real-time generation of interactive 2D components and data visualizations.
- **Data Acquisition Layer (The Extraction Engine):** A non-invasive scraping protocol using `cheerio` and `tough-cookie` to simulate authenticated sessions within the legacy "Schoolista" environment.
- **Persistence Layer (The Resilient Store):** A hybrid strategy using **Firebase Firestore** for rapid document retrieval and **Turso (LibSQL)** for structured audit logs and relational analytics.

### 3. Data Synchronization & Normalization Protocol
To ensure data integrity despite the instability of the source system, a **Stale-While-Revalidate (SWR)** synchronization strategy is implemented:
1. **Authenticated Proxying:** Secure credential forwarding using **AES-256-CBC** encryption to establish a persistent session jar.
2. **Node Extraction:** Targeted CSS selection of DOM elements representing Grades, Schedules, and Financial Ledgers.
3. **Structured Mapping:** Transformation of raw ASP.NET ViewState data into standardized TypeScript interfaces.
4. **Offline Resilience:** Immediate hydration from local Firestore cache followed by background "Freshness Checks" to update the UI via **Ably** realtime notifications.

### 4. Computational & Voice Intelligence Strategy
The assistant utilizes a **ReAct (Reasoning + Acting)** loop to provide verifiable academic support:
- **Symbolic Math & Analysis:** Delegation of complex calculations to a secure **Python 3.13 Vercel Sandbox**, supporting libraries like `numpy`, `sympy`, and `pandas`.
- **Natural Language Interaction:** Implementation of **Deepgram Nova-3** for speech-to-text (STT) and **Aura** for text-to-speech (TTS), enabling low-latency, eyes-free interaction.
- **Context Injection:** Dynamic retrieval of student-specific records (GPA trends, upcoming dues) into the LLM context window to provide hyper-personalized academic advising.

### 5. Security & Ethical Framework
- **Zero-Password Storage:** Passwords are never persisted; they are only used to generate a temporary, encrypted `session_token`.
- **Sandboxed Execution:** All AI-generated code and visualizations are executed in ephemeral, isolated environments to prevent prompt injection or XSS.
- **Granular Privacy:** A student-controlled "Context Awareness" toggle that masks sensitive academic data from the LLM when requested.

---

## PART 2: IMPLEMENTATION ROADMAP (ACTION PLAN)

### Phase 1: Core Infrastructure & Authentication Bridge
- **Step 1.1:** Setup of Firebase Admin SDK and Turso LibSQL client.
- **Step 1.2:** Implementation of the `lib/auth.ts` encryption module (AES-256-CBC).
- **Step 1.3:** Development of the `SessionProxy` to handle persistent cookie jars and ASP.NET login handshake.
- **Step 1.4:** Configuration of Ably realtime channels for cross-device state synchronization.

### Phase 2: Data Mining & SWR Synchronization
- **Step 2.1:** Construction of CSS selectors for `lib/scraper-service.ts` to map legacy HTML nodes to JSON.
- **Step 2.2:** Implementation of the `SyncService` background worker to handle large-scale data ingestion.
- **Step 2.3:** Development of the Badge System logic to automatically calculate GPAs and award academic achievements during sync.
- **Step 2.4:** Creation of error-boundary logic for "Legacy Maintenance" states.

### Phase 3: AI Assistant & Specialized Agent Protocol
- **Step 3.1:** Integration of **Gemma 3 27B** with the LangChain Tool Calling API.
- **Step 3.2:** Implementation of the Python execution tool via `@vercel/sandbox`.
- **Step 3.3:** Developing the "Visualizer" prompt template for **Nemotron 3 120B** to output raw HTML/JS payloads.
- **Step 3.4:** Setting up the Deepgram WebSocket for real-time, bi-directional voice interaction.

### Phase 4: Frontend Engineering & Interactive UI
- **Step 4.1:** Building the global `TabbedPageLayout` and navigation drawer with glassmorphic styling.
- **Step 4.2:** Developing the `GradesList` and `ScheduleTable` components with interactive filtering.
- **Step 4.3:** Integrating the `MarkdownRenderer` with support for LaTeX math and GSAP animations.
- **Step 4.4:** Finalizing the `DashboardInsights` widget for proactive, AI-driven academic alerts.

### Phase 5: Validation, Security Audit & Launch
- **Step 5.1:** Cross-verification of LCC Hub data against the legacy portal for 100% accuracy.
- **Step 5.2:** Stress-testing the scraping engine under high latency.
- **Step 5.3:** Security audit of HTTPOnly cookie implementation and CSRF protection.
- **Step 5.4:** Final deployment to Vercel and monitoring via `components/admin/MonitoringTab.tsx`.
