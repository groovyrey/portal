'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  Sparkles,
  HelpCircle,
  Globe,
  Search,
  Copy,
  Check,
  RefreshCcw,
  Youtube,
  Calculator,
  List,
  Calendar,
  CalendarDays,
  Wallet,
  Square,
  VolumeX,
  Volume2,
  Mic,
  StopCircle,
  Settings,
  User,
  Zap,
  Trash2,
  BrainCircuit,
  MessageSquare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import { toast } from 'sonner';
import { useStudent } from '@/lib/hooks';
import AssistantTab from '@/components/settings/AssistantTab';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import TabbedPageLayout from '@/components/layout/TabbedPageLayout';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tools?: string[];
  status?: string;
};

const TypingIndicator = ({ status }: { status?: string }) => (
  <div className="flex items-center gap-2 px-1">
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          className="h-1.5 w-1.5 rounded-full bg-primary"
        />
      ))}
    </div>
    {status && (
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {status}
      </span>
    )}
  </div>
);

const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
};

const SpeakButton = ({ messageId, content, isSpeaking, onSpeak }: { messageId: string, content: string, isSpeaking: boolean, onSpeak: (id: string, content: string) => void }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => { e.stopPropagation(); onSpeak(messageId, content); }}
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
    >
      {isSpeaking ? <VolumeX className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
    </Button>
  );
};

