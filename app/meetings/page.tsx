'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Mic, 
  Square, 
  FileText, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useStudentQuery } from '@/lib/hooks';
import { summarizeMeeting } from '@/app/g-space/actions';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Skeleton from '@/components/ui/Skeleton';
import Drawer from '@/components/layout/Drawer';
import Modal from '@/components/ui/Modal';
import { ScheduleItem } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function MeetingsPage() {
  const router = useRouter();
  const { data: student, isLoading: studentLoading } = useStudentQuery();
  const [meetings, setMeetings] = useState<SavedMeeting[]>([]);
  const [isFetchingMeetings, setIsFetchingMeetings] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  
  // Day selection state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [summary, setSummary] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (month > 0) setCurrentMonth(new Date(year, month - 1, 1));
  };
  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (month < 11) setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Filter schedule for the selected date
  const filteredSchedule = useMemo(() => {
    if (!student?.schedule || !selectedDate) return [];
    
    const dayName = selectedDate.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
    
    return student.schedule.filter(item => {
      const parts = item.time.split(' ');
      if (parts.length < 1) return false;
      const daysStr = parts[0];
      const days = daysStr.split('-');
      return days.includes(dayName);
    });
  }, [student?.schedule, selectedDate]);

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
      toast.error('Failed to load meetings.');
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
      
      toast.info("Recording...");
    } catch (err) {
      toast.error("Microphone access denied.");
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
    setProcessingStatus('Transcribing...');
    const formData = new FormData();
    formData.append('audio', blob);

    try {
      const transcribeRes = await fetch('/api/deepgram', {
        method: 'POST',
        body: formData
      });
      const transcribeData = await transcribeRes.json();
      
      if (!transcribeData.transcript) throw new Error("Transcription failed");
      const rawTranscript = transcribeData.transcript;

      setProcessingStatus('Summarizing...');
      const aiSummary = await summarizeMeeting(rawTranscript, student);
      setSummary(aiSummary);

      setProcessingStatus('Saving...');
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
        toast.success("Saved to Archive.");
        fetchMeetings();
      } else {
        throw new Error("Save failed");
      }
    } catch (err: any) {
      toast.error("Processing error.");
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleDelete = async (id: number) => {
    if (!student?.id) return;
    if (!confirm("Delete this record?")) return;

    try {
      const res = await fetch(`/api/student/meetings?id=${id}&userId=${student.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success("Deleted.");
        fetchMeetings();
      }
    } catch (error) {
      toast.error("Delete failed.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (studentLoading) return <div className="p-8"><Skeleton className="h-64 w-full rounded-lg" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex justify-between items-end gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Archives</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Capture & Review Lectures</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Record
          </button>
        </div>

        {isFetchingMeetings ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}
          </div>
        ) : meetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((meeting) => {
              const colorClass = getSubjectColor(meeting.subject);
              return (
                <div
                  key={meeting.id}
                  className="bg-card border border-border/50 rounded-lg p-5 hover:border-primary/30 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(meeting.id); }}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <Link href={`/meetings/${meeting.id}`} className="block space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${colorClass}`}>
                        {meeting.subject.split(' - ')[0]}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{meeting.date}</span>
                    </div>
                    
                    <h3 className="text-sm font-black text-foreground uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                      {meeting.description || meeting.subject}
                    </h3>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        LOG
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.2em] text-primary">
                        <TrendingUp className="h-3 w-3" />
                        INSIGHT
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-muted/5 border border-dashed border-border rounded-lg p-16 text-center flex flex-col items-center">
            <Mic className="h-8 w-8 text-muted-foreground/20 mb-4" />
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest opacity-40 italic">Empty Vault</h3>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={<span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary px-2">Create Record</span>}
        maxWidth="max-w-md"
      >
        <div className="p-4 space-y-6">
          {/* Day Selector */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest">{currentMonth.toLocaleString('default', { month: 'short' })}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{year}</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handlePrevMonth} 
                  disabled={month === 0}
                  className="p-1.5 hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed rounded-lg transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button 
                  onClick={handleNextMonth} 
                  disabled={month === 11}
                  className="p-1.5 hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed rounded-lg transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="text-center py-1 text-[8px] font-black text-muted-foreground/40">{d}</div>
              ))}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`pad-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const date = new Date(year, month, dayNum);
                const isSelected = selectedDate.toDateString() === date.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <button 
                    key={dayNum} 
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110' 
                        : isToday 
                          ? 'bg-primary/10 text-primary border border-primary/20' 
                          : 'hover:bg-muted text-foreground/60'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtered Schedule */}
          <div className="space-y-2">
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Classes for {selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {filteredSchedule.length > 0 ? (
                filteredSchedule.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedSchedule(item);
                      setIsAddModalOpen(false);
                      setIsDrawerOpen(true);
                    }}
                    className="w-full text-left p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-background hover:border-primary/30 transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${getSubjectColor(item.subject)}`}>
                          {item.subject.split(' - ')[0]}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.time.split(' ').slice(1).join(' ')}</span>
                      </div>
                      <p className="text-xs font-black text-foreground uppercase tracking-tight truncate">{item.description || item.subject}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all" />
                  </button>
                ))
              ) : (
                <div className="text-center py-10 bg-muted/10 rounded-lg border border-dashed border-border/50">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">No Class Scheduled</p>
                </div>
              )}
            </div>
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
                setSummary(null);
            }
        }}
        side="bottom"
        title={selectedSchedule ? `Engaging: ${selectedSchedule.subject.split(' - ')[0]}` : 'Recorder'}
      >
        <div className="flex flex-col items-center space-y-8 pb-12">
          {!audioBlob && !isProcessing ? (
            <>
              <div className={`h-24 w-24 rounded-2xl flex items-center justify-center transition-all ${
                isRecording ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'bg-primary/10 text-primary border border-primary/20'
              }`}>
                {isRecording ? <Mic className="h-10 w-10 animate-pulse" /> : <Mic className="h-10 w-10 opacity-30" />}
              </div>

              <div className="text-center space-y-2">
                <h4 className="text-2xl font-black tracking-tight tabular-nums">
                  {isRecording ? formatTime(recordingTime) : '0:00'}
                </h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                    {isRecording ? 'Capturing Session' : 'Ready'}
                </p>
              </div>

              <div className="w-full max-w-xs">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-full py-4 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
                  >
                    Stop & Process
                  </button>
                )}
              </div>
            </>
          ) : isProcessing ? (
            <div className="flex flex-col items-center py-12 space-y-6">
               <Loader2 className="h-8 w-8 text-primary animate-spin" />
               <div className="text-center space-y-2">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">{processingStatus}</h4>
                 <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Do not close drawer</p>
               </div>
            </div>
          ) : (
            <div className="w-full space-y-6 max-w-lg mx-auto">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-5 flex items-center gap-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <div>
                  <h4 className="text-xs font-black text-foreground uppercase">Synthesized</h4>
                  <p className="text-[9px] font-bold text-emerald-600/70 uppercase">Saved to library</p>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-lg p-6">
                <div className="prose prose-sm dark:prose-invert max-w-none font-medium leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary || ''}</ReactMarkdown>
                </div>
              </div>

              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-full py-4 bg-muted text-foreground rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
