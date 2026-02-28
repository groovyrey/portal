import React from 'react';
import { 
  ExternalLink, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Facebook, 
  Building2, 
  GraduationCap, 
  Calendar,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

const SchoolInfoPage = () => {
  const officialLinks = [
    { name: 'Official Student Portal', url: 'https://premium.schoolista.com/LCC/', description: 'Access the official school management system directly.' },
    { name: 'LCC Official Website', url: 'http://www.laconcepcioncollege.com/', description: 'Main institutional website for news and announcements.' },
    { name: 'LCC Facebook Page', url: 'https://www.facebook.com/laconcepcioncollege', description: 'Latest updates, events, and community news.' },
  ];

  const contactInfo = [
    { icon: <Phone className="h-4 w-4" />, label: 'Registrar', value: '(044) 769 1171' },
    { icon: <Mail className="h-4 w-4" />, label: 'Email', value: 'info@laconcepcioncollege.com' },
    { icon: <MapPin className="h-4 w-4" />, label: 'Address', value: 'Kaypian, City of San Jose del Monte, Bulacan' },
  ];

  return (
    <div className="min-h-screen bg-accent font-sans text-foreground pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900 pt-16 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-all text-xs font-bold mb-8 active:scale-95">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="h-20 w-20 bg-card rounded-2xl flex items-center justify-center shrink-0">
              <GraduationCap className="h-10 w-10 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">La Concepcion College</h1>
              <p className="text-muted-foreground text-base max-w-2xl font-medium">
                Changing Lives for the Better. Founded in 1998, LCC remains committed to providing quality education in the heart of Bulacan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Portals */}
            <section>
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4 ml-1">Official Portals</h2>
              <div className="grid gap-3">
                {officialLinks.map((link) => (
                  <a 
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-card p-5 rounded-2xl border border-border hover:border-slate-400 transition-all flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <h3 className="font-bold text-foreground text-sm group-hover:text-blue-600 transition-colors">{link.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">{link.description}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-muted-foreground transition-colors" />
                  </a>
                ))}
              </div>
            </section>

            {/* Calendar */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-base font-bold text-foreground mb-4">Academic Calendar 2025-2026</h3>
                
                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  <div className="p-4 rounded-xl bg-accent border border-border">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Upcoming Exam</p>
                    <p className="text-sm font-bold text-foreground">Midterm Week</p>
                    <p className="text-xs text-muted-foreground font-medium">March 2026 (Tentative)</p>
                  </div>
                  <div className="p-4 rounded-xl bg-accent border border-border">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Holiday</p>
                    <p className="text-sm font-bold text-foreground">Holy Week Break</p>
                    <p className="text-xs text-muted-foreground font-medium">March 30 - April 5, 2026</p>
                  </div>
                </div>

                <a 
                  href="https://www.facebook.com/laconcepcioncollege/photos" 
                  target="_blank"
                  className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all active:scale-95"
                >
                  Full Calendar
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Contact */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-6 ml-1">Contact Details</h3>
              <div className="space-y-5">
                {contactInfo.map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className="text-xs font-bold text-foreground leading-tight">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-border">
                <a 
                  href="https://www.facebook.com/laconcepcioncollege" 
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Facebook className="h-3.5 w-3.5" />
                  Facebook Page
                </a>
              </div>
            </div>

            {/* Map */}
            <div className="bg-card p-1 rounded-2xl border border-border shadow-sm overflow-hidden h-60">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3857.240742151608!2d121.0688846108153!3d14.811802971842918!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397afd625759755%3A0x6a1006509a721727!2sLa%20Concepcion%20College!5e0!3m2!1sen!2sph!4v1708100000000!5m2!1sen!2sph" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-xl"
              ></iframe>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolInfoPage;
