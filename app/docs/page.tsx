import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const DocsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors text-sm font-bold mb-12 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        <header className="mb-20">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
            Documentation
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
            A simple guide to LCC Hub—built for speed, security, and a better school experience.
          </p>
        </header>

        <div className="space-y-24">
          {/* Section: Getting Started */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <span className="text-sm font-bold">01</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Getting Started</h2>
            </div>
            
            <div className="grid gap-6">
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-3 text-slate-800">Logging In</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Log in with your official school account. Our system connects securely to the school and gets your info without saving your password on our servers.
                </p>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                  <p className="text-sm text-blue-700 font-medium">
                    Note: If you just changed your school password, it might take a few minutes for it to work here.
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-3 text-slate-800">The Dashboard</h3>
                <p className="text-slate-600 leading-relaxed">
                  When you log in, you'll see everything in one place. Your GPA, your next class, and any fees you need to pay are all on your main screen.
                </p>
              </div>
            </div>
          </section>

          {/* Section: App Features */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <span className="text-sm font-bold">02</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">App Features</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                </div>
                <h3 className="font-bold mb-2">Grade Tracking</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Check your grades from all semesters. The app calculates your GPA automatically and shows your progress.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <h3 className="font-bold mb-2">Smart Schedule</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  A weekly calendar with your subjects, room numbers, and teachers. Easy to read on your phone or computer.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <h3 className="font-bold mb-2">School Fees</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  See your balance and payments in real-time. Track your tuition and upcoming due dates easily.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4 text-orange-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </div>
                <h3 className="font-bold mb-2">Subject Search</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Look through all subjects offered this semester. View descriptions, units, and requirements.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center mb-4 text-pink-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <h3 className="font-bold mb-2">Student Community</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Talk with other students in the forum. Share ideas, ask questions, and vote in school polls.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center mb-4 text-violet-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                </div>
                <h3 className="font-bold mb-2">AI School Helper</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Ask the AI about your grades, schedule, or school info for instant answers.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <h3 className="font-bold mb-2">Live Notifications</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Stay updated with instant alerts. Know right away when someone comments or when there's new activity.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Security Rules */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                <span className="text-sm font-bold">03</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Security Rules</h2>
            </div>

            <div className="bg-slate-900 text-slate-300 rounded-3xl p-10 shadow-2xl">
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-white font-bold text-lg mb-4">Strong Encryption</h3>
                  <p className="text-sm leading-relaxed mb-6">
                    We use strong AES-256 encryption for your data. This ensures your school info stays private and safe.
                  </p>
                  <h3 className="text-white font-bold text-lg mb-4">No Saved Passwords</h3>
                  <p className="text-sm leading-relaxed">
                    We never save your password. It's only used to log you in once and is removed from the system immediately after.
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <h4 className="text-white font-semibold text-sm mb-1">Secure Sessions</h4>
                    <p className="text-xs text-slate-400">Protects your login session from hackers using secure browser settings.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <h4 className="text-white font-semibold text-sm mb-1">Action Protection</h4>
                    <p className="text-xs text-slate-400">Security checks on all actions to prevent unauthorized requests.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: FAQ */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                <span className="text-sm font-bold">04</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="py-6">
                <h3 className="font-bold text-slate-800 mb-2">Why is the app faster than the official portal?</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  We use an optimized caching layer and a modern frontend framework (Next.js) to serve data. While we still fetch from the official source, we do so efficiently and only when necessary.
                </p>
              </div>
              <div className="py-6">
                <h3 className="font-bold text-slate-800 mb-2">Can I pay my tuition through this app?</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Currently, you can only view your balance and ledger. For security reasons, actual payments must still be processed through official school channels or bank partners.
                </p>
              </div>
              <div className="py-6">
                <h3 className="font-bold text-slate-800 mb-2">Is my data shared with anyone?</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  No. Your data is purely for your own viewing. We do not sell or share student information with third parties.
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-32 pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} LCC Hub — Unofficial Documentation
          </p>
          <div className="flex gap-6">
            <a href="/disclaimer" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Disclaimer</a>
            <a href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Home</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DocsPage;
