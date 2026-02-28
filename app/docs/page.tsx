import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const DocsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all text-xs font-bold mb-10 active:scale-95">
          <ArrowLeft size={14} />
          Dashboard
        </Link>
        <header className="mb-16">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900">
            Documentation
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl leading-relaxed font-medium">
            Everything you need to know about using LCC Hub—built for speed, security, and a better student experience.
          </p>
        </header>

        <div className="space-y-16">
          {/* Section: Getting Started */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-6 w-1 bg-slate-900 rounded-full" />
              <h2 className="text-xl font-bold tracking-tight">Getting Started</h2>
            </div>
            
            <div className="grid gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold mb-2 text-slate-900">Authentication</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 font-medium">
                  Log in with your official student account. We establish a secure connection to sync your info without storing sensitive credentials permanently.
                </p>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <p className="text-[11px] text-blue-700 font-bold">
                    Pro-tip: Real-time syncing may take up to 60 seconds on your first login.
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold mb-2 text-slate-900">Your Dashboard</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  The dashboard provides an overview of your academic standing, including current balance, class schedule, and grade performance.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Features */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-6 w-1 bg-slate-900 rounded-full" />
              <h2 className="text-xl font-bold tracking-tight">Core Features</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Grade Tracking', desc: 'Monitor your progress across all semesters with automated GPA calculation.' },
                { title: 'Smart Schedule', desc: 'Weekly overview of your subjects, locations, and section details.' },
                { title: 'Ledger Access', desc: 'View your assessment of fees and transaction history in real-time.' },
                { title: 'Subject Catalog', desc: 'Search through the current academic offerings and course requirements.' },
                { title: 'Student Feed', desc: 'Engage with the community through posts, comments, and polls.' },
                { title: 'Portal AI', desc: 'Personal school assistant with Web Research and URL Summarization.' }
              ].map((f, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold mb-1.5 text-slate-900">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Security */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-6 w-1 bg-slate-900 rounded-full" />
              <h2 className="text-xl font-bold tracking-tight">Security & Privacy</h2>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-md">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-base font-bold mb-3">Data Protection</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">
                    We utilize AES-256 encryption to protect your session tokens and personal information from unauthorized access.
                  </p>
                  <h3 className="text-base font-bold mb-3">Privacy First</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Your password is never stored on our servers. It is used exclusively for the initial synchronization handshake.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <h4 className="font-bold text-xs mb-1">Encrypted Sessions</h4>
                    <p className="text-[10px] text-slate-400 font-medium">HTTP-only cookies and secure storage keep your login active and safe.</p>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <h4 className="font-bold text-xs mb-1">Audit Logs</h4>
                    <p className="text-[10px] text-slate-400 font-medium">System activity is monitored to ensure the integrity of the student community.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-20 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            &copy; {new Date().getFullYear()} LCC Hub • Community Project
          </p>
          <div className="flex gap-6">
            <Link href="/disclaimer" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-wider">Disclaimer</Link>
            <Link href="/" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-wider">Home</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DocsPage;
