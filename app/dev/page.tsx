'use client';

import React from 'react';
import { 
  Terminal, 
  Server, 
  Box, 
  Layers, 
  Cpu, 
  Package, 
  Activity, 
  FileJson,
  Database,
  ArrowRight,
  Shield,
  Clock,
  Globe,
  Search,
  Zap
} from 'lucide-react';

export default function DevPage() {
  const apiGroups = [
    {
      name: "Student APIs",
      endpoints: [
        { method: "POST", path: "/api/student/login", params: "userId, password", desc: "Authenticates with Schoolista portal; returns Student, Schedule, and Financials." },
        { method: "POST", path: "/api/student/logout", params: "None", desc: "Clears session cookies and local state." },
        { method: "GET", path: "/api/student/me", params: "None", desc: "Returns session-based student data from persistent storage." },
        { method: "POST", path: "/api/student/grades", params: "href, reportName", desc: "Scrapes specific report card from portal; syncs to Firebase." },
        { method: "GET", path: "/api/student/eaf", params: "None", desc: "Fetches current period EAF (Electronic Alignment Form)." },
        { method: "POST", path: "/api/student/change-password", params: "current, new", desc: "Updates portal credentials via Scraper handshake." },
        { method: "GET", path: "/api/student/profile", params: "userId", desc: "Retrieves PG student profile for Community views." },
        { method: "POST", path: "/api/student/settings", params: "isPublic, notifications", desc: "Updates student preference flags in DB." },
        { method: "GET", path: "/api/student/diagnostic", params: "None", desc: "Returns raw scraper HTML logs for troubleshooting." },
        { method: "GET", path: "/api/student/notifications", params: "None", desc: "Fetches user-specific notification inbox." }
      ]
    },
    {
      name: "AI & Content APIs",
      endpoints: [
        { method: "POST", path: "/api/ai/chat", params: "message, history", desc: "Google Gemini 2.0 Flash conversational endpoint." },
        { method: "POST", path: "/api/ai/review", params: "content, poll", desc: "Aegis AI: Scans content for safety (Growth Tips/Safety Score)." },
        { method: "POST", path: "/api/ai/reviewer", params: "content", desc: "Internal moderation service for manual flagged reviews." },
        { method: "GET", path: "/api/ai/assistant", params: "query", desc: "Deep-dive academic assistant for portal navigation." },
        { method: "POST", path: "/api/ai/fallback", params: "None", desc: "Secondary AI model routing for high-traffic failover." }
      ]
    },
    {
      name: "Community & System APIs",
      endpoints: [
        { method: "GET", path: "/api/community", params: "topic, search, sort", desc: "Fetches global feed with likes/comment counts." },
        { method: "POST", path: "/api/community", params: "content, poll, topic", desc: "Persists new posts/polls to PG database." },
        { method: "PATCH", path: "/api/community", params: "postId, action", desc: "Handles Likes, Unlikes, and Poll Voting." },
        { method: "POST", path: "/api/community/comments", params: "postId, content", desc: "Adds thread comments with Aegis review check." },
        { method: "POST", path: "/api/community/comments/report", params: "commentId", desc: "Triggers Aegis review on existing comment content." },
        { method: "POST", path: "/api/ably/auth", params: "clientId", desc: "Ably Realtime token issuance for WebSockets." },
        { method: "GET", path: "/api/version", params: "None", desc: "System version checker for critical updates." },
        { method: "GET", path: "/api/ratings", params: "None", desc: "Fetches aggregate system feedback scores." }
      ]
    }
  ];

  const libraryFiles = [
    { 
      name: "scraper-service.ts", 
      methods: ["fetchDashboard", "fetchEAF", "fetchGrades", "parseSchedule", "forceLogin"], 
      desc: "Cheerio-based scraping engine for Schoolista portal DOM parsing." 
    },
    { 
      name: "sync-service.ts", 
      methods: ["syncStudentData", "syncToPostgres", "syncFinancials", "syncSchedule"], 
      desc: "Bidirectional data synchronization between Portal and local storage." 
    },
    { 
      name: "auth.ts", 
      methods: ["encrypt", "decrypt", "hashPassword"], 
      desc: "AES-256-CBC encryption for session tokens and portal credentials." 
    },
    { 
      name: "session-proxy.ts", 
      methods: ["getSessionClient", "saveSession", "clearSession"], 
      desc: "Persistent Axios instance manager with CookieJar support." 
    },
    { 
      name: "notification-service.ts", 
      methods: ["createNotification", "notifyAllStudents"], 
      desc: "System-wide alert dispatcher using Firestore and Ably real-time updates." 
    },
    { 
      name: "realtime.ts", 
      methods: ["publishUpdate", "getAbly", "subscribeToChannel"], 
      desc: "Ably Pub/Sub wrapper for live Community activity updates." 
    }
  ];

  const firestoreSchema = [
    {
      collection: "portal_sessions",
      id: "{userId}",
      role: "Ghost Session Persistence",
      structure: "{ encryptedJar: string, updated_at: timestamp }",
      desc: "Stores AES-256 encrypted CookieJar to bypass portal login handshakes."
    },
    {
      collection: "students",
      id: "{userId}",
      role: "Core Profile Metadata",
      structure: "{ name, course, email, year_level, semester, available_reports: [], updated_at }",
      desc: "Flattened metadata for primary user identity and academic context."
    },
    {
      collection: "financials",
      id: "{userId}",
      role: "Accounting Data",
      structure: "{ total, balance, due_today, details: { assessment: [], payments: [], installments: [] } }",
      desc: "Hierarchical object mapping financial status and transaction history."
    },
    {
      collection: "schedules",
      id: "{userId}",
      role: "Academic Timetable",
      structure: "{ items: [ { subject, section, time, room } ], updated_at }",
      desc: "Array-based storage for weekly class schedules."
    },
    {
      collection: "grades",
      id: "{userId}_{reportSlug}",
      role: "Term-based Records",
      structure: "{ student_id, report_name, items: [ { code, grade, remarks } ], updated_at }",
      desc: "Historical grade snapshots synced on-demand from specific portal URLs."
    },
    {
      collection: "prospectus_subjects",
      id: "{subjectCode}",
      role: "Course Reference",
      structure: "{ description, units, pre_req, updated_at }",
      desc: "Reference table for offered subjects and prerequisites."
    }
  ];

  const typeGroups = [
    {
      name: "Academic Models",
      types: [
        { name: "ScheduleItem", props: "subject, section, units, time, room", desc: "Represents a single class session with time and location metadata." },
        { name: "ProspectusSubject", props: "code, description, units, preReq", desc: "Official subject details from the school prospectus/offered list." },
        { name: "SubjectGrade", props: "code, description, grade, remarks", desc: "Specific grade record for an individual subject." },
        { name: "SemesterGrade", props: "semester, subjects[]", desc: "Collection of subject grades for a specific academic term." },
        { name: "ReportLink", props: "text, href", desc: "URL pointers to official PDF/HTML report cards in the portal." }
      ]
    },
    {
      name: "User & Financial Models",
      types: [
        { name: "Student", props: "id, name, course, financials, schedule, settings", desc: "The primary root data model representing a logged-in student user." },
        { name: "Financials", props: "total, balance, dueToday, payments[], assessment[]", desc: "Complex object mapping billing, payments, and outstanding balances." },
        { name: "ParsedName", props: "firstName, lastName, middleName, full", desc: "Decomposed name object for UI personalization." },
        { name: "Notification", props: "id, title, message, type, isRead, link", desc: "Internal alert system record for system-to-user communication." }
      ]
    },
    {
      name: "Community Models",
      types: [
        { name: "CommunityPost", props: "id, userId, content, topic, likes[], poll", desc: "User-generated feed content with social and interaction metadata." },
        { name: "CommunityComment", props: "id, postId, userId, content, createdAt", desc: "Nested interaction records linked to a primary community post." }
      ]
    }
  ];

  const techStack = [
    { k: "Core", v: "Next.js 15 (App Router)" },
    { k: "Database", v: "PostgreSQL (Neon), Firebase (Firestore)" },
    { k: "AI", v: "Google Gemini 2.0 Flash SDK" },
    { k: "Realtime", v: "Ably (WebSocket/MQTT)" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans text-xs selection:bg-blue-100 pb-20">
      {/* Dev Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-slate-900" />
            <span className="font-bold uppercase tracking-wider">System Reference</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active</span>
            <span>v1.2.0-BETA</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Technical Summary */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 border border-slate-200 bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="font-bold uppercase flex items-center gap-2 text-slate-900 mb-4 text-[10px] tracking-wider border-b border-slate-50 pb-3">
              System Architecture
            </h2>
            <p className="text-slate-500 leading-relaxed font-medium">
              LCC Hub operates as an Ephemeral Headless Browser Proxy. It establishes secure sessions with the Schoolista ASP.NET 
              legacy portal via Scraper-Service (Cheerio/Axios). Data is normalized into JSON and stored in a hybrid architecture 
              (Firebase for academic metadata, PostgreSQL for relational community data).
            </p>
          </div>
          <div className="border border-slate-200 bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="font-bold uppercase flex items-center gap-2 text-slate-900 mb-4 text-[10px] tracking-wider border-b border-slate-50 pb-3">
              Technology Stack
            </h2>
            <div className="space-y-3">
              {techStack.map(s => (
                <div key={s.k} className="flex justify-between border-b border-slate-50 pb-1 last:border-0 last:pb-0">
                  <span className="text-slate-400 uppercase text-[9px] font-bold">{s.k}</span>
                  <span className="font-bold text-slate-700">{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Flow Lifecycle */}
        <section className="space-y-4">
          <h2 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] ml-1">Lifecycle Examination</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { step: "01 / SCRAPE", icon: <Globe size={14} />, desc: "Session visits Portal DOM via Axios." },
              { step: "02 / PARSE", icon: <Search size={14} />, desc: "Extract structured JSON from HTML." },
              { step: "03 / ENCRYPT", icon: <Shield size={14} />, desc: "Credential security via AES-256." },
              { step: "04 / SYNC", icon: <Database size={14} />, desc: "Persistence to Firestore & PG." },
              { step: "05 / REALTIME", icon: <Zap size={14} />, desc: "Broadcast via Ably WebSockets." }
            ].map((s, i) => (
              <div key={i} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm hover:border-slate-300 transition-all group">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors">{s.step}</span>
                  <div className="text-slate-300 group-hover:text-slate-600 transition-colors">{s.icon}</div>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight font-bold">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Firestore Schema */}
        <section className="space-y-4">
          <h2 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] ml-1">Persistence Schema</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">Collection</th>
                    <th className="px-5 py-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">Document ID</th>
                    <th className="px-5 py-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">System Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10px]">
                  {firestoreSchema.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900">{item.collection}</td>
                      <td className="px-5 py-4 font-mono text-slate-500">{item.id}</td>
                      <td className="px-5 py-4 text-slate-600 font-medium leading-relaxed">
                        <span className="font-bold text-slate-900 block mb-0.5">{item.role}</span>
                        {item.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* API Table */}
        <section className="space-y-6">
          <h2 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] ml-1">API Documentation</h2>
          
          <div className="space-y-10">
            {apiGroups.map((group, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-4 w-1 bg-slate-900 rounded-full" />
                  <h3 className="text-[10px] text-slate-900 font-bold uppercase tracking-wider">{group.name}</h3>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-3 w-20 text-[9px] text-slate-400 font-bold uppercase tracking-wider">Method</th>
                          <th className="px-5 py-3 w-64 text-[9px] text-slate-400 font-bold uppercase tracking-wider">Endpoint</th>
                          <th className="px-5 py-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[10px]">
                        {group.endpoints.map((api, j) => (
                          <tr key={j} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-5 py-4">
                              <span className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                                api.method === 'GET' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                api.method === 'POST' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                                {api.method}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-900 font-bold font-mono">{api.path}</td>
                            <td className="px-5 py-4 text-slate-500 font-medium leading-relaxed">{api.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Utility Library Table */}
        <section className="space-y-4">
          <h2 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] ml-1">Logic Modules (/lib)</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3 w-56 text-[9px] text-slate-400 font-bold uppercase tracking-wider">Module</th>
                    <th className="px-5 py-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10px]">
                  {libraryFiles.map((lib, i) => (
                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900 font-mono">{lib.name}</td>
                      <td className="px-5 py-4 text-slate-500 font-medium leading-relaxed">{lib.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <footer className="text-center pt-8 border-t border-slate-200">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Technical Reference • v1.2.0</p>
        </footer>
      </main>
    </div>
  );
}
