# LCCian Hub: Student Research & Academic Workspace (Unofficial)

This is an independent research project and a student-made academic workspace for La Concepcion College (LCC). The main goal of this project is to see how we can use modern technologies like AI and real-time databases to improve the student experience on top of the existing "Schoolista" portal. 

> **Important:** This is NOT an official school app. We're just students trying to build a better way to view our grades, schedules, and study materials using what we've learned about AI and web development.

---

## 🛠️ How we built this (Technical Stack)

We used a mix of different tools to make the hub fast, even when the main portal is slow:

- **Frontend:** Next.js 16 (App Router) with Tailwind CSS v4 for the UI.
- **Data & Storage:** 
    - **Firebase Firestore:** This is our main cache. We save student profiles, grades, and schedules here so they're always available.
    - **Turso (LibSQL):** Used for storing some structured logs and analytics on the edge.
- **AI Engine:**
    - **Google Gemini (Gemma 3):** Our main "Portal Assistant" that understands student records.
    - **Cloudflare Workers AI (Nemotron 3):** A specialized visualizer that generates interactive charts and 2D demos for us.
- **Real-time:** **Ably** for pushing notifications (like when grades are synced).
- **Audio:** **Deepgram** for voice features (STT and TTS).

---

## 🔬 Technical Implementation Notes

Here are some of the key things we implemented to make the system work:

### 1. The Ghost Session Proxy
The legacy portal uses ASP.NET and session cookies. To avoid logging in every time a student opens our app, we built a "Session Proxy" (`lib/session-proxy.ts`). It encrypts the portal's session cookies using **AES-256-CBC** and saves them in Firestore. This lets us "rehydrate" the session later, making the sync process way faster.

### 2. Scraping & Data Sync
Since there's no official API, we used `cheerio` to scrape the data directly from the portal. 
- **Sync Strategy:** We use a "Stale-While-Revalidate" approach. When you log in, we show you the cached data from Firestore immediately, then we run the scraper in the background to update it.
- **Badges:** We added a simple gamification system that checks grades during sync and awards badges (like "Perfect Grade" for 1.00 GPAs).

### 3. AI Portal Assistant
The assistant isn't just a chatbot; it's a "ReAct" agent. It has tools like:
- **Python Sandbox (Vercel):** For doing complex math or data analysis on grades.
- **HTML Renderer:** For generating custom dashboards on the fly.
- **Knowledge Base:** We fed it information about LCC's grading system and school mission so it can answer school-specific questions.

---

## 📂 Project Structure

```
/
├── app/                    # Next.js UI and API routes
│   ├── (routes)/           # Pages (Dashboard, Grades, Settings)
│   └── api/                # The backend (Auth, AI assistant, Sync logic)
├── components/             # All our UI widgets and layouts
├── lib/                    # The "brain" of the app
│   ├── ai-service.ts       # Orchestrator for the AI visualizer
│   ├── scraper-service.ts  # Logic for parsing the legacy portal
│   └── session-proxy.ts    # Handling the encrypted session cookies
├── scripts/                # Utility scripts for maintenance
└── types/                  # TypeScript interfaces for our data
```

---

## ⚙️ Setup for Research

If we need to run this locally for testing:
1.  **Clone the repo** and run `npm install`.
2.  **Environment Variables:** We need a `.env.local` file with all the API keys (Gemini, Firebase, Ably, etc.). See `.env.example` for the list of keys we use.
3.  **Run Dev:** `npm run dev` to start the local server.

---
© 2026 LCCian Hub Project. Created for the LCC community. This is a student research project.
