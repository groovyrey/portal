import React from 'react';

const DisclaimerPage: React.FC = () => {
  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen">
      <div className="container mx-auto px-6 py-16 max-w-5xl">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Disclaimer & User Agreement
          </h1>
          <p className="text-lg text-slate-500 font-medium bg-slate-100 inline-block px-4 py-1 rounded-full border border-slate-200">
            Last Updated: October 26, 2023
          </p>
        </header>

        {/* Third-Party Notice */}
        <section className="mb-12 p-8 bg-amber-50 border border-amber-100 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>
          <div className="flex items-start gap-6 relative z-10">
            <div className="hidden sm:flex h-12 w-12 rounded-full bg-amber-100 text-amber-600 items-center justify-center flex-shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-3">
                Third-Party Application Notice
              </h2>
              <p className="text-lg leading-relaxed text-amber-800/90">
                This application is an <strong className="font-bold text-amber-900">unofficial, third-party tool</strong> developed independently to provide an alternative interface to the student portal at <code className="bg-amber-100/50 px-1.5 py-0.5 rounded font-mono text-sm font-bold">premium.schoolista.com</code>. It is <strong className="font-bold text-red-600">NOT</strong> affiliated with, endorsed, sponsored, or managed by the school or Schoolista.
              </p>
            </div>
          </div>
        </section>

        {/* Data Handling and Security */}
        <section className="mb-12 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10">
          <div className="flex items-center gap-4 mb-8">
             <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Data & Security</h2>
          </div>
          
          <div className="space-y-6">
            <p className="text-lg text-slate-600">
              By using this application, you understand, acknowledge, and consent to the following:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">Credential Use</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  You are required to provide your student portal User ID and Password. These are submitted directly to the school's official portal to establish a session.
                </p>
              </div>

               <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                  Local Storage Risk
                  <span className="bg-red-200 text-red-800 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Important</span>
                </h3>
                <p className="text-red-800/80 text-sm leading-relaxed">
                  Credentials are saved in your browser's <code className="bg-red-100 px-1 py-0.5 rounded font-bold">localStorage</code>. This poses a security risk on shared computers. <strong>Do not use this app on public devices.</strong>
                </p>
              </div>

               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">Data Collection</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We scrape personal, academic, and financial information to display it in the app's interface.
                </p>
              </div>

               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">Server Caching</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Data is temporarily cached on a secure database (<a href="https://neon.tech/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">NeonDB</a>) to improve performance and reliability.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-12 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10">
          <div className="flex items-center gap-4 mb-6">
             <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Limitation of Liability</h2>
          </div>
          <div className="prose prose-slate max-w-none text-slate-600">
            <p className="text-lg">
              This application is provided <strong>"as-is"</strong> without any warranties. We do not guarantee accuracy or availability.
            </p>
            <p className="text-lg">
              By using this tool, you agree that the developers are not liable for any damages (data breaches, financial loss, academic issues) arising from its use. You assume all risks associated with providing your credentials to a third-party interface.
            </p>
          </div>
        </section>

        {/* Philippine Laws Section */}
        <section className="mb-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl shadow-blue-200 p-8 md:p-12 text-white">
          <h2 className="text-3xl font-bold mb-6 tracking-tight">Governing Law & Your Rights</h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-8 max-w-3xl">
            We strive to operate in accordance with the laws of the Republic of the Philippines. As a data subject, you have rights under the <strong>Data Privacy Act of 2012 (RA 10173)</strong>.
          </p>
          <a 
            href="https://www.privacy.gov.ph/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20"
          >
            National Privacy Commission
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </section>

        {/* Footer */}
        <footer className="text-center border-t border-slate-200 pt-8">
          <p className="text-slate-500 mb-4 max-w-2xl mx-auto">
            By proceeding to use this application, you confirm that you have read, understood, and agreed to the terms outlined in this disclaimer.
          </p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Student Portal App. All Rights Reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DisclaimerPage;
