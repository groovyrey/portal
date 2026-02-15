import React from 'react';

const DocsPage: React.FC = () => {
  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen">
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        <header className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Documentation
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            Everything you need to know about setting up and using the unofficial Student Portal App.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar Navigation (Hidden on small screens) */}
          <aside className="hidden lg:block lg:col-span-3">
            <nav className="sticky top-24 space-y-2">
              <a href="#getting-started" className="block px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Getting Started</a>
              <a href="#security" className="block px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Security</a>
              <a href="#features" className="block px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Features</a>
              <a href="#troubleshooting" className="block px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Troubleshooting</a>
              <a href="#support" className="block px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Support</a>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9 space-y-20">
            
            {/* Getting Started */}
            <section id="getting-started" className="scroll-mt-24">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Getting Started</h2>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 hover:shadow-md transition-shadow duration-300">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md">Step 1</span>
                    Secure Login
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Navigate to the homepage and enter your official <strong>Student Portal User ID</strong> and <strong>Password</strong>. 
                    The app securely logs you into the school's system via an encrypted server-side session.
                  </p>
                  <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <p className="text-sm text-blue-800 font-medium">
                      <strong>Professional Security:</strong> Unlike many apps, your password is <strong>never</strong> stored in your browser's persistent storage. It is handled entirely through encrypted, server-side tokens.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                     <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md">Step 2</span>
                    Your Dashboard
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Once logged in, you'll see a personalized dashboard summarizing your academic status, including quick stats, schedule overview, and financial standing.
                  </p>
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section id="security" className="scroll-mt-24">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 5.058 3.413 9.273 8.14 10.192a11.944 11.944 0 008.14-10.192c0-1.333-.231-2.61-.658-3.796A11.958 11.959 0 0112 2.714z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Security & Privacy</h2>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">HttpOnly Cookies</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      We use <strong>HttpOnly cookies</strong> to manage your session. These special cookies cannot be accessed by any client-side scripts, protecting you from common web attacks like Cross-Site Scripting (XSS).
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">AES-256 Encryption</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Your session data is encrypted using <strong>AES-256-CBC</strong>, an industry-standard encryption algorithm. Even if a token were intercepted, the contents remain unreadable without our unique server secret.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">No Plaintext Storage</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Your password is never saved in plaintext on any server or browser storage. It is only used to establish a secure connection with the official student portal.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Local Data Caching</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Only non-sensitive academic data (like your name and schedule) is cached in <code>localStorage</code> to ensure a fast, "app-like" experience on every visit.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Features */}
            <section id="features" className="scroll-mt-24">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Features</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
                  <h3 className="text-lg font-bold text-indigo-700 mb-2">Grades Monitor</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    View grades across semesters in a clean, digitized format. Check your academic performance at a glance.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
                  <h3 className="text-lg font-bold text-indigo-700 mb-2">Class Schedule</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    A beautiful, interactive weekly timetable showing subjects, times, and rooms. Never miss a class again.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
                  <h3 className="text-lg font-bold text-indigo-700 mb-2">Financial Summary</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Track account balances, due dates, payments, and assessment fees directly from the student ledger.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
                  <h3 className="text-lg font-bold text-indigo-700 mb-2">Offered Subjects</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Browse the full catalog of offered subjects to plan your future enrollments and check prerequisites.
                  </p>
                </div>
              </div>
            </section>

            {/* Troubleshooting */}
            <section id="troubleshooting" className="scroll-mt-24">
               <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.033a17.255 17.255 0 015.96 5.96l-3.033 2.496M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l5.653-4.655M11.42 15.17lc4.761-4.761 9.924-4.809 9.24-5.485-.68-.676-1.189-5.179-5.955-9.945-4.766-4.766-9.17-5.179-9.945-5.955-.676-.68-.724 4.479-5.485 9.24z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Troubleshooting</h2>
              </div>

              <div className="bg-slate-900 text-slate-300 rounded-2xl p-8 shadow-xl">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      Login Failed?
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-slate-500 mt-1">•</span>
                        <span>Credentials are <strong>case-sensitive</strong>. Verify your User ID and Password.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-slate-500 mt-1">•</span>
                        <span>The official portal may be down for maintenance.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-slate-500 mt-1">•</span>
                        <span>Clear your browser cache and cookies if the issue persists.</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v3.25a1 1 0 11-2 0 7.002 7.002 0 01-11.276-2.943 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                      Session Expired?
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-slate-500 mt-1">•</span>
                        <span>Try <strong>logging out and back in</strong> to refresh your secure session tokens.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-slate-500 mt-1">•</span>
                        <span>Your session automatically expires after one week for your protection.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

             {/* Support */}
             <section id="support" className="scroll-mt-24">
               <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 text-center">
                 <h2 className="text-2xl font-bold text-blue-900 mb-4">Need More Help?</h2>
                 <p className="text-blue-700 max-w-2xl mx-auto mb-6">
                   If you're facing persistent issues or have suggestions, please reach out. Remember, this is an independent project.
                 </p>
                 <a href="mailto:support@example.com" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg transition-colors shadow-lg shadow-blue-200">
                   Contact Support
                 </a>
               </div>
             </section>

          </main>
        </div>

        <footer className="text-center mt-24 pt-8 border-t border-slate-200 text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Student Portal App. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default DocsPage;
