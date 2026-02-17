import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, Scale, Info, ExternalLink } from 'lucide-react';

const DisclaimerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Header Section */}
        <header className="mb-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-blue-100 shadow-sm mb-6">
            <ShieldCheck className="h-3 w-3" />
            Compliance & Transparency
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
            Legal Disclaimer <span className="text-slate-400">&</span> Terms of Use
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
            Please read this information carefully. By accessing LCC Hub, you agree to the practices and terms outlined in this official notice.
          </p>
          <div className="mt-8 flex items-center gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Last Updated: February 16, 2026</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Version 1.2.0</span>
          </div>
        </header>

        <div className="grid gap-8">
          {/* Primary Warning Card */}
          <div className="relative overflow-hidden bg-white p-8 rounded-3xl border border-slate-200 shadow-sm group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldAlert size={120} />
            </div>
            <div className="relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Unofficial Third-Party Platform
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed text-lg">
                  This application is <span className="font-bold text-slate-900">not an official school publication</span>. It is a community-driven initiative developed independently for the convenience of the student body. 
                </p>
                <p className="text-slate-500 mt-4 italic">
                  LCC (La Concepcion College) does not endorse, maintain, or assume responsibility for the functionality or security of this third-party interface.
                </p>
              </div>
            </div>
          </div>

          {/* Three Column Details */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <Lock className="h-5 w-5 text-blue-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Security Standard</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                We employ AES-256 encryption for session handling. Credentials are never persisted in our database; they reside only in your secure, encrypted session.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <Scale className="h-5 w-5 text-blue-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Legal Compliance</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Fully compliant with the Philippine Data Privacy Act of 2012 (RA 10173). We respect your right to data portability and privacy.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <Info className="h-5 w-5 text-blue-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Service Continuity</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Since we rely on scraping the official portal, updates to the school's website may cause temporary service interruptions.
              </p>
            </div>
          </div>

          {/* Detailed Sections */}
          <div className="space-y-12 mt-8">
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">
                1. Professional Use & Liability
              </h3>
              <p className="text-slate-600 leading-relaxed">
                This software is provided "as-is" without any express or implied warranties. The developers shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this service, including but not limited to account lockouts or data discrepancies.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">
                2. Data Extraction Policy
              </h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                The application functions as a "Headless Browser Wrapper." It programmatically retrieves your own student data from the official portal and formats it for a better user experience. No data is modified on the official school servers through this app.
              </p>
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 font-medium">
                  We recommend verifying critical information (like financial balances or final grades) with the official school registrar.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">
                3. Intellectual Property
              </h3>
              <p className="text-slate-600 leading-relaxed">
                All school logos, course names, and institutional data remain the intellectual property of La Concepcion College. This app claims no ownership over official school branding or student records.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-12 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-slate-200" />
              <span className="text-xs font-bold uppercase tracking-widest">LCC Hub Official Notice</span>
            </div>
            <p className="text-[10px] font-medium text-center md:text-right uppercase tracking-tighter">
              &copy; {new Date().getFullYear()} — Built for Students by Students. All Rights Reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DisclaimerPage;
