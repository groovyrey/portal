'use client';

import React from 'react';
import { 
  ExternalLink, 
  MapPin, 
  Facebook, 
  GraduationCap, 
  ChevronRight,
  Target,
  Compass,
  History,
  BookOpen,
  Award,
  Users
} from 'lucide-react';
import { SCHOOL_INFO, ACADEMIC_PROGRAMS } from '@/lib/assistant-knowledge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function SchoolInfoPage() {
  const officialLinks = [
    { name: 'Student Portal', url: 'https://premium.schoolista.com/LCC/', description: 'Official management system.' },
    { name: 'Official Website', url: SCHOOL_INFO.socials.website, description: 'Main institutional website.' },
    { name: 'Facebook Page', url: SCHOOL_INFO.socials.facebook, description: 'Latest news and updates.' },
  ];

  return (
    <div className="flex-1 space-y-10 pb-20">
      {/* Hero Section */}
      <div className="relative pt-12 pb-16 px-6 overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 grayscale"
          style={{ backgroundImage: 'url("/herobg.jpeg")' }}
        />
        <div className="max-w-6xl mx-auto relative z-20">
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{SCHOOL_INFO.name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                <Badge variant="secondary" className="font-mono">EST. 1998</Badge>
                <p className="text-muted-foreground text-sm md:text-base font-medium">
                  {SCHOOL_INFO.tagline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 space-y-10">
        <div className="grid lg:grid-cols-3 gap-10">
          
          <div className="lg:col-span-2 space-y-10">
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <Compass className="h-5 w-5 text-primary mb-2" />
                  <CardTitle className="text-sm uppercase tracking-wider">Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {SCHOOL_INFO.vision}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <Target className="h-5 w-5 text-primary mb-2" />
                  <CardTitle className="text-sm uppercase tracking-wider">Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {SCHOOL_INFO.mission}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary mb-2">
                   <History className="h-5 w-5" />
                   <CardTitle className="text-sm uppercase tracking-wider">Our History</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {SCHOOL_INFO.history}
                </p>
              </CardContent>
            </Card>

            <section className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Academic Programs</h2>
              
              <Card>
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Tertiary Education</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                    {ACADEMIC_PROGRAMS.college.map((prog, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{prog}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid sm:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Basic Ed</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    {ACADEMIC_PROGRAMS.basic_ed.map((prog, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                        <span>{prog}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">TESDA</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    {ACADEMIC_PROGRAMS.tesda.map((prog, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                        <span>{prog}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <Card className="bg-primary text-primary-foreground border-none">
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-widest opacity-80">Core Values</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {SCHOOL_INFO.coreValues.map((val, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-md bg-primary-foreground/10 flex items-center justify-center font-bold text-lg">
                      {val.charAt(0)}
                    </div>
                    <span className="text-lg font-bold italic tracking-tight">{val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Official Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {officialLinks.map((link) => (
                  <Button key={link.name} asChild variant="ghost" className="w-full justify-between h-auto py-3 px-3">
                    <a href={link.url} target="_blank">
                      <div className="text-left">
                        <p className="text-xs font-bold">{link.name}</p>
                        <p className="text-[10px] text-muted-foreground">{link.description}</p>
                      </div>
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {SCHOOL_INFO.campuses.map((campus, idx) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      {campus.name}
                    </h4>
                    <div className="space-y-3 ml-5">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Address</p>
                        <p className="text-xs font-medium">{campus.address}</p>
                      </div>
                      <div className="space-y-1">
                        {campus.phone && <p className="text-xs font-medium">Tel: {campus.phone}</p>}
                        {campus.mobile && <p className="text-xs font-medium">Cel: {campus.mobile}</p>}
                        {campus.email && <p className="text-xs font-bold text-primary">{campus.email}</p>}
                      </div>
                    </div>
                    {idx !== SCHOOL_INFO.campuses.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
              <CardFooter className="pt-0">
                <Button asChild className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white">
                  <a href={SCHOOL_INFO.socials.facebook} target="_blank">
                    <Facebook className="mr-2 h-4 w-4" />
                    Visit Facebook
                  </a>
                </Button>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden p-1 h-64">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3857.240742151608!2d121.0688846108153!3d14.811802971842918!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397afd625759755%3A0x6a1006509a721727!2sLa%20Concepcion%20College!5e0!3m2!1sen!2sph!4v1708100000000!5m2!1sen!2sph" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                className="rounded-md"
              ></iframe>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
