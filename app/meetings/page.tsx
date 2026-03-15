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
  AlertCircle,
  Wifi,
  WifiOff,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudentQuery } from '@/lib/hooks';
import { summarizeMeeting } from '@/lib/ai-service';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Skeleton from '@/components/ui/Skeleton';
import Drawer from '@/components/layout/Drawer';
import Modal from '@/components/ui/Modal';
import { ScheduleItem } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { recordingDB } from '@/lib/indexed-db';

interface SavedMeeting {
  id: number;
  subject: string;
  description: string;
  date: string;
  transcript: string;
  summary: string;
  notes?: string;
  created_at: string;
}

const SUBJECT_COLORS = [
  'text-primary bg-primary/5 border-primary/10',
  'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
  'text-violet-500 bg-violet-500/5 border-violet-500/10',
  'text-amber-500 bg-amber-500/5 border-amber-500/10',
  'text-destructive bg-destructive/5 border-destructive/10',
  'text-cyan-500 bg-cyan-500/5 border-cyan-500/10',
  'text-indigo-500 bg-indigo-500/5 border-indigo-500/10',
  'text-orange-500 bg-orange-500/5 border-orange-500/10',
];

const LANGUAGES = [
  { code: 'tl', label: 'Filipino/Tagalog' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'hi', label: 'Hindi' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'multi', label: 'Auto (Multi)' },
];

