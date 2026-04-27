'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Activity, 
  ChevronRight, 
  Trash2, 
  Loader2, 
  FileCode, 
  Search,
  X,
  Bug,
  Database,
  Braces,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      }
    } catch (e) {
      console.error('Failed to delete incident');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List View */}
        <div className="surface-neutral rounded-3xl border border-border/50 overflow-hidden flex flex-col h-[600px]">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Incidents</h3>
            </div>
            <button 
                onClick={fetchIncidents}
                className="p-1 hover:bg-background rounded-lg transition-all"
                title="Refresh Logs"
            >
                <Activity className={`h-3 w-3 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : incidents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <CheckCircle2 className="h-12 w-12 text-emerald-500/20 mb-4" />
                <p className="text-sm font-bold text-muted-foreground">System healthy. No incidents logged.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-all flex items-start gap-4 cursor-pointer group ${
                      selectedIncident?.id === incident.id ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${
                      incident.severity === 'error' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{incident.task}</span>
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {new Date(incident.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-foreground truncate">{incident.error_message}</p>
                      <div className="flex items-center gap-3 mt-2 text-[9px] font-bold text-muted-foreground uppercase">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {incident.user_id}</span>
                        <span>{new Date(incident.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(incident.id, e)}
                      disabled={isDeleting === incident.id}
                      className="p-2 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {isDeleting === incident.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="surface-neutral rounded-3xl border border-border/50 overflow-hidden flex flex-col h-[600px]">
          <AnimatePresence mode="wait">
            {selectedIncident ? (
              <motion.div 
                key={selectedIncident.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Incident Analysis</h3>
                  </div>
                  <button onClick={() => setSelectedIncident(null)} className="p-1 hover:bg-muted rounded-lg">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-background rounded-2xl border border-border/50">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        selectedIncident.severity === 'error' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {selectedIncident.severity}
                      </span>
                    </div>
                    <div className="p-3 bg-background rounded-2xl border border-border/50">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">User ID</p>
                      <p className="text-xs font-bold text-foreground">{selectedIncident.user_id}</p>
                    </div>
                  </div>

                  {selectedIncident.student_name && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-primary uppercase tracking-widest">Originating Student</p>
                            <p className="text-sm font-black text-foreground uppercase">{selectedIncident.student_name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{selectedIncident.student_course}</p>
                        </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Error Description</p>
                    <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                      <p className="text-sm font-medium text-foreground leading-relaxed">{selectedIncident.error_message}</p>
                    </div>
                  </div>

                  {selectedIncident.ai_result && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">AI Extraction Result</p>
                        <Braces className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] border border-border rounded-2xl">
                        <pre className="text-[10px] font-mono whitespace-pre-wrap text-foreground overflow-auto">
                          {typeof selectedIncident.ai_result === 'string' 
                            ? JSON.stringify(JSON.parse(selectedIncident.ai_result), null, 2)
                            : JSON.stringify(selectedIncident.ai_result, null, 2)
                          }
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedIncident.raw_html && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Evidence (Raw HTML)</p>
                        <FileCode className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] border border-border rounded-2xl h-[200px] overflow-auto custom-scrollbar">
                        <pre className="text-[10px] font-mono whitespace-pre-wrap text-muted-foreground/80">
                          {selectedIncident.raw_html}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-muted-foreground opacity-50">
                <Search className="h-12 w-12 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Select an incident to investigate</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