const ChatInput = React.memo(({ 
  onSend, 
  onStop,
  isLoading, 
  onClear,
  hasMessages 
}: { 
  onSend: (content: string) => void, 
  onStop: () => void,
  isLoading: boolean, 
  onClear: () => void,
  hasMessages: boolean
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Microphone access is only available in secure contexts.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) return;
        setIsTranscribing(true);
        const toastId = toast.loading("Processing...");
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob);
          formData.append('language', 'en'); 
          const response = await fetch('/api/deepgram', { method: 'POST', body: formData });
          if (!response.ok) throw new Error('Transcription failed');
          const data = await response.json();
          if (data.transcript) {
            setInput((prev) => prev ? `${prev} ${data.transcript}` : data.transcript);
            toast.success("Speech processed", { id: toastId });
          } else {
            toast.info("No speech detected", { id: toastId });
          }
        } catch (error) {
          toast.error("Failed to process audio", { id: toastId });
        } finally {
          setIsTranscribing(false);
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) { onStop(); return; }
    if (input.trim()) { onSend(input); setInput(''); }
  };

  return (
    <div className="p-4 bg-background border-t">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-4">
        <div className="flex gap-2 items-end">
          <div className="relative flex-1 group">
             <div className="absolute left-1.5 bottom-1 flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClear}
                  disabled={!hasMessages || isLoading}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  title="Clear history"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading || isTranscribing}
                  className={cn("h-8 w-8", isRecording ? "text-destructive animate-pulse" : "text-muted-foreground")}
                  title={isRecording ? "Stop recording" : "Voice input"}
                >
                  {isRecording ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
             </div>
             <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading || isTranscribing}
                placeholder={isRecording ? "Listening..." : "Ask a question..."}
                className="pl-20 h-10 pr-12 focus-visible:ring-1 focus-visible:ring-primary/50"
             />
             {input.length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground/50">
                   {input.length}/2000
                </div>
             )}
          </div>
          <Button 
            type="submit" 
            size="icon" 
            disabled={(!input.trim() && !isLoading) || isTranscribing}
            variant={isLoading ? "destructive" : "default"}
            className="h-10 w-10 shrink-0 shadow-sm"
          >
            {isLoading ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground/80 font-medium">
          Assistant can make mistakes. Check important info.
        </p>
      </form>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default function AssistantPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { student } = useStudent();
  
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [modalQuestion, setModalQuestion] = useState('');
  const [modalPlaceholder, setModalPlaceholder] = useState('');
  const [modalInput, setModalInput] = useState('');

  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [choiceQuestion, setChoiceQuestion] = useState('');
  const [choiceOptions, setChoiceOptions] = useState<string[]>([]);

  const [suggestions, setSuggestions] = useState([
    { text: "What's my current balance?", icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { text: "Show my schedule for today", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
    { text: "Search for Latest AI Advancement", icon: Search, color: "text-purple-500", bg: "bg-purple-500/10" },
    { text: "Summarize: laconcepcioncollege.com", icon: Globe, color: "text-amber-500", bg: "bg-amber-500/10" }
  ]);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['chat', 'settings'].includes(tab)) {
      setActiveTab(tab as 'chat' | 'settings');
    }
  }, [searchParams]);

  const handleTabChange = (tabId: 'chat' | 'settings') => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await fetch('/api/student/me');
        if (response.ok) {
          const result = await response.json();
          const subjects = result.data?.schedule || [];
          if (subjects.length > 0) {
            const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
            const subjectTitle = randomSubject.description || randomSubject.subject;
            if (subjectTitle) {
              setSuggestions(prev => {
                if (prev.some(s => s.text.startsWith('Resources for'))) return prev;
                return [
                  ...prev.slice(0, 3),
                  { text: `Resources for "${subjectTitle}"`, icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-500/10" }
                ];
              });
            }
          }
        }
      } catch (error) {}
    };
    fetchStudentData();
  }, []);

  const updateSettings = async (newSettings: any) => {
    if (!student) return;
    const updatedStudent = { ...student, settings: newSettings };
    localStorage.setItem('student_data', JSON.stringify(updatedStudent));
    window.dispatchEvent(new Event('local-storage-update'));
    try {
      const res = await fetch('/api/student/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings }),
      });
      if (res.ok) toast.success('Preferences updated');
    } catch (e) { toast.error('Failed to save settings'); }
  };

  const handleStop = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'web_search': return Globe;
      case 'youtube_search': return Youtube;
      case 'execute_math': return Calculator;
      case 'ask_user': return HelpCircle;
      case 'ask_user_choice': return List;
      case 'get_day_schedule': return Calendar;
      case 'get_weekly_schedule': return CalendarDays;
      case 'get_financials': return Wallet;
      default: return Zap;
    }
  };

  const handleSpeak = async (messageId: string, content: string) => {
    if (currentlySpeakingId === messageId && currentAudio) {
      currentAudio.pause();
      setCurrentlySpeakingId(null);
      return;
    }
    if (currentAudio) currentAudio.pause();
    const cleanedText = content.replace(/```[\s\S]*?```/g, '').replace(/[*#~>|]/g, '').trim();
    if (!cleanedText) return;
    try {
      setCurrentlySpeakingId(messageId);
      const voiceModel = student?.settings?.assistant?.voiceModel || 'aura-helios-en';
      const response = await fetch('/api/deepgram', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanedText, model: voiceModel }) 
      });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { setCurrentlySpeakingId(null); URL.revokeObjectURL(url); };
      setCurrentAudio(audio);
      audio.play();
    } catch (err) { setCurrentlySpeakingId(null); }
  };

  const sendMessage = React.useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: content.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
        signal: abortController.signal
      });

      if (!response.ok) throw new Error();
      const reader = response.body?.getReader();
      if (!reader) throw new Error();
      const textDecoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (value) buffer += textDecoder.decode(value, { stream: true });
        
        const statusRegex = /STATUS:(SEARCHING|PROCESSING|FETCHING|FINALIZING|COMPUTING|DESIGNING)\n?/g;
        const showThinking = student?.settings?.assistant?.showThinkingProcess === true;
        
        let match;
        while ((match = statusRegex.exec(buffer)) !== null) {
          const statusVal = match[1];
          if (showThinking) {
            setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, status: statusVal } : msg));
          }
        }
        buffer = buffer.replace(statusRegex, '');

        const toolCallPrefix = "TOOL_CALL:";
        const toolUsedPrefix = "TOOL_USED:";

        while (true) {
          const usedIndex = buffer.indexOf(toolUsedPrefix);
          if (usedIndex === -1) break;
          let endOfUsed = buffer.indexOf('\n', usedIndex);
          if (endOfUsed === -1 && done) endOfUsed = buffer.length;
          if (endOfUsed !== -1) {
            const toolName = buffer.substring(usedIndex + toolUsedPrefix.length, endOfUsed).trim();
            if (toolName && showThinking) {
              setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, tools: Array.from(new Set([...(msg.tools || []), toolName])) } : msg));
            }
            buffer = buffer.substring(0, usedIndex) + buffer.substring(endOfUsed + (done ? 0 : 1));
          } else break;
        }

        // ... inside the while loop before updating message content
        const filterThoughts = (text: string) => showThinking ? text : text.replace(/<(thought|think|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, '');

        while (true) {
          const toolCallIndex = buffer.indexOf(toolCallPrefix);
          if (toolCallIndex === -1) {
            const safeLength = Math.max(0, buffer.length - toolCallPrefix.length);
            const textToAppend = filterThoughts(buffer.substring(0, safeLength));
            if (textToAppend) {
              setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: msg.content + textToAppend } : msg));
              buffer = buffer.substring(safeLength);
            }
            break; 
          }
          const contentBefore = filterThoughts(buffer.substring(0, toolCallIndex));
          if (contentBefore) {
            setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: msg.content + contentBefore } : msg));
          }
          const jsonStart = toolCallIndex + toolCallPrefix.length;
          let endOfToolCall = buffer.indexOf('\n', jsonStart);
          if (endOfToolCall === -1 && done) endOfToolCall = buffer.length;
          if (endOfToolCall !== -1) {
            const toolCallStr = buffer.substring(jsonStart, endOfToolCall).trim();
            if (toolCallStr) {
              try {
                const toolCall = JSON.parse(toolCallStr);
                if (toolCall.name === 'ask_user') {
                  setModalQuestion(toolCall.parameters.question);
                  setModalPlaceholder(toolCall.parameters.placeholder || "Response...");
                  setIsQuestionModalOpen(true);
                } else if (toolCall.name === 'ask_user_choice') {
                  setChoiceQuestion(toolCall.parameters.question);
                  setChoiceOptions(toolCall.parameters.options || []);
                  setIsChoiceModalOpen(true);
                }
              } catch (e) {}
            }
            buffer = buffer.substring(endOfToolCall + (done ? 0 : 1));
          } else { buffer = buffer.substring(toolCallIndex); break; }
        }
        if (done) {
          if (buffer.trim()) {
            const finalContent = showThinking ? buffer : buffer.replace(/<(thought|think|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, '');
            setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: msg.content + finalContent } : msg));
          }
          break;
        }
      }
    } catch (err) {
      if ((err as any).name !== 'AbortError') toast.error("Connection failed.");
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const { scrollHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, messages[messages.length - 1]?.content, isLoading]);

  const tabs = [
    { id: 'chat', name: 'Assistant', icon: MessageSquare, desc: 'AI Study Companion' },
    { id: 'settings', name: 'Settings', icon: Settings, desc: 'AI Preferences' },
  ] as const;

  return (
    <TabbedPageLayout
      title="Assistant"
      icon={BrainCircuit}
      subtitle="AI Powered Workspace"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(id) => handleTabChange(id as 'chat' | 'settings')}
    >
      <div className="flex flex-col h-[calc(100vh-16rem)] lg:h-[calc(100vh-12rem)] w-full max-w-full overflow-hidden">
        {activeTab === 'chat' && (
          <Card className="flex-1 flex flex-col shadow-sm overflow-hidden border-border/50 bg-background/50 w-full max-w-full">
            <ScrollArea ref={scrollContainerRef} className="flex-1 w-full">
              <div className="p-4 md:p-8 flex flex-col min-h-full w-full max-w-full overflow-hidden">
                {messages.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-12 w-full max-w-full">
                    <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center text-primary shadow-sm border border-primary/10">
                      <Bot className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold tracking-tight">How can I help you today?</h2>
                      <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                        I have access to your <span className="text-foreground font-semibold">grades</span>, <span className="text-foreground font-semibold">schedules</span>, and <span className="text-foreground font-semibold">finances</span>.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                      {suggestions.map((s, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => sendMessage(s.text)}
                          className="group flex flex-col items-start p-4 bg-card border hover:border-primary/50 hover:bg-accent/50 rounded-2xl transition-all text-left shadow-sm active:scale-[0.98] w-full"
                        >
                          <div className={cn("p-2 rounded-xl mb-3 transition-transform group-hover:scale-110 shadow-sm border border-border/50", s.bg, s.color)}>
                              <s.icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{s.text}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-8 pb-4 w-full max-w-full flex flex-col overflow-hidden">
                  {messages.map((m, idx) => {
                    const isAssistant = m.role === 'assistant';
                    return (
                      <motion.div 
                        key={m.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("flex w-full min-w-0 max-w-full", isAssistant ? "justify-start" : "justify-end")}
                      >
                        <div className={cn(
                          "flex flex-col gap-1.5 max-w-[90%] sm:max-w-[85%] w-fit overflow-hidden",
                          isAssistant ? "items-start" : "items-end"
                        )}>
                          {/* Action Buttons & Tools */}
                          {isAssistant && (
                            <div className="flex items-center gap-2 px-1 h-6">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-1">
                                  Assistant
                               </span>
                               {m.tools && m.tools.length > 0 && (
                                  <div className="flex gap-1">
                                     {m.tools.map((t, i) => {
                                       const Icon = getToolIcon(t);
                                       return (
                                         <div key={i} className="bg-primary/5 p-1 rounded-md border border-primary/10" title={t}>
                                           <Icon className="h-2.5 w-2.5 text-primary/60" />
                                         </div>
                                       );
                                     })}
                                  </div>
                               )}
                               {!isLoading && m.content && (
                                  <div className="flex gap-0.5">
                                    <SpeakButton messageId={m.id} content={m.content} isSpeaking={currentlySpeakingId === m.id} onSpeak={handleSpeak} />
                                    <CopyButton content={m.content} />
                                  </div>
                                )}
                            </div>
                          )}

                          {/* Content Bubble */}
                          <div className={cn(
                            "rounded-2xl px-4 py-3 shadow-sm border transition-colors w-fit max-w-full overflow-hidden",
                            isAssistant 
                              ? "bg-accent/30 border-border/50 text-foreground rounded-tl-none" 
                              : "bg-primary text-primary-foreground border-primary/20 rounded-tr-none"
                          )}>
                            {isAssistant ? (
                              <div className="space-y-3 min-w-0 w-full max-w-full overflow-hidden">
                                {m.content ? (
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkGfm, remarkMath]} 
                                    rehypePlugins={[rehypeHighlight, rehypeKatex, rehypeRaw]}
                                    className={cn(
                                      "text-sm leading-relaxed min-w-0 w-full max-w-full overflow-hidden",
                                      isLoading && idx === messages.length - 1 && "streaming-active"
                                    )}
                                    components={{
                                      p: ({children}) => <p className="mb-3 last:mb-0 break-words whitespace-pre-wrap">{children}</p>,
                                      table: ({...props}) => (
                                        <div className="overflow-x-auto w-full max-w-full my-3 rounded-lg border bg-background/50 custom-scrollbar block">
                                          <table className="min-w-full text-xs text-left table-auto" {...props} />
                                        </div>
                                      ),
                                      thead: ({...props}) => <thead className="bg-muted text-muted-foreground font-bold uppercase tracking-wider text-[10px]" {...props} />,
                                      th: ({children, ...props}) => <th className="px-3 py-2 border-b whitespace-nowrap font-bold" {...props}>{children}</th>,
                                      td: ({children, ...props}) => <td className="px-3 py-2 border-b" {...props}>{children}</td>,
                                      code: ({className, children, ...props}) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const codeContent = String(children).replace(/\n$/, '');
                                        return match ? (
                                          <div className="relative group my-3 min-w-0 w-full max-w-full overflow-hidden">
                                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1">
                                              <CopyButton content={codeContent} />
                                            </div>
                                            <pre className="bg-slate-950 text-slate-50 rounded-xl p-4 overflow-x-auto text-[11px] font-mono scrollbar-hide w-full max-w-full">
                                              <code className={className} {...props}>{children}</code>
                                            </pre>
                                          </div>
                                        ) : (
                                          <code className="bg-primary/10 text-primary rounded-md px-1.5 py-0.5 font-mono text-[0.9em] font-bold" {...props}>
                                            {children}
                                          </code>
                                        );
                                      },
                                      a: ({...props}) => <a className="text-primary font-bold hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                      ul: ({...props}) => <ul className="list-disc list-outside ml-5 my-3 space-y-1.5" {...props} />,
                                      ol: ({...props}) => <ol className="list-decimal list-outside ml-5 my-3 space-y-1.5" {...props} />,
                                      blockquote: ({...props}) => <blockquote className="border-l-4 border-primary/30 pl-4 py-1 my-3 text-muted-foreground italic bg-primary/5 rounded-r-lg" {...props} />,
                                      h1: ({children}) => <h1 className="text-base font-bold mt-4 mb-2 border-b pb-1">{children}</h1>,
                                      h2: ({children}) => <h2 className="text-sm font-bold mt-3 mb-1">{children}</h2>,
                                    }}
                                  >
                                    {(() => {
                                      const showThinking = student?.settings?.assistant?.showThinkingProcess === true;
                                      if (showThinking) return m.content;
                                      return m.content.replace(/<(thought|think|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, '').trim();
                                    })()}
                                  </ReactMarkdown>
                                ) : (
                                  <TypingIndicator status={m.status} />
                                )}
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap text-sm font-medium break-words overflow-hidden max-w-full">{m.content}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );

                  })}
                </div>
              </div>
            </ScrollArea>

            <ChatInput 
              onSend={sendMessage} 
              onStop={handleStop}
              isLoading={isLoading} 
              onClear={() => { setMessages([]); toast.success("History cleared"); }}
              hasMessages={messages.length > 0}
            />
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card className="flex-1 overflow-y-auto">
            <CardContent className="p-6 md:p-8">
              {student && <AssistantTab student={student} updateSettings={updateSettings} />}
            </CardContent>
          </Card>
        )}

        {/* Input Modal */}
        <Dialog open={isQuestionModalOpen} onOpenChange={setIsQuestionModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assistant Question</DialogTitle>
              <DialogDescription>{modalQuestion}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input 
                  value={modalInput} 
                  onChange={(e) => setModalInput(e.target.value)} 
                  placeholder={modalPlaceholder}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') { setIsQuestionModalOpen(false); sendMessage(modalInput); setModalInput(''); } }}
               />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsQuestionModalOpen(false)}>Cancel</Button>
              <Button onClick={() => { setIsQuestionModalOpen(false); sendMessage(modalInput); setModalInput(''); }}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Choice Modal */}
        <Dialog open={isChoiceModalOpen} onOpenChange={setIsChoiceModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Please Choose</DialogTitle>
              <DialogDescription>{choiceQuestion}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
                {choiceOptions.map((opt, i) => (
                  <Button key={i} variant="outline" className="justify-start h-auto py-3 px-4 font-semibold text-left" onClick={() => { setIsChoiceModalOpen(false); sendMessage(opt); }}>{opt}</Button>
                ))}
             </div>
          </DialogContent>
        </Dialog>
      </div>
    </TabbedPageLayout>
  );
}
