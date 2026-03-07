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
    if (!analysisResult) {
      toast.error("No analysis to copy.");
      return;
    }

    try {
      // 1. Try modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(analysisResult);
        setCopied(true);
        toast.success("Analysis copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      
      // 2. Fallback for non-secure contexts or older browsers
      const textArea = document.createElement("textarea");
      textArea.value = analysisResult;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopied(true);
        toast.success("Analysis copied to clipboard (fallback)");
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error("Copy command failed");
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error("Clipboard access denied or failed.");
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
          <div className="px-4 py-2.5 bg-muted/50 rounded-full border border-border/50">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {assignments.length} Total Tasks
            </p>
          </div>
        </div>
      </div>

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