export default function MeetingsPage() {
  const router = useRouter();
  const { data: student, isLoading: studentLoading } = useStudentQuery();
  const [meetings, setMeetings] = useState<SavedMeeting[]>([]);
  const [isFetchingMeetings, setIsFetchingMeetings] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('tl');
  
  // Day selection state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [summary, setSummary] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  
  // New Live Transcription States
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecoverable, setIsRecoverable] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

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
    checkRecoverableSession();
    if (student?.id) {
      fetchMeetings();
    }
  }, [student?.id]);

  const checkRecoverableSession = async () => {
    const sessions = await recordingDB.getAllSessions();
    const active = sessions.find(s => s.status === 'recording' || s.status === 'failed');
    if (active) {
      setIsRecoverable(true);
      setSessionId(active.id);
    }
  };

  const recoverSession = async () => {
    if (!sessionId) return;
    const session = await recordingDB.getSession(sessionId);
    if (session) {
      setLiveTranscript(session.transcript);
      setSelectedSchedule({ 
        subject: session.subject, 
        description: session.description, 
        section: session.section,
        units: session.units,
        time: '', 
        room: ''
      });
      setIsDrawerOpen(true);
      setIsRecoverable(false);
      toast.success("Restored session");
    }
  };

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
    if (!selectedSchedule) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Recording not supported in this browser or context (needs HTTPS).");
      return;
    }

    try {
      // 1. Get Temporary API Key
      const keyRes = await fetch('/api/deepgram');
      const { key } = await keyRes.json();
      if (!key) throw new Error("Failed to authenticate with Deepgram");

      // 2. Initialize MediaRecorder
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      
      // 3. Setup WebSocket
      const socket = new WebSocket(`wss://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&language=${selectedLanguage}`, ['token', key]);
      socketRef.current = socket;

      const newSessionId = Date.now().toString();
      setSessionId(newSessionId);
      setLiveTranscript('');

      socket.onopen = () => {
        console.log("Deepgram: WebSocket opened");
        setIsLiveConnected(true);
        mediaRecorder.start(250); // Send data every 250ms
      };

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel?.alternatives[0]?.transcript;
        if (transcript && received.is_final) {
          setLiveTranscript(prev => {
            const updated = prev + ' ' + transcript;
            // Persist incrementally to IndexedDB
            recordingDB.saveSession(newSessionId, {
              transcript: updated,
              subject: selectedSchedule.subject,
              description: selectedSchedule.description,
              section: selectedSchedule.section,
              units: selectedSchedule.units,
              status: 'recording',
              updated_at: Date.now()
            });
            return updated;
          });
        }
      };

      socket.onclose = (event) => {
        console.log("Deepgram: WebSocket closed", event.code, event.reason);
        setIsLiveConnected(false);
      };
      
      socket.onerror = (error) => {
        console.error("Deepgram: WebSocket error", error);
        toast.error("Live transcription error");
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && socket.readyState === 1) {
          socket.send(e.data);
        }
      };

      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      
      toast.info("Recording & Streaming...");
    } catch (err) {
      console.error(err);
      toast.error("Failed to start recording.");
    }
  };

  const stopRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      socketRef.current?.close();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Process the final transcript accumulated
      if (liveTranscript.length > 10) {
        processTranscript(liveTranscript);
      }
    }
  };

  const processTranscript = async (transcript: string) => {
    if (!selectedSchedule || !student || !sessionId) return;
    
    setIsProcessing(true);
    setProcessingStatus('Finalizing Report...');

    try {
      setProcessingStatus('Summarizing...');
      const aiSummary = await summarizeMeeting(transcript, student);
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
          transcript: transcript,
          summary: aiSummary,
          language: selectedLanguage
        })
      });

      if (saveRes.ok) {
        toast.success("Saved to Archive.");
        // Clear from local IndexedDB on success
        await recordingDB.deleteSession(sessionId);
        setSessionId(null);
        fetchMeetings();
      } else {
        throw new Error("Save failed");
      }
    } catch (err: any) {
      toast.error("Final processing failed.");
      // Keep in IndexedDB so user can try again or copy manually
      await recordingDB.saveSession(sessionId, {
        transcript,
        subject: selectedSchedule.subject,
        description: selectedSchedule.description,
        section: selectedSchedule.section,
        units: selectedSchedule.units,
        status: 'failed',
        updated_at: Date.now()
      });
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

  const formatDate = (dateStr: string, createdAt?: string) => {
    try {
      const d = new Date(createdAt || dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      const datePart = d.toLocaleDateString('en-PH', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      const timePart = d.toLocaleTimeString('en-PH', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }).toLowerCase().replace(/\s/g, '');
      
      return `${datePart} ${timePart}`;
    } catch {
      return dateStr;
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
        <AnimatePresence>
          {isRecoverable && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <History className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold tracking-tight text-amber-500">Unsaved Session Detected</h4>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">A previous recording was interrupted.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { recordingDB.deleteSession(sessionId!); setIsRecoverable(false); }}
                    className="px-3 py-2 text-[8px] font-bold tracking-tight text-muted-foreground hover:text-foreground transition-all"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={recoverSession}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg text-[8px] font-bold tracking-tight shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    Restore
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-end gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">Archives</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Capture & Review Lectures</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold tracking-tight shadow-lg shadow-primary/10 active:scale-95 transition-all"
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
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <Link href={`/meetings/${meeting.id}`} className="block space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${colorClass}`}>
                        {meeting.subject.split(' - ')[0]}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">{formatDate(meeting.date, meeting.created_at)}</span>
                    </div>
                    
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                      {meeting.description || meeting.subject}
                    </h3>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-[8px] font-bold tracking-tight text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        LOG
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-bold tracking-tight text-primary">
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
        title={<span className="text-[10px] font-bold uppercase tracking-tight text-primary px-2">Create Record</span>}
        maxWidth="max-w-md"
      >
        <div className="p-4 space-y-6">
          {/* Day Selector */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-tight">{currentMonth.toLocaleString('default', { month: 'short' })}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">{year}</span>
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
                <div key={d} className="text-center py-1 text-[8px] font-bold text-muted-foreground/40">{d}</div>
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
                    className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
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
            <h4 className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground px-2">Classes for {selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}</h4>
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
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getSubjectColor(item.subject)}`}>
                          {item.subject.split(' - ')[0]}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">{item.time.split(' ').slice(1).join(' ')}</span>
                      </div>
                      <p className="text-xs font-bold text-foreground uppercase tracking-tight truncate">{item.description || item.subject}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all" />
                  </button>
                ))
              ) : (
                <div className="text-center py-10 bg-muted/10 rounded-lg border border-dashed border-border/50">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">No Class Scheduled</p>
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
                setLiveTranscript('');
                setSummary(null);
            }
        }}
        side="bottom"
        title={selectedSchedule ? `Engaging: ${selectedSchedule.subject.split(' - ')[0]}` : 'Recorder'}
      >
        <div className="flex flex-col items-center space-y-8 pb-12">
          {!summary && !isProcessing ? (
            <>
              {/* Language Selection */}
              {!isRecording && (
                <div className="flex flex-wrap justify-center gap-2 max-w-sm px-4">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={`px-3 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-tight transition-all border ${
                        selectedLanguage === lang.code
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                          : 'bg-muted/50 text-muted-foreground border-border/50 hover:border-primary/30'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-6">
                <div className={`h-24 w-24 rounded-2xl flex items-center justify-center transition-all ${
                  isRecording ? 'bg-destructive text-white shadow-xl shadow-destructive/20' : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                  {isRecording ? <Mic className="h-10 w-10 animate-pulse" /> : <Mic className="h-10 w-10 opacity-30" />}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {isLiveConnected ? (
                       <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-bold uppercase tracking-tight">
                         <Wifi className="h-3 w-3" />
                         Live
                       </div>
                    ) : (
                       <div className="flex items-center gap-1.5 px-2 py-1 bg-muted text-muted-foreground rounded text-[8px] font-bold uppercase tracking-tight">
                         <WifiOff className="h-3 w-3" />
                         Offline
                       </div>
                    )}
                    {isRecording && (
                       <div className="flex items-center gap-1.5 px-2 py-1 bg-destructive/10 text-destructive rounded text-[8px] font-bold uppercase tracking-tight animate-pulse">
                         <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                         Rec
                       </div>
                    )}
                  </div>
                  <h4 className="text-3xl font-bold tracking-tight tabular-nums">
                    {isRecording ? formatTime(recordingTime) : '0:00'}
                  </h4>
                </div>
              </div>

              {/* Live Transcript View */}
              <div className="w-full max-w-xl bg-muted/20 border border-border/50 rounded-2xl p-6 min-h-[120px] max-h-[300px] overflow-y-auto custom-scrollbar">
                {liveTranscript ? (
                  <p className="text-xs font-medium leading-relaxed text-foreground/70 italic">
                    {liveTranscript}...
                  </p>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-2">
                     <FileText className="h-6 w-6" />
                     <p className="text-[9px] font-bold uppercase tracking-tight">Waiting for speech</p>
                  </div>
                )}
              </div>

              <div className="w-full max-w-xs">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-full py-4 bg-foreground text-background rounded-lg text-[10px] font-bold uppercase tracking-tight shadow-xl active:scale-95 transition-all"
                  >
                    Start Session
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-full py-4 bg-destructive text-white rounded-lg text-[10px] font-bold uppercase tracking-tight shadow-xl shadow-destructive/20 active:scale-95 transition-all"
                  >
                    Finish & Analyze
                  </button>
                )}
              </div>
            </>
          ) : isProcessing ? (
            <div className="flex flex-col items-center py-12 space-y-6">
               <Loader2 className="h-8 w-8 text-primary animate-spin" />
               <div className="text-center space-y-2">
                 <h4 className="text-[10px] font-bold tracking-tight text-primary animate-pulse">{processingStatus}</h4>
                 <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">Do not close drawer</p>
               </div>
            </div>
          ) : (
            <div className="w-full space-y-6 max-w-lg mx-auto">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-5 flex items-center gap-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase">Synthesized</h4>
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
                className="w-full py-4 bg-muted text-foreground rounded-lg text-[10px] font-bold tracking-tight transition-all"
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
