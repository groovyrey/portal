import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, Scale, Info } from 'lucide-react';

export default function DisclaimerContent() {
  return (
    <div className="grid gap-8">
      {/* Your Data & How We Use It Section */}
      <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldCheck size={140} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-card/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/20 mb-6">
            <Info className="h-3 w-3" />
            Your Data & How We Use It
          </div>
          <h2 className="text-2xl font-bold mb-4">How & Why We Use Your Data</h2>
          <p className="text-blue-50 leading-relaxed font-medium mb-6">
            LCC Hub is made to make your student life easier. We use your data only to show your grades, schedule, and financial status in a better, mobile-friendly way.
          </p>
          <ul className="grid md:grid-cols-2 gap-4 text-sm font-semibold text-blue-100">
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 bg-card/10 rounded-full flex items-center justify-center text-white shrink-0">✓</div>
              <span>Securely processed without saving your passwords.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 bg-card/10 rounded-full flex items-center justify-center text-white shrink-0">✓</div>
              <span>Encrypted sessions to keep your data safe.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 bg-card/10 rounded-full flex items-center justify-center text-white shrink-0">✓</div>
              <span>Your info comes straight from the school and we never change it.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 bg-card/10 rounded-full flex items-center justify-center text-white shrink-0">✓</div>
              <span>No Tracking: we do not sell or share your personal information.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Not an Official School App Warning Card */}
      <div className="relative overflow-hidden bg-card p-8 rounded-3xl border border-border shadow-sm group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <ShieldAlert size={120} />
        </div>
        <div className="relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Not an Official School App
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed text-lg font-medium">
              This app is <span className="font-bold text-foreground">not an official school publication</span>. It is made by students for students to make portal navigation easier. 
            </p>
            <p className="text-muted-foreground/80 mt-4 italic leading-relaxed">
              LCC (La Concepcion College) is not responsible for how this app works or the data it shows. Using this app is your choice.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-12 mt-8">
        <section>
          <h3 className="text-xl font-bold text-foreground mb-4 border-l-4 border-blue-600 pl-4">
            1. Rules & Responsibility
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            This software is provided &quot;as-is&quot; with no guarantees. The makers of this app are not responsible for any problems or issues, like account locks or wrong information.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-foreground mb-4 border-l-4 border-blue-600 pl-4">
            2. How We Get Your Data
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The app acts as a secure web tool. it automatically gets your school info from the official portal and formats it for a better experience. We never change any data on the school&apos;s servers.
          </p>
          <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-600 dark:text-blue-400 dark:text-blue-400 font-medium">
              We recommend checking important info (like fees or final grades) with the school registrar directly.
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-foreground mb-4 border-l-4 border-blue-600 pl-4">
            3. School Property
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            All school logos and names are owned by La Concepcion College. This app does not claim to own any school branding or records.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-foreground mb-4 border-l-4 border-blue-600 pl-4">
            4. App Features & Who&apos;s Responsible
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            This app may show extra info or better-looking text that isn&apos;t on the official school portal. These features are the responsibility of the app makers and are not from La Concepcion College.
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
              <h4 className="text-white font-bold mb-2">1. Agreeing to the Rules</h4>
              <p>By logging into LCC Hub, you agree to these rules. If you do not agree, please stop using the app right away.</p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-2">2. Your Responsibility</h4>
              <p>You are responsible for keeping your school login safe. You agree not to use this app for any dishonest activity or to break school rules.</p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-2">3. Service as it is</h4>
              <p>LCC Hub is a convenience tool. We can&apos;t guarantee it will always be online or always work with the school portal. We can change or stop the app at any time.</p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-2">4. Responsibility Limit</h4>
              <p>The app makers are not responsible for any school punishments, grade errors, or technical bugs that happen while using this app.</p>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-[10px] font-medium text-muted-foreground italic">
                Note: These terms exist to protect both the students and the independent makers of this project.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
