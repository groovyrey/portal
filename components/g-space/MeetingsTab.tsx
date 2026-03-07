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
  BookOpen, 
  CheckCircle2, 
  History,
  TrendingUp,
  LayoutGrid,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student, ScheduleItem } from '@/types';
import { summarizeMeeting } from '@/app/g-space/actions';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Skeleton from '@/components/ui/Skeleton';

interface MeetingsTabProps {
  student: Student;
}

export default function MeetingsTab({ student }: MeetingsTabProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.info("Recording started. Make sure you're in a quiet place.");
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
      toast.success("Recording saved.");
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    
    setIsTranscribing(true);
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
      const res = await fetch('/api/deepgram', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.transcript) {
        setTranscript(data.transcript);
        toast.success("Transcription complete.");
      } else {
        throw new Error(data.error || "Transcription failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to transcribe audio.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSummarize = async () => {
    if (!transcript) return;
    
    setIsSummarizing(true);
    try {
      const result = await summarizeMeeting(transcript, student);
      setSummary(result);
      toast.success("Meeting summary generated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to summarize meeting.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success("Summary copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard.");
    }
  };

  const resetAll = () => {
    setAudioBlob(null);
    setTranscript(null);
    setSummary(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Meeting Assistant</h2>
          <p className="text-xs text-muted-foreground font-medium">Record, transcribe, and summarize your class sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2.5 bg-muted/50 rounded-full border border-border/50 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {isRecording ? `Recording: ${formatTime(recordingTime)}` : 'System Ready'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Schedule Selection & Recording */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Select Session</h3>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {student.schedule && student.schedule.length > 0 ? (
                student.schedule.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSchedule(item)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedSchedule === item 
                        ? 'bg-primary/10 border-primary shadow-sm' 
                        : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-tight truncate max-w-[120px]">
                        {item.subject}
                      </span>
                      {selectedSchedule === item && <CheckCircle2 className="h-3 w-3 text-primary" />}
                    </div>
                    <p className="text-xs font-bold text-foreground line-clamp-1">{item.description}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.time}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground text-xs italic">
                  No schedule available.
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-6">
            <div className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all ${
              isRecording ? 'bg-rose-500 text-white' : 'bg-primary/10 text-primary border border-primary/20'
            }`}>
              {isRecording && (
                <motion.div 
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-rose-500/20 rounded-full -z-10"
                />
              )}
              {isRecording ? <Mic className="h-10 w-10" /> : <Mic className="h-10 w-10 opacity-50" />}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold">
                {isRecording ? 'Recording Session...' : 'Voice Recorder'}
              </h4>
              <p className="text-[10px] text-muted-foreground font-medium px-4">
                {selectedSchedule 
                  ? `Recording for ${selectedSchedule.subject}` 
                  : 'Select a subject from your schedule to begin.'}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full">
              {!isRecording ? (
                <button
                  disabled={!selectedSchedule || audioBlob !== null}
                  onClick={startRecording}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-50 active:scale-95"
                >
                  <Mic className="h-3.5 w-3.5" />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-600 transition-all active:scale-95"
                >
                  <Square className="h-3.5 w-3.5" />
                  Stop Recording
                </button>
              )}
              
              {(audioBlob || transcript || summary) && !isRecording && (
                <button
                  onClick={resetAll}
                  className="p-3 bg-muted border border-border/50 text-muted-foreground rounded-xl hover:bg-muted-foreground/10 transition-all"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Transcription & Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress / Step UI */}
          {!audioBlob && !transcript && !summary && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-muted/20 rounded-3xl border border-dashed border-border/50">
              <div className="h-16 w-16 bg-background border border-border/50 rounded-2xl flex items-center justify-center mb-4">
                <History className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Active Session</h3>
              <p className="text-[11px] text-muted-foreground/60 mt-2 max-w-xs leading-relaxed">
                Choose a class from your schedule and start recording to generate study notes automatically.
              </p>
            </div>
          )}

          {audioBlob && !transcript && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold tracking-tight">Recording Captured</h3>
                <p className="text-xs text-muted-foreground font-medium">Ready to convert your voice into text.</p>
              </div>
              <button
                disabled={isTranscribing}
                onClick={handleTranscribe}
                className="w-full max-w-xs flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {isTranscribing ? 'Transcribing...' : 'Generate Transcript'}
              </button>
            </motion.div>
          )}

          {transcript && (
            <div className="space-y-6">
              {/* Raw Transcript Card */}
              <div className="bg-card border border-border/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold">Raw Transcript</h3>
                  </div>
                  {!summary && (
                    <button
                      disabled={isSummarizing}
                      onClick={handleSummarize}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {isSummarizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingUp className="h-3 w-3" />}
                      {isSummarizing ? 'Summarizing...' : 'Summarize with AI'}
                    </button>
                  )}
                </div>
                <div className="bg-muted/30 border border-border/50 rounded-xl p-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                  <p className="text-[11px] leading-relaxed text-foreground/80 font-medium">
                    {transcript}
                  </p>
                </div>
              </div>

              {/* AI Summary Result */}
              <AnimatePresence>
                {(isSummarizing || summary) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden group"
                  >
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
                            <h3 className="text-sm font-bold tracking-tight">Meeting Insight Report</h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">AI Generated Study Guide</p>
                          </div>
                        </div>
                        {summary && (
                          <button 
                            onClick={handleCopy}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all border border-border/50 bg-background/50"
                          >
                            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        )}
                      </div>

                      {isSummarizing ? (
                        <div className="space-y-4">
                          <Skeleton className="h-4 w-full rounded" />
                          <Skeleton className="h-4 w-5/6 rounded" />
                          <Skeleton className="h-20 w-full rounded-2xl" />
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 text-primary animate-spin" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">Analyzing transcript...</span>
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
                              strong: ({node, children, ...props}) => <strong className="font-black text-primary/90" {...props}>{children}</strong>,
                            }}
                          >
                            {String(summary || '')}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
