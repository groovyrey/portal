import React from 'react';

const DisclaimerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <header className="mb-16">
          <div className="inline-block px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-widest rounded-full border border-amber-100 mb-6">
            Legal Notice
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Disclaimer & Agreement
          </h1>
          <p className="text-slate-500 font-medium">
            Last Updated: February 16, 2026
          </p>
        </header>

        <div className="space-y-12">
          {/* Main Alert Card */}
          <div className="bg-white p-8 rounded-2xl border-l-4 border-l-amber-400 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m12 9 4 7H8l4-7Z"/><path d="M12 3v1"/><path d="M12 17v1"/><path d="m4.93 4.93.71.71"/><path d="m18.36 18.36.71.71"/><path d="M3 12h1"/><path d="M20 12h1"/><path d="m4.93 19.07.71-.71"/><path d="m18.36 5.64.71-.71"/></svg>
              Unofficial Tool Notice
            </h2>
            <p className="text-slate-600 leading-relaxed">
              This application is an <span className="font-semibold text-slate-900">unofficial, third-party interface</span> developed independently. It is not affiliated with, endorsed, or managed by the school. By using this tool, you acknowledge that you are using it at your own risk.
            </p>
          </div>

          {/* Key Terms Grid */}
          <div className="grid gap-8">
            <section>
              <h3 className="text-lg font-bold mb-4 text-slate-800">1. Data Handling</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                We handle your credentials with professional-grade security. Passwords are used only to establish a secure session and are <strong>never</strong> stored.
              </p>
              <ul className="grid gap-3">
                {['AES-256 Encryption', 'HttpOnly Cookies', 'No Persistent Storage'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-4 text-slate-800">2. Limitation of Liability</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                The developers are not responsible for any data issues, account lockouts, or academic consequences arising from the use of this software. The tool is provided "as-is" for convenience.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-4 text-slate-800">3. Local Compliance</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                We operate in accordance with the <strong>Philippine Data Privacy Act of 2012 (RA 10173)</strong>. Your privacy rights as a data subject are respected at all times.
              </p>
            </section>
          </div>
        </div>

        <footer className="mt-24 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            Student Portal &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DisclaimerPage;
