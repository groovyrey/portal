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
  ChevronRight
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
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-blue-600 pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="h-24 w-24 bg-white rounded-3xl shadow-xl flex items-center justify-center p-4">
              <GraduationCap className="h-12 w-12 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">La Concepcion College</h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                Changing Lives for the Better. Founded in 1998, LCC remains committed to providing quality education in the heart of Bulacan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Links */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Official Portals
              </h2>
              <div className="grid gap-4">
                {officialLinks.map((link) => (
                  <a 
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{link.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{link.description}</p>
                    </div>
                    <ExternalLink className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </a>
                ))}
              </div>
            </section>

            {/* Academic Calendar Notice */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Calendar size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Academic Calendar (S.Y. 2025-2026)</h3>
                <p className="text-slate-500 mb-6">
                  Stay updated with the latest semester schedules and examination dates.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Upcoming Exam</p>
                    <p className="text-sm font-bold text-slate-800">Midterm Week</p>
                    <p className="text-xs text-slate-500">March 2026 (Tentative)</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Holiday</p>
                    <p className="text-sm font-bold text-slate-800">Holy Week Break</p>
                    <p className="text-xs text-slate-500">March 30 - April 5, 2026</p>
                  </div>
                </div>

                <a 
                  href="https://www.facebook.com/laconcepcioncollege/photos" 
                  target="_blank"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
                >
                  View Full Calendar
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Contact Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                Institution Contact
              </h3>
              <div className="space-y-6">
                {contactInfo.map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-700">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100">
                <a 
                  href="https://www.facebook.com/laconcepcioncollege" 
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#1877F2] text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  <Facebook className="h-4 w-4" />
                  Follow on Facebook
                </a>
              </div>
            </div>

            {/* Location Map */}
            <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-64">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3857.240742151608!2d121.0688846108153!3d14.811802971842918!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397afd625759755%3A0x6a1006509a721727!2sLa%20Concepcion%20College!5e0!3m2!1sen!2sph!4v1708100000000!5m2!1sen!2sph" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-2xl"
              ></iframe>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolInfoPage;
