'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Activity, 
  Trash2, 
  Loader2, 
  FileCode, 
  Search,
  X,
  Bug,
  Braces,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Incident {
  id: number;
  task: string;
  user_id: string;
  student_name?: string;
  student_course?: string;
  error_message: string;
  ai_result: string | any;
  raw_html: string;
  severity: 'warning' | 'error';
  created_at: string;
}

export default function IncidentsTab() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/incidents');
      const data = await res.json();
      if (Array.isArray(data)) setIncidents(data);
    } catch (e) {
      console.error('Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(id);
    try {
      const res = await fetch('/api/admin/incidents', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setIncidents(prev => prev.filter(i => i.id !== id));
        if (selectedIncident?.id === id) setSelectedIncident(null);
      }
    } catch (e) {
      console.error('Failed to delete');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* List View */}
        <Card className={cn("lg:col-span-2 flex flex-col h-[500px] lg:h-[600px]", selectedIncident && "hidden lg:flex")}>
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0 border-b">
            <CardTitle className="text-sm font-semibold">Incident Log</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchIncidents}>
                <Activity className={cn("h-4 w-4 text-muted-foreground", loading && "animate-spin")} />
            </Button>
          </CardHeader>
          
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            ) : incidents.length === 0 ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-center p-8">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/20 mb-4" />
                <p className="text-xs font-medium text-muted-foreground">No issues detected.</p>
              </div>
            ) : (
              <div className="divide-y">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className={cn(
                      "w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-start gap-4 cursor-pointer group relative",
                      selectedIncident?.id === incident.id && "bg-accent"
                    )}
                  >
                    <div className={cn(
                        "p-2 rounded-md shrink-0",
                        incident.severity === 'error' ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"
                    )}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-bold uppercase text-primary truncate pr-2">{incident.task}</span>
                        <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-medium truncate">{incident.error_message}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="truncate">{incident.user_id}</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(incident.id, e)}
                      disabled={isDeleting === incident.id}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 lg:group-hover:opacity-100 transition-opacity hover:text-destructive"
                    >
                      {isDeleting === incident.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Detail View */}
        <Card className={cn("lg:col-span-3 flex flex-col h-[600px]", !selectedIncident && "hidden lg:flex")}>
          <AnimatePresence mode="wait">
            {selectedIncident ? (
              <motion.div 
                key={selectedIncident.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col h-full overflow-hidden"
              >
                <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0 border-b">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => setSelectedIncident(null)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Bug className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Details</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hidden lg:flex" onClick={() => setSelectedIncident(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>

                <ScrollArea className="flex-1">
                  <div className="p-4 sm:p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Severity</Label>
                        <div className="pt-1">
                            <Badge variant={selectedIncident.severity === 'error' ? 'destructive' : 'secondary'} className={cn("text-[10px] uppercase", selectedIncident.severity === 'warning' && "bg-amber-500 hover:bg-amber-600 text-white")}>
                                {selectedIncident.severity}
                            </Badge>
                        </div>
                      </div>
                      <div className="space-y-1 sm:text-right">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">User Session</Label>
                        <p className="text-xs font-mono pt-1 break-all">{selectedIncident.user_id}</p>
                      </div>
                    </div>

                    <Separator />

                    {selectedIncident.student_name && (
                      <div className="flex items-center gap-4 p-4 rounded-md bg-muted/30 border">
                        <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-primary uppercase">Origin Student</p>
                            <p className="text-sm font-bold truncate">{selectedIncident.student_name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase truncate">{selectedIncident.student_course}</p>
                        </div>
                      </div>
                    )}

                      <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Error Trace</Label>
                      <div className="p-4 rounded-md bg-destructive/5 border border-destructive/20 overflow-hidden">
                        <p className="text-xs font-medium leading-relaxed break-words overflow-hidden">{selectedIncident.error_message}</p>
                      </div>
                    </div>

                    {selectedIncident.ai_result && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Structured Output</Label>
                          <Braces className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <pre className="p-4 rounded-md bg-muted text-[10px] font-mono whitespace-pre-wrap overflow-auto border max-h-[300px]">
                          {typeof selectedIncident.ai_result === 'string' 
                            ? JSON.stringify(JSON.parse(selectedIncident.ai_result), null, 2)
                            : JSON.stringify(selectedIncident.ai_result, null, 2)
                          }
                        </pre>
                      </div>
                    )}

                    {selectedIncident.raw_html && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Source Material</Label>
                          <FileCode className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="p-4 rounded-md bg-muted border h-64 overflow-auto">
                          <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap">
                            {selectedIncident.raw_html}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-muted-foreground/50">
                <Search className="h-10 w-10 mb-4" />
                <p className="text-sm font-medium">Select an incident to view details.</p>
              </div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
