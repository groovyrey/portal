'use client';

import React, { useState } from 'react';
import { 
  School, 
  MapPin, 
  GraduationCap, 
  Info, 
  Building2, 
  ClipboardCheck,
  Search,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  SCHOOL_INFO, 
  ACADEMIC_PROGRAMS, 
  BUILDING_CODES, 
  GRADING_SYSTEM, 
  COMMON_PROCEDURES,
  IMPORTANT_OFFICES
} from '@/lib/assistant-knowledge';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function KnowledgeTab() {
  const [activeCategory, setActiveCategory] = useState('overview');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Knowledge Base</h3>
          <p className="text-xs text-muted-foreground">Reference data for the AI Assistant.</p>
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-muted/50">
          <TabsTrigger value="overview" className="gap-2 py-2">
            <School className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="academic" className="gap-2 py-2">
            <GraduationCap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Programs</span>
          </TabsTrigger>
          <TabsTrigger value="campus" className="gap-2 py-2">
            <MapPin className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Facilities</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2 py-2">
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Policies</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            <TabsContent value="overview">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{SCHOOL_INFO.name}</CardTitle>
                    <CardDescription>{SCHOOL_INFO.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-8 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Vision</Label>
                      <p className="text-sm text-muted-foreground leading-relaxed">{SCHOOL_INFO.vision}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Mission</Label>
                      <p className="text-sm text-muted-foreground leading-relaxed">{SCHOOL_INFO.mission}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{SCHOOL_INFO.history}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm uppercase tracking-wider">Core Values</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {SCHOOL_INFO.coreValues.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-background rounded-md border border-primary/10 text-xs font-bold uppercase tracking-tight">
                           <ChevronRight className="h-3 w-3 text-primary" />
                           {v}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="academic">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base uppercase tracking-wider">College Programs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {ACADEMIC_PROGRAMS.college.map((p, i) => (
                      <div key={i} className="p-2.5 rounded-md hover:bg-muted transition-colors text-sm font-medium border border-transparent hover:border-border">
                        {p}
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base uppercase tracking-wider">Vocational</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {ACADEMIC_PROGRAMS.tesda.map((p, i) => (
                        <div key={i} className="p-2.5 rounded-md text-sm font-medium border">{p}</div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-base uppercase tracking-wider">Basic Education</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {ACADEMIC_PROGRAMS.basic_ed.map((p, i) => (
                        <Badge key={i} variant="outline" className="bg-background">{p}</Badge>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="campus">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  {SCHOOL_INFO.campuses.map((c, i) => (
                    <Card key={i}>
                      <CardContent className="p-5 space-y-3">
                        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center text-primary"><Building2 size={18} /></div>
                        <div>
                          <p className="font-bold text-sm uppercase">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{c.address}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base uppercase tracking-wider flex items-center justify-between">
                      Facility Codes
                      <Badge variant="secondary" className="font-mono text-[10px]">{Object.keys(BUILDING_CODES).length} Records</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(BUILDING_CODES).map(([code, name]) => (
                      <div key={code} className="flex items-center gap-3 p-2 bg-muted/20 border rounded-md group hover:border-primary/30 transition-colors">
                        <div className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold">{code}</div>
                        <p className="text-[11px] font-medium truncate">{name}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="admin">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid lg:grid-cols-5 gap-6">
                 <div className="lg:col-span-3 space-y-6">
                    <Card>
                      <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Grading System</CardTitle></CardHeader>
                      <CardContent>
                        <pre className="p-4 rounded-md bg-muted font-mono text-[10px] leading-relaxed whitespace-pre-wrap border">{GRADING_SYSTEM.trim()}</pre>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Standard Procedures</CardTitle></CardHeader>
                      <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={COMMON_PROCEDURES} />
                      </CardContent>
                    </Card>
                 </div>
                 <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader><CardTitle className="text-sm uppercase tracking-wider">Key Offices</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        {IMPORTANT_OFFICES.map((o, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-xs font-bold uppercase">{o.name}</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{o.purpose}</p>
                            {i < IMPORTANT_OFFICES.length - 1 && <Separator className="mt-3 opacity-30" />}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                       <CardContent className="pt-8 space-y-3">
                          <Search className="h-10 w-10 mx-auto text-muted-foreground/30" />
                          <p className="text-xs font-medium text-muted-foreground">Manual knowledge base updates only.</p>
                          <Button variant="outline" size="sm" className="w-full text-[10px] uppercase font-bold tracking-widest">Contact Dev Team</Button>
                       </CardContent>
                    </Card>
                 </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
}

function Label({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <p className={cn("text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1", className)} {...props} />
}
