import React from 'react';

const DocsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <header className="mb-20">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
            Documentation
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
            A comprehensive guide to the unofficial Student Portal—designed for speed, security, and a better academic experience.
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
                <h3 className="text-lg font-bold mb-3 text-slate-800">Authentication</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Log in using your official school credentials. Our system acts as a secure bridge, fetching your data in real-time without storing sensitive login information on our servers.
                </p>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                  <p className="text-sm text-blue-700 font-medium">
                    Note: If you've recently changed your password on the official portal, it may take a few minutes for the changes to propagate here.
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-3 text-slate-800">The Dashboard</h3>
                <p className="text-slate-600 leading-relaxed">
                  Upon entry, you'll see a unified view of your academic profile. This includes your current GPA, a quick look at your next class, and any outstanding balances.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Core Features */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <span className="text-sm font-bold">02</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Core Features</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                </div>
                <h3 className="font-bold mb-2">Grade Monitoring</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Digitized grade sheets for all semesters. Includes automatic GPA calculation and performance tracking across your academic history.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <h3 className="font-bold mb-2">Smart Schedule</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  A dynamic weekly calendar showing your subjects, room numbers, and faculty names. Optimized for both mobile and desktop views.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <h3 className="font-bold mb-2">Financial Ledger</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Real-time synchronization with the school's billing system. Track your tuition fees, payment history, and upcoming due dates effortlessly.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4 text-orange-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </div>
                <h3 className="font-bold mb-2">Subject Explorer</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Browse through all offered subjects for the current semester. View course descriptions, units, and check for prerequisite requirements.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Security Details */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                <span className="text-sm font-bold">03</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Security Protocol</h2>
            </div>

            <div className="bg-slate-900 text-slate-300 rounded-3xl p-10 shadow-2xl">
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-white font-bold text-lg mb-4">Encryption Standard</h3>
                  <p className="text-sm leading-relaxed mb-6">
                    We utilize AES-256-CBC encryption for all session-related data. This ensures that your academic information remains private and inaccessible to unauthorized parties.
                  </p>
                  <h3 className="text-white font-bold text-lg mb-4">Zero-Persistence Policy</h3>
                  <p className="text-sm leading-relaxed">
                    Your password is never written to disk. It exists only in memory during the authentication handshake and is purged immediately after a secure session is established.
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <h4 className="text-white font-semibold text-sm mb-1">HttpOnly Cookies</h4>
                    <p className="text-xs text-slate-400">Protects against XSS attacks by preventing client-side scripts from accessing session tokens.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <h4 className="text-white font-semibold text-sm mb-1">CSRF Protection</h4>
                    <p className="text-xs text-slate-400">Security tokens are implemented on all state-changing requests to prevent cross-site request forgery.</p>
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
            &copy; {new Date().getFullYear()} Student Portal — Unofficial Documentation
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
