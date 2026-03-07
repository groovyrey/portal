'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  RotateCcw, 
  FileText, 
  Loader2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  LayoutGrid,
  Copy,
  Check,
  Plus,
  History,
  Trash2,
  ChevronRight,
  Search,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudentQuery } from '@/lib/hooks';
import { summarizeMeeting } from '@/app/g-space/actions';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Skeleton from '@/components/ui/Skeleton';
import PageHeader from '@/components/shared/PageHeader';
import Drawer from '@/components/layout/Drawer';
import Modal from '@/components/ui/Modal';
import { ScheduleItem } from '@/types';

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
  'text-blue-500 bg-blue-500/10 border-blue-500/20',
  'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  'text-violet-500 bg-violet-500/10 border-violet-500/20',
  'text-amber-500 bg-amber-500/10 border-amber-500/20',
  'text-rose-500 bg-rose-500/10 border-rose-500/20',
  'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  'text-orange-500 bg-orange-500/10 border-orange-500/20',
];

export default function MeetingsPage() {
  const { data: student, isLoading: studentLoading } = useStudentQuery();
  const [meetings, setMeetings] = useState<SavedMeeting[]>([]);
  const [isFetchingMeetings, setIsFetchingMeetings] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [viewingMeeting, setViewingMeeting] = useState<SavedMeeting | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getSubjectColor = (subject: string) => {
    let hash = 0;
    const code = subject.split(' - ')[0];
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SUBJECT_COLORS.length;
    return SUBJECT_COLORS[index];
  };

  useEffect(() => {
    if (student?.id) {
      fetchMeetings();
    }
  }, [student?.id]);

  const fetchMeetings = async () => {
    if (!student?.id) return;
    setIsFetchingMeetings(true);
    try {
      const res = await fetch(`/api/student/meetings?userId=${student.id}`);
      const data = await res.json();
      if (data.data) {
        setMeetings(data.data);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load recorded meetings.');
    } finally {
      setIsFetchingMeetings(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        processRecording(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.info("Recording started...");
    } catch (err) {
      console.error("Recording error:", err);
      toast.error("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processRecording = async (blob: Blob) => {
    if (!selectedSchedule || !student) return;
    
    setIsProcessing(true);
    
    // 1. Transcribe
    setProcessingStatus('Converting voice to text...');
    const formData = new FormData();
    formData.append('audio', blob);

    try {
      const transcribeRes = await fetch('/api/deepgram', {
        method: 'POST',
        body: formData
      });
      const transcribeData = await transcribeRes.json();
      
      if (!transcribeData.transcript) throw new Error(transcribeData.error || "Transcription failed");
      const rawTranscript = transcribeData.transcript;
      setTranscript(rawTranscript);

      // 2. Summarize
      setProcessingStatus('AI is analyzing the meeting...');
      const aiSummary = await summarizeMeeting(rawTranscript, student);
      setSummary(aiSummary);

      // 3. Save to Turso
      setProcessingStatus('Saving to your records...');
      const saveRes = await fetch('/api/student/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: student.id,
          subject: selectedSchedule.subject,
          description: selectedSchedule.description,
          date: new Date().toLocaleDateString(),
          transcript: rawTranscript,
          summary: aiSummary
        })
      });

      if (saveRes.ok) {
        toast.success("Meeting recorded and analyzed successfully!");
        fetchMeetings();
      } else {
        throw new Error("Failed to save meeting record.");
      }
    } catch (err: any) {
      console.error("Processing error:", err);
      toast.error(err.message || "An error occurred during processing.");
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleDelete = async (id: number) => {
    if (!student?.id) return;
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const res = await fetch(`/api/student/meetings?id=${id}&userId=${student.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success("Record deleted.");
        fetchMeetings();
        if (viewingMeeting?.id === id) setViewingMeeting(null);
      }
    } catch (error) {
      toast.error("Failed to delete record.");
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (studentLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-primary rounded-full" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Academic Archives</h2>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Lectures & <span className="text-primary">Notes</span></h1>
            <p className="text-xs font-bold text-muted-foreground max-w-sm">Capture your classroom wisdom and let AI transform it into strategic study guides.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:translate-y-[-2px] hover:shadow-primary/30 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Start Session
          </button>
        </div>

        {isFetchingMeetings ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
          </div>
        ) : meetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {meetings.map((meeting) => {
              const colorClass = getSubjectColor(meeting.subject);
              return (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border/50 rounded-3xl p-6 hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(meeting.id); }}
                      className="p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div onClick={() => setViewingMeeting(meeting)} className="cursor-pointer space-y-5">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${colorClass}`}>
                        {meeting.subject.split(' - ')[0]}
                      </span>
                      <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{meeting.date}</span>
                    </div>
                    
                    <div>
                      <h3 className="text-base font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                        {meeting.description || meeting.subject}
                      </h3>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground">
                            <FileText className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Transcript</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            <TrendingUp className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Insight</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-muted/10 border-2 border-dashed border-border/50 rounded-[3rem] p-20 text-center flex flex-col items-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse" />
              <div className="relative h-24 w-24 bg-background border border-border/50 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/5 rotate-6">
                <Mic className="h-10 w-10 text-primary/40" />
              </div>
            </div>
            <h3 className="text-lg font-black text-foreground uppercase tracking-widest italic">Silent <span className="text-primary">Library</span></h3>
            <p className="text-xs font-bold text-muted-foreground/60 mt-3 max-w-xs leading-relaxed uppercase tracking-wider">
              No sessions found. Tap "Start Session" to begin capturing your lectures.
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={<h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary px-2">Select Active Session</h3>}
      >
        <div className="p-4 space-y-4">
          <div className="bg-accent/50 rounded-2xl p-4 flex items-start gap-3 mb-2">
            <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">Choose a class from your current schedule to bind this recording to your academic data.</p>
          </div>
          
          <div className="space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
            {student?.schedule && student.schedule.length > 0 ? (
              student.schedule.map((item, idx) => {
                const colorClass = getSubjectColor(item.subject);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedSchedule(item);
                      setIsAddModalOpen(false);
                      setIsDrawerOpen(true);
                    }}
                    className="w-full text-left p-5 rounded-3xl border border-border/50 bg-muted/20 hover:bg-background hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${colorClass}`}>
                          {item.subject.split(' - ')[0]}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {item.time}
                        </div>
                      </div>
                      <p className="text-sm font-black text-foreground uppercase tracking-tight truncate pr-4">
                        {item.description || item.subject}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-background border border-border rounded-2xl flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/20 transition-all">
                        <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em]">Live Schedule Empty</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => {
            if (!isRecording && !isProcessing) {
                setIsDrawerOpen(false);
                setSelectedSchedule(null);
                setAudioBlob(null);
                setTranscript(null);
                setSummary(null);
            }
        }}
        side="bottom"
        title={selectedSchedule ? `RECORDING: ${selectedSchedule.subject.split(' - ')[0]}` : 'NEW RECORDING'}
      >
        <div className="flex flex-col items-center space-y-10 pb-16">
          {!audioBlob && !isProcessing ? (
            <>
              <div className={`relative h-32 w-32 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 ${
                isRecording ? 'bg-rose-500 text-white shadow-[0_0_50px_rgba(244,63,94,0.3)] rotate-0' : 'bg-primary/10 text-primary rotate-3 border border-primary/20'
              }`}>
                {isRecording && (
                  <motion.div 
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-rose-500 rounded-[2.5rem] -z-10"
                  />
                )}
                {isRecording ? <Mic className="h-12 w-12 animate-pulse" /> : <Mic className="h-12 w-12 opacity-30" />}
              </div>

              <div className="text-center space-y-3">
                <h4 className="text-3xl font-black tracking-tight tabular-nums">
                  {isRecording ? formatTime(recordingTime) : '0:00'}
                </h4>
                <div className="flex flex-col items-center gap-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                        {isRecording ? 'System Active' : 'Waiting for Input'}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium max-w-[200px]">
                        {isRecording ? 'Capturing high-fidelity classroom audio...' : 'Ensure your environment is quiet for best results.'}
                    </p>
                </div>
              </div>

              <div className="w-full max-w-xs pt-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
                  >
                    Engage Recorder
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-full py-5 bg-rose-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-rose-500/20 active:scale-95 transition-all"
                  >
                    Cease & Analyze
                  </button>
                )}
              </div>
            </>
          ) : isProcessing ? (
            <div className="flex flex-col items-center py-16 space-y-8">
               <div className="relative">
                  <div className="h-20 w-20 border-[6px] border-primary/5 border-t-primary rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-pulse" />
                  </div>
               </div>
               <div className="text-center space-y-3">
                 <h4 className="text-sm font-black uppercase tracking-[0.3em] text-primary animate-pulse">{processingStatus}</h4>
                 <div className="h-1 w-32 bg-muted mx-auto rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="h-full w-full bg-primary"
                    />
                 </div>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Neural Link Established</p>
               </div>
            </div>
          ) : (
            <div className="w-full space-y-8 max-w-2xl mx-auto">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] p-6 flex items-center gap-5">
                <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-base font-black text-foreground uppercase tracking-tight">Intelligence Synthesized</h4>
                  <p className="text-[11px] font-bold text-emerald-600/70 uppercase tracking-widest">Saved to Academic Archive</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <TrendingUp className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">Study Intelligence</h3>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none font-medium leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary || ''}</ReactMarkdown>
                  </div>
                </div>

                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-5 bg-muted text-foreground rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-muted/80 transition-all"
                >
                  Return to Archive
                </button>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      <Modal
        isOpen={!!viewingMeeting}
        onClose={() => setViewingMeeting(null)}
        maxWidth="max-w-4xl"
      >
        {viewingMeeting && (
          <div className="p-8 md:p-12 space-y-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 border text-[10px] font-black uppercase rounded-full ${getSubjectColor(viewingMeeting.subject)}`}>
                        {viewingMeeting.subject.split(' - ')[0]}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{viewingMeeting.date}</span>
                </div>
                <h2 className="text-3xl font-black text-foreground uppercase tracking-tight leading-none italic">
                    {viewingMeeting.description || viewingMeeting.subject}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button 
                   onClick={() => handleCopy(viewingMeeting.summary)}
                   className="p-3 bg-muted hover:bg-primary/10 hover:text-primary rounded-[1rem] transition-all active:scale-95"
                   title="Copy Summary"
                >
                  {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                </button>
                <button 
                   onClick={() => handleDelete(viewingMeeting.id)}
                   className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-[1rem] transition-all active:scale-95"
                   title="Delete Record"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 border-b border-border pb-4">
                        <div className="h-8 w-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em]">Study Insight Report</h3>
                    </div>
                    <div className="bg-muted/10 rounded-[2.5rem] p-8 md:p-10 prose prose-sm dark:prose-invert max-w-none shadow-inner border border-border/50">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h3: ({node, ...props}) => <h3 className="text-lg font-black uppercase tracking-tight text-primary mt-8 first:mt-0" {...props} />,
                                p: ({node, ...props}) => <p className="leading-relaxed font-medium text-foreground/80 mb-4" {...props} />,
                                ul: ({node, ...props}) => <ul className="space-y-3 my-6" {...props} />,
                                li: ({node, ...props}) => (
                                    <li className="flex gap-3" {...props}>
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-2 shrink-0" />
                                        <span>{props.children}</span>
                                    </li>
                                ),
                                blockquote: ({node, ...props}) => (
                                    <blockquote className="border-l-4 border-primary/20 bg-primary/5 px-6 py-4 rounded-r-2xl italic my-8" {...props} />
                                )
                            }}
                        >
                            {viewingMeeting.summary}
                        </ReactMarkdown>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-border pb-4">
                        <div className="h-8 w-8 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                            <FileText className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Raw Audio Log</h3>
                    </div>
                    <div className="bg-muted/5 rounded-[2rem] p-6 max-h-[500px] overflow-y-auto custom-scrollbar border border-border/30">
                        <p className="text-[11px] text-muted-foreground/70 leading-relaxed italic font-medium">
                            {viewingMeeting.transcript}
                        </p>
                    </div>
                </div>
            </div>

            <button 
              onClick={() => setViewingMeeting(null)}
              className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:opacity-90 transition-all active:scale-95 shadow-2xl"
            >
              Back to Archive
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
