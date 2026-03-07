'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FileText, 
  TrendingUp, 
  Copy, 
  Check, 
  Trash2, 
  ChevronLeft,
  Calendar,
  Clock,
  Mic
} from 'lucide-react';
import { useStudentQuery } from '@/lib/hooks';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Skeleton from '@/components/ui/Skeleton';

interface SavedMeeting {
  id: number;
  subject: string;
  description: string;
  date: string;
  transcript: string;
  summary: string;
  created_at: string;
}

const SUBJECT_COLORS = [
  'text-blue-500 bg-blue-500/5 border-blue-500/10',
  'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
  'text-violet-500 bg-violet-500/5 border-violet-500/10',
  'text-amber-500 bg-amber-500/5 border-amber-500/10',
  'text-rose-500 bg-rose-500/5 border-rose-500/10',
  'text-cyan-500 bg-cyan-500/5 border-cyan-500/10',
  'text-indigo-500 bg-indigo-500/5 border-indigo-500/10',
  'text-orange-500 bg-orange-500/5 border-orange-500/10',
];

export default function MeetingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: student } = useStudentQuery();
  const [meeting, setMeeting] = useState<SavedMeeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id && student?.id) {
      fetchMeeting();
    }
  }, [id, student?.id]);

  const fetchMeeting = async () => {
    try {
      const res = await fetch(`/api/student/meetings?userId=${student?.id}`);
      const data = await res.json();
      if (data.data) {
        const found = data.data.find((m: any) => m.id.toString() === id);
        if (found) {
          setMeeting(found);
        } else {
          toast.error("Meeting not found");
          router.push('/meetings');
        }
      }
    } catch (error) {
      toast.error("Failed to load record");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!student?.id || !meeting) return;
    if (!confirm("Delete this record?")) return;

    try {
      const res = await fetch(`/api/student/meetings?id=${meeting.id}&userId=${student.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success("Deleted.");
        router.push('/meetings');
      }
    } catch (error) {
      toast.error("Delete failed.");
    }
  };

  const handleCopy = async () => {
    if (!meeting) return;
    try {
      await navigator.clipboard.writeText(meeting.summary);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Copy failed.");
    }
  };

  const getSubjectColor = (subject: string) => {
    let hash = 0;
    const code = subject.split(' - ')[0];
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SUBJECT_COLORS.length;
    return SUBJECT_COLORS[index];
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full rounded-xl" /></div>;
  if (!meeting) return null;

  const colorClass = getSubjectColor(meeting.subject);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <button 
          onClick={() => router.push('/meetings')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          <ChevronLeft className="h-4 w-4" />
          Archive
        </button>

        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border pb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 border text-[9px] font-black uppercase rounded ${colorClass}`}>
                  {meeting.subject.split(' - ')[0]}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{meeting.date}</span>
              </div>
              <h1 className="text-3xl font-black text-foreground uppercase tracking-tight leading-tight">
                {meeting.description || meeting.subject}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopy}
                className="p-3 bg-muted hover:bg-primary/10 hover:text-primary rounded-xl transition-all active:scale-95"
                title="Copy Summary"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
              <button 
                onClick={handleDelete}
                className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl transition-all active:scale-95"
                title="Delete Record"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">AI Insight Report</h3>
              </div>
              <div className="bg-card border border-border/50 rounded-xl p-6 md:p-8 shadow-sm">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h3: ({node, ...props}) => <h3 className="text-sm font-black uppercase tracking-tight text-primary mt-6 first:mt-0" {...props} />,
                      p: ({node, ...props}) => <p className="leading-relaxed font-medium text-foreground/80 mb-4" {...props} />,
                      ul: ({node, ...props}) => <ul className="space-y-2 my-4" {...props} />,
                      li: ({node, ...props}) => (
                        <li className="flex gap-2" {...props}>
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                          <span>{props.children}</span>
                        </li>
                      ),
                      blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-2 border-primary/20 bg-primary/5 px-4 py-2 italic my-6" {...props} />
                      )
                    }}
                  >
                    {meeting.summary}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Raw Audio Log</h3>
              </div>
              <div className="bg-muted/5 border border-border/30 rounded-xl p-5 max-h-[400px] overflow-y-auto custom-scrollbar">
                <p className="text-[11px] text-muted-foreground/70 leading-relaxed italic font-medium">
                  {meeting.transcript}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
