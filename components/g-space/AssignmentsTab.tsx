'use client';

import { 
  BookOpen, 
  ExternalLink, 
  Clock, 
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  FileText,
  Target,
  Loader2,
  LayoutGrid,
  Maximize2,
  Copy,
  Check,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClassroomAssignment, ClassroomCourse } from '@/types/g-space';
import { Student } from '@/types';
import Skeleton from '@/components/ui/Skeleton';
import { analyzeAssignments } from '@/app/g-space/actions';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AssignmentsTabProps {
  student: Student;
  linkedEmail: string | null;
  isFetching: boolean;
  assignments: ClassroomAssignment[];
  courses: ClassroomCourse[];
  handleGoogleVerify: () => void;
}

export default function AssignmentsTab({
  student,
  linkedEmail,
  isFetching,
  assignments,
  courses,
  handleGoogleVerify
}: AssignmentsTabProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (assignments.length === 0 || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeAssignments(assignments, student, courses);
      setAnalysisResult(result);
      toast.success("Workload analysis updated.");
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze workload.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleCopy = async () => {
    if (!analysisResult) return;
    try {
      // Primary method: navigator.clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(analysisResult);
      } else {
        // Fallback for non-secure contexts (HTTP) or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = analysisResult;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!successful) throw new Error("Fallback copy failed");
      }
      
      setCopied(true);
      toast.success("Analysis copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error("Failed to copy analysis to clipboard");
    }
  };
  
  const formatDate = (dueDate?: { year: number; month: number; day: number }, dueTime?: { hours: number; minutes: number }) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate.year, dueDate.month - 1, dueDate.day);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    if (dueTime) {
      const h = dueTime.hours || 0;
      const m = (dueTime.minutes || 0).toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${dateStr}, ${h12}:${m} ${ampm}`;
    }
    
    return dateStr;
  };

  const isOverdue = (dueDate?: { year: number; month: number; day: number }, dueTime?: { hours: number; minutes: number }) => {
    if (!dueDate) return false;
    const now = new Date();
    const due = new Date(dueDate.year, dueDate.month - 1, dueDate.day, dueTime?.hours || 23, dueTime?.minutes || 59);
    return now > due;
  };

  const getStatusBadge = (state: string, overdue: boolean) => {
    switch (state) {
      case 'TURNED_IN':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Turned In</span>;
      case 'RETURNED':
        return <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">Returned</span>;
      default:
        if (overdue) {
          return <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20">Missing</span>;
        }
        return <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">Assigned</span>;
    }
  };

  if (!linkedEmail) {
    return (
      <div className="relative min-h-[500px] flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-3xl -z-10" />
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 rotate-3">
          <FileText className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-black mb-3">Sync Assignments</h2>
        <p className="text-muted-foreground text-sm font-medium max-w-sm mb-8">
          Link your Google account to view and manage all your Google Classroom assignments in one place.
        </p>
        <button 
          onClick={handleGoogleVerify}
          className="px-8 py-4 bg-foreground text-background rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl"
        >
          Link Google Account
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Academic Workload</h2>
          <p className="text-xs text-muted-foreground font-medium">Monitoring classroom updates and upcoming schedules.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || assignments.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-xs font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-50 active:scale-95"
          >
            {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
            {isAnalyzing ? 'Analyzing...' : 'Analyze Workload'}
          </button>
          <div className="px-4 py-2.5 bg-muted/50 rounded-full border border-border/50">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {assignments.length} Total Tasks
            </p>
          </div>
        </div>
      </div>

      {/* Strategic Insights Result */}
      <AnimatePresence>
        {(isAnalyzing || analysisResult) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 -z-10" />
            <div className="bg-card border-2 border-primary/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-500">
                <LayoutGrid className="w-32 h-32 text-primary" />
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Workload Analysis</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Academic Insight Report</p>
                  </div>
                </div>
                {analysisResult && (
                  <button 
                    onClick={handleCopy}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all border border-border/50 bg-background/50"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
              </div>

              {isAnalyzing ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 text-primary animate-spin" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">Running system diagnostics...</span>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed font-medium break-words">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, children, ...props}) => <h1 className="text-xl font-black text-primary mb-4 mt-6 flex items-center gap-2 border-b border-primary/10 pb-2" {...props}>{children}</h1>,
                      h2: ({node, children, ...props}) => <h2 className="text-lg font-bold text-foreground mb-3 mt-5 flex items-center gap-2" {...props}>{children}</h2>,
                      h3: ({node, children, ...props}) => <h3 className="text-base font-bold text-foreground/90 mb-2 mt-4" {...props}>{children}</h3>,
                      p: ({node, children, ...props}) => <p className="mb-4 last:mb-0" {...props}>{children}</p>,
                      ul: ({node, children, ...props}) => <ul className="space-y-2 mb-4 ml-4" {...props}>{children}</ul>,
                      ol: ({node, children, ...props}) => <ol className="list-decimal space-y-2 mb-4 ml-6" {...props}>{children}</ol>,
                      li: ({node, children, ...props}) => (
                        <li className="flex gap-2 group" {...props}>
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary shrink-0 transition-colors" />
                          <span>{children}</span>
                        </li>
                      ),
                      blockquote: ({node, children, ...props}) => (
                        <blockquote className="border-l-4 border-primary/30 bg-primary/5 px-6 py-4 rounded-r-2xl my-6 italic text-foreground/70 relative overflow-hidden" {...props}>
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent -z-10" />
                          {children}
                        </blockquote>
                      ),
                      table: ({node, children, ...props}) => (
                        <div className="my-6 overflow-x-auto rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                          <table className="w-full border-collapse text-[11px] min-w-[500px]" {...props}>{children}</table>
                        </div>
                      ),
                      thead: ({node, children, ...props}) => <thead className="bg-muted/50 border-b border-border/50" {...props}>{children}</thead>,
                      th: ({node, children, ...props}) => <th className="px-4 py-3 text-left font-bold text-primary uppercase tracking-wider" {...props}>{children}</th>,
                      td: ({node, children, ...props}) => <td className="px-4 py-3 border-b border-border/10 last:border-0" {...props}>{children}</td>,
                      hr: ({node, ...props}) => <hr className="my-8 border-t-2 border-dashed border-border/30" {...props} />,
                      strong: ({node, children, ...props}) => <strong className="font-black text-primary/90" {...props}>{children}</strong>,
                    }}
                  >
                    {String(analysisResult || '')}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {isFetching && assignments.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card border border-border/50 rounded-2xl p-4 flex gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-3 w-1/4 rounded" />
              </div>
            </div>
          ))
        ) : assignments.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border/50">
            <div className="h-12 w-12 bg-background border border-border/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No assignments found</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">You're all caught up or no classrooms are linked.</p>
          </div>
        ) : (
          assignments.map((assignment) => {
            const overdue = isOverdue(assignment.dueDate, assignment.dueTime);
            
            return (
              <a 
                key={assignment.id} 
                href={assignment.alternateLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group block p-5 rounded-2xl border border-border/50 bg-card hover:bg-muted/5 hover:border-primary/30 transition-all relative overflow-hidden shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${
                    overdue ? 'bg-rose-500/10 border-rose-500/20' : 'bg-primary/10 border-primary/20'
                  }`}>
                    <BookOpen className={`h-6 w-6 ${overdue ? 'text-rose-500' : 'text-primary'}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold text-primary/80 uppercase tracking-tight truncate max-w-[200px]">
                        {assignment.courseName}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">•</span>
                      <div className="text-[9px] font-bold uppercase tracking-wider">
                        {getStatusBadge(assignment.state, overdue)}
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {assignment.title}
                    </h3>
                  </div>

                  <div className="flex flex-col md:items-end gap-1.5 shrink-0">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold ${
                      overdue ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-muted border-border/50 text-muted-foreground'
                    }`}>
                      {overdue ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {formatDate(assignment.dueDate, assignment.dueTime)}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-primary/60 uppercase tracking-widest md:justify-end">
                      View in Classroom <ExternalLink className="h-2.5 w-2.5" />
                    </div>
                  </div>
                </div>
                
                {assignment.description && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-[11px] text-muted-foreground line-clamp-2 italic leading-relaxed">
                      {assignment.description}
                    </p>
                  </div>
                )}
              </a>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
