import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, Scale, Info } from 'lucide-react';

export default function DisclaimerContent() {
  return (
    <div className="grid gap-8">
      {/* Data Assurance & Purpose Section */}
      <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldCheck size={140} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/20 mb-6">
            <Info className="h-3 w-3" />
            Data Assurance & Purpose
          </div>
          <h2 className="text-2xl font-bold mb-4">How & Why We Use Your Data</h2>
          <p className="text-blue-50 leading-relaxed font-medium mb-6">
            LCC Hub is designed to enhance your student experience. We use your data exclusively to provide a modern, mobile-friendly interface for checking your grades, schedule, and financial status.
          </p>
          <ul className="grid md:grid-cols-2 gap-4 text-sm font-semibold text-blue-100">
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 bg-white/10 rounded-full flex items-center justify-center text-white shrink-0">✓</div>
              <span>Secure, on-the-fly processing without permanent storage of credentials.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 bg-white/10 rounded-full flex items-center justify-center text-white shrink-0">✓</div>
              <span>Encrypted session handling to prevent unauthorized data access.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 bg-white/10 rounded-full flex items-center justify-center text-white shrink-0">✓</div>
              <span>Data is pulled directly from the official portal and never modified.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 bg-white/10 rounded-full flex items-center justify-center text-white shrink-0">✓</div>
              <span>Zero-tracking policy: we do not sell or share your personal information.</span>
            </li>
          </ul>
        </div>
      </div>

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
            <p className="text-slate-600 leading-relaxed text-lg font-medium">
              This application is <span className="font-bold text-slate-900">not an official school publication</span>. It is a community-driven initiative developed independently for the convenience of the student body. 
            </p>
            <p className="text-slate-500 mt-4 italic leading-relaxed">
              LCC (La Concepcion College) does not endorse, maintain, or assume responsibility for the functionality, data accuracy, or security of this third-party interface. Use of this application is entirely voluntary.
            </p>
          </div>
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

        <section>
          <h3 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-4">
            4. Enhanced Features & Developer Responsibility
          </h3>
          <p className="text-slate-600 leading-relaxed">
            To provide a superior user experience, this application may include supplemental data, formatted content (such as parsed names), or community-driven features that do not exist on the official school portal. Any such enhancements, metadata, or additional information provided exclusively within LCC Hub are the sole responsibility and liability of the application developers and are not to be attributed to La Concepcion College.
          </p>
        </section>

        {/* Formal Terms of Service Section */}
        <section className="bg-slate-900 text-white rounded-3xl p-8 mt-16 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="h-6 w-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Terms of Service</h2>
          </div>
          
          <div className="grid gap-6 text-slate-300 text-sm leading-relaxed">
            <div>
              <h4 className="text-white font-bold mb-2">1. Acceptance of Terms</h4>
              <p>By logging into LCC Hub, you acknowledge that you have read, understood, and agree to be bound by these terms. If you do not agree, you must immediately cease use of the application.</p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-2">2. User Responsibility</h4>
              <p>You are solely responsible for maintaining the confidentiality of your school credentials. You agree not to use this platform for any fraudulent activity or to intentionally circumvent official school policies.</p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-2">3. Service "AS-IS"</h4>
              <p>LCC Hub is provided as a convenience tool. We provide no guarantee of 100% uptime, data accuracy, or continued compatibility with the official school portal. We reserve the right to modify or terminate the service at any time without prior notice.</p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-2">4. Limitation of Liability</h4>
              <p>In no event shall the developers be held liable for any disciplinary actions, academic discrepancies, or technical issues arising from the use of this third-party wrapper.</p>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-[10px] font-medium text-slate-500 italic">
                Note: These terms exist to protect both the student body and the independent developers of this project.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
