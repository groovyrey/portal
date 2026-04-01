import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, Scale, Info } from 'lucide-react';

export default function DisclaimerContent() {
  return (
    <div className="grid gap-8">
      {/* Your Data & How We Use It Section */}
      <div className="bg-primary rounded-3xl p-8 text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden border border-primary-foreground/5">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldCheck size={140} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-foreground/10 text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary-foreground/20 mb-6">
            <Info className="h-3 w-3" />
            Your Data & How We Use It
          </div>
          <h2 className="text-2xl font-bold mb-4">How & Why We Use Your Data</h2>
          <p className="text-primary-foreground/80 leading-relaxed font-medium mb-6">
            LCCian Hub is an unofficial, student-led workspace made to make your academic life easier. We use your data only to show your grades, schedule, and financial status in a better, mobile-friendly way.
          </p>
          <ul className="grid md:grid-cols-2 gap-4 text-sm font-semibold text-primary-foreground/90">
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 bg-primary-foreground/10 rounded-full flex items-center justify-center text-primary-foreground shrink-0">✓</div>
              <span>Securely processed without saving your passwords.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 bg-primary-foreground/10 rounded-full flex items-center justify-center text-primary-foreground shrink-0">✓</div>
              <span>Encrypted sessions to keep your data safe.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 bg-primary-foreground/10 rounded-full flex items-center justify-center text-primary-foreground shrink-0">✓</div>
              <span>Your info comes straight from the school and we never change it.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 bg-primary-foreground/10 rounded-full flex items-center justify-center text-primary-foreground shrink-0">✓</div>
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
            Independent Student Project
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed text-lg font-medium">
              This app is <span className="font-bold text-foreground">NOT an official school publication</span>. It is an independent project made by students, for students, to simplify portal navigation. 
            </p>
            <p className="text-muted-foreground/80 mt-4 italic leading-relaxed">
              LCC (La Concepcion College) does not endorse, authorize, or take responsibility for this application. Using this app is entirely at your own discretion.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-12 mt-8">
        <section>
          <h3 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">
            1. Rules & Responsibility
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            This software is provided &quot;as-is&quot; with no guarantees. The makers of this app are not responsible for any problems or issues, like account locks or wrong information.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">
            2. How We Get Your Data
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The app acts as a secure web tool. it automatically gets your school info from the official portal and formats it for a better experience. We never change any data on the school&apos;s servers.
          </p>
          <div className="bg-primary/5 p-4 rounded-xl border border-border flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground font-medium">
              We recommend checking important info (like fees or final grades) with the school registrar directly.
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">
            3. School Property
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            All school logos and names are owned by La Concepcion College. This app does not claim to own any school branding or records.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">
            4. App Features & Who&apos;s Responsible
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            This app may show extra info or better-looking text that isn&apos;t on the official school portal. These features are the responsibility of the app makers and are not from La Concepcion College.
          </p>
        </section>

        {/* Formal Terms of Service Section */}
        <section className="bg-primary text-primary-foreground rounded-3xl p-8 mt-16 shadow-2xl shadow-primary/20">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="h-6 w-6 text-primary-foreground/60" />
            <h2 className="text-2xl font-bold">Terms of Service</h2>
          </div>
          
          <div className="grid gap-6 text-primary-foreground/80 text-sm leading-relaxed">
            <div>
              <h4 className="text-primary-foreground font-bold mb-2">1. Agreeing to the Rules</h4>
              <p>By logging into LCCian Hub, you agree to these rules. If you do not agree, please stop using the app right away.</p>
            </div>
            
            <div>
              <h4 className="text-primary-foreground font-bold mb-2">2. Your Responsibility</h4>
              <p>You are responsible for keeping your school login safe. You agree not to use this app for any dishonest activity or to break school rules.</p>
            </div>

            <div>
              <h4 className="text-primary-foreground font-bold mb-2">3. Service as it is</h4>
              <p>LCCian Hub is a convenience tool. We can&apos;t guarantee it will always be online or always work with the school portal. We can change or stop the app at any time.</p>
            </div>

            <div>
              <h4 className="text-primary-foreground font-bold mb-2">4. Responsibility Limit</h4>
              <p>The app makers are not responsible for any school punishments, grade errors, or technical bugs that happen while using this app.</p>
            </div>

            <div className="pt-4 border-t border-primary-foreground/10">
              <p className="text-[10px] font-medium text-primary-foreground/60 italic">
                Note: These terms exist to protect both the students and the independent makers of this project.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
