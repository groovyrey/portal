'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  Loader2,
  Sparkles,
  HelpCircle,
  BrainCircuit,
  MessageSquare,
  Globe,
  Copy,
  Check,
  RefreshCcw,
  Zap,
  Info,
  Calendar,
  Wallet,
  Youtube,
  Calculator,
  List,
  FileText,
  CalendarDays,
  Square,
  Maximize2,
  VolumeX,
  Volume2,
  Mic,
  StopCircle,
  Settings
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
import Modal from '@/components/ui/Modal';
import { useStudent } from '@/lib/hooks';
import AssistantTab from '@/components/settings/AssistantTab';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tools?: string[];
  status?: string;
  inlineHtml?: {
    html: string;
    title?: string;
    fullScreen?: boolean;
  };
};

const TypingIndicator = ({ status }: { status?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    className="px-5 py-4 surface-neutral rounded-xl border border-border/50 w-fit flex items-center gap-4 shadow-sm ring-1 ring-black/5"
  >
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
        key={i}
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        className="h-1.5 w-1.5 rounded-full bg-primary"
        />
        ))}
        </div>
        <span className="text-[10px] font-black text-muted-foreground animate-pulse uppercase tracking-widest leading-none">
          {status ? `System ${status.toLowerCase()}...` : "System Thinking..."}
        </span>
        </motion.div>
        );

        const CopyButton = ({ content, className = "" }: { content: string, className?: string }) => {
        const [copied, setCopied] = useState(false);

        const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        } catch (err) {
        console.error('Failed to copy text: ', err);
        }
        };

        return (
        <button
        onClick={handleCopy}
        className={`p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border/50 shadow-sm active:scale-90 ${className}`}
        title="Copy to clipboard"
        >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        );
        };

        const SpeakButton = ({ messageId, content, isSpeaking, onSpeak, className = "" }: { messageId: string, content: string, isSpeaking: boolean, onSpeak: (id: string, content: string) => void, className?: string }) => {
        return (
          <button
            onClick={(e) => { e.stopPropagation(); onSpeak(messageId, content); }}
            className={`p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border/50 shadow-sm active:scale-90 ${className}`}
            title={isSpeaking ? "Stop speaking" : "Read aloud"}
          >
            {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-primary animate-pulse" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
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
      toast.error("Protocol Error: Audio capture requires secure environment.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        const toastId = toast.loading("Processing neural signals...");

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob);
          formData.append('language', 'en'); 

          const response = await fetch('/api/deepgram', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('Transcription failed');

          const data = await response.json();
          if (data.transcript) {
            setInput((prev) => prev ? `${prev} ${data.transcript}` : data.transcript);
            toast.success("Signal Processed", { id: toastId });
          } else {
            toast.info("No audio detected", { id: toastId });
          }
        } catch (error) {
          console.error("Transcription error:", error);
          toast.error("Failed to decode audio", { id: toastId });
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      toast.error("Neural Interface Denied: Check permissions.");
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
    if (isLoading) {
      onStop();
      return;
    }
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="p-4 bg-background/80 backdrop-blur-lg border-t border-border/50">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className={`relative flex items-center bg-card border border-border/50 focus-within:border-primary/40 focus-within:bg-card rounded-lg transition-all shadow-sm overflow-hidden ${isRecording ? 'ring-2 ring-red-500/30 border-red-500/30' : ''}`}>
            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="pl-4 pr-2 flex items-center gap-3 text-red-500 animate-pulse hover:text-red-600 transition-colors"
                title="Stop Recording"
              >
                <StopCircle className="h-5 w-5 fill-current" />
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap hidden sm:block">Listening...</span>
              </button>
            ) : (
              <div className="flex items-center pl-2">
                <button
                  type="button"
                  onClick={onClear}
                  disabled={!hasMessages || isLoading}
                  className="p-2.5 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30"
                  title="Clear Buffer"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isLoading || isTranscribing}
                  className="p-2.5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
                  title="Neural Input"
                >
                  <Mic className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
            
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading || isTranscribing}
                maxLength={2000}
                placeholder={
                  isRecording ? "Neural signal detected..." : 
                  isTranscribing ? "Decoding stream..." : 
                  isLoading ? "Aegis is processing..." : "Initialize query..."
                }
                className="w-full bg-transparent px-4 py-4 text-[13px] font-black uppercase tracking-tight transition-all outline-none disabled:opacity-60 text-foreground placeholder:text-muted-foreground/30"
            />
            {input.length > 0 && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2">
                <span className={`text-[8px] font-black uppercase tracking-widest ${input.length >= 1900 ? 'text-red-500' : 'text-muted-foreground/20'}`}>
                  {input.length}/2K
                </span>
              </div>
            )}
            <div className="pr-2">
                <button 
                    type="submit"
                    disabled={(!input?.trim() && !isLoading) || isTranscribing}
                    className={`${isLoading ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-foreground text-background shadow-black/10'} p-2.5 rounded-lg hover:opacity-90 transition-all shadow-lg active:scale-95 flex items-center justify-center`}
                    title={isLoading ? "Abort generation" : "Transmit"}
                >
                    {isLoading ? <Square className="h-4.5 w-4.5 fill-current" /> : <Send className="h-4.5 w-4.5" />}
                </button>
            </div>
        </div>
        <div className="flex flex-col items-center gap-1 mt-3">
          <p className="text-[8px] text-center text-muted-foreground font-black uppercase tracking-widest leading-none opacity-40">
            Aegis Intelligence: Data may require manual verification
          </p>
        </div>
      </form>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default function AssistantPage() {
  const { student } = useStudent();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastAssistantMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoading && lastAssistantMessageIdRef.current && student?.settings?.assistant?.autoSpeak) {
      const lastId = lastAssistantMessageIdRef.current;
      const lastMsg = messages.find(m => m.id === lastId);
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content) {
        handleSpeak(lastId, lastMsg.content);
      }
      lastAssistantMessageIdRef.current = null;
    }
  }, [isLoading, messages, student?.settings?.assistant?.autoSpeak]);

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
      if (!res.ok) throw new Error();
      toast.success('Protocol Adjusted');
    } catch {
      toast.error('Sync failed');
    }
  };

  const handleStop = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      toast.info('Transmission Terminated');
    }
  }, []);

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'web_search': return Globe;
      case 'web_fetch': return FileText;
      case 'youtube_search': return Youtube;
      case 'execute_math': return Calculator;
      case 'ask_user': return HelpCircle;
      case 'ask_user_choice': return List;
      case 'get_day_schedule': return Calendar;
      case 'get_weekly_schedule': return CalendarDays;
      case 'get_grades': return Check;
      case 'get_financials': return Wallet;
      case 'get_full_student_data': return BrainCircuit;
      case 'render_html': return Sparkles;
      default: return Zap;
    }
  };

  const [suggestions, setSuggestions] = useState([
    { text: "Check today's schedule", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
    { text: "Financial status report", icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { text: "Explain campus policies", icon: Info, color: "text-amber-500", bg: "bg-amber-500/10" }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalQuestion, setModalQuestion] = useState('');
  const [modalPlaceholder, setModalPlaceholder] = useState('');
  const [modalInput, setModalInput] = useState('');

  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [choiceQuestion, setChoiceQuestion] = useState('');
  const [choiceOptions, setChoiceOptions] = useState<string[]>([]);

  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [htmlModalContent, setHtmlModalContent] = useState('');
  const [htmlModalTitle, setHtmlModalTitle] = useState('');
  const [htmlModalFullScreen, setHtmlModalFullScreen] = useState(false);

  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const cleanTextForTTS = (text: string) => {
    let cleaned = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/!\[[^\]]*\]\([^\)]+\)/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '');

    cleaned = cleaned
      .replace(/\$\$([\s\S]+?)\$\$/g, ' $1 ')
      .replace(/\$([\s\S]+?)\$/g, ' $1 ')
      .replace(/\\\[([\s\S]+?)\\\]/g, ' $1 ')
      .replace(/\\\(([\s\S]+?)\\\)/g, ' $1 ')
      .replace(/\\frac\{(.+?)\}\{(.+?)\}/g, '$1 over $2')
      .replace(/\\sqrt\{(.+?)\}/g, 'square root of $1')
      .replace(/\\times/g, ' times ')
      .replace(/\\div/g, ' divided by ')
      .replace(/\\pm/g, ' plus or minus ')
      .replace(/\\cdot/g, ' times ')
      .replace(/\\approx/g, ' approximately ')
      .replace(/\\ne/g, ' not equal to ')
      .replace(/\\le/g, ' less than or equal to ')
      .replace(/\\ge/g, ' greater than or equal to ')
      .replace(/\\infty/g, ' infinity ')
      .replace(/\\pi/g, ' pi ')
      .replace(/\\sum/g, ' the sum of ')
      .replace(/\\int/g, ' the integral of ')
      .replace(/\\text\{(.+?)\}/g, ' $1 ')
      .replace(/\\([a-zA-Z]+)/g, ' ')
      .replace(/[\{\}]/g, ' ');

    cleaned = cleaned
      .replace(/ \+ /g, ' plus ')
      .replace(/ - /g, ' minus ')
      .replace(/ \* /g, ' times ')
      .replace(/ \/ /g, ' divided by ')
      .replace(/ = /g, ' equals ')
      .replace(/\^(\d+)/g, ' to the power of $1')
      .replace(/\^\{(.+?)\}/g, ' to the power of $1');

    cleaned = cleaned
      .replace(/₱/g, ' Pesos ')
      .replace(/[*#~>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned;
  };

  const handleSpeak = async (messageId: string, content: string) => {
    if (currentlySpeakingId === messageId && currentAudio) {
      currentAudio.pause();
      setCurrentlySpeakingId(null);
      return;
    }
    if (currentAudio) currentAudio.pause();

    const cleanedText = cleanTextForTTS(content);
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
    } catch (err) {
      setCurrentlySpeakingId(null);
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getIframeSrcDoc = (content: string) => {
    const libraries = `
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/lucide@latest"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
    `;

    const lucideInit = `
      <script>
        const initLucide = () => { if (typeof lucide !== 'undefined') lucide.createIcons(); };
        document.addEventListener('DOMContentLoaded', initLucide);
        setTimeout(initLucide, 500);
        setTimeout(initLucide, 2000);
      </script>
    `;

    if (content.trim().toLowerCase().includes('<!doctype html>') || content.trim().toLowerCase().includes('<html')) {
      let finalContent = content;
      if (!content.includes('tailwind')) finalContent = finalContent.replace('</head>', `${libraries}</head>`);
      if (!content.includes('lucide.createIcons')) finalContent = finalContent.replace('</body>', `${lucideInit}</body>`);
      return finalContent;
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${libraries}
          <style>
            body { 
              font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
              margin: 0; padding: 0; background: white; overflow-x: hidden; color: #0f172a;
            }
            #app-root { min-height: 100vh; }
            ::-webkit-scrollbar { width: 5px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; }
          </style>
        </head>
        <body class="bg-white text-slate-800">
          <div id="app-root">${content}</div>
          ${lucideInit}
        </body>
      </html>
    `;
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
              setSuggestions(prev => [
                { text: `Material for "${subjectTitle}"`, icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                ...prev
              ]);
            }
          }
        }
      } catch (error) {}
    };
    fetchStudentData();
  }, []);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  const sendMessage = React.useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: content.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    lastAssistantMessageIdRef.current = assistantMessageId;
    const temporaryAssistantMessage: Message = { id: assistantMessageId, role: 'assistant', content: '' };
    setMessages((prev) => [...prev, temporaryAssistantMessage]);

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

      if (!response.ok) throw new Error(await response.text() || 'Failed to get a response');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');
      const textDecoder = new TextDecoder();
      let buffer = "";
      const activeAssistantMessageId = assistantMessageId;

      while (true) {
        const { done, value } = await reader.read();
        if (value) { buffer += textDecoder.decode(value, { stream: true }); }
        
        const statusRegex = /STATUS:(SEARCHING|PROCESSING|FETCHING|FINALIZING|COMPUTING|DESIGNING)\n?/g;
        const showThinking = student?.settings?.assistant?.showThinkingProcess !== false;
        
        let match;
        while ((match = statusRegex.exec(buffer)) !== null) {
          if (showThinking) {
            setMessages((prev) => prev.map((msg) => 
              msg.id === activeAssistantMessageId ? { ...msg, status: match![1] } : msg
            ));
          }
        }
        if (statusRegex.test(buffer)) buffer = buffer.replace(statusRegex, '');

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
              setMessages((prev) => prev.map((msg) => 
                msg.id === activeAssistantMessageId 
                  ? { ...msg, tools: Array.from(new Set([...(msg.tools || []), toolName])) } 
                  : msg
              ));
            }
            buffer = buffer.substring(0, usedIndex) + buffer.substring(endOfUsed + (done ? 0 : 1));
          } else break;
        }

        while (true) {
          const toolCallIndex = buffer.indexOf(toolCallPrefix);
          if (toolCallIndex === -1) {
            const safeLength = Math.max(0, buffer.length - toolCallPrefix.length);
            const textToAppend = buffer.substring(0, safeLength);
            if (textToAppend) {
              setMessages((prev) => prev.map((msg) => 
                msg.id === activeAssistantMessageId ? { ...msg, content: msg.content + textToAppend } : msg
              ));
              buffer = buffer.substring(safeLength);
            }
            break; 
          }

          const contentBefore = buffer.substring(0, toolCallIndex);
          if (contentBefore) {
            setMessages((prev) => prev.map((msg) => 
              msg.id === activeAssistantMessageId ? { ...msg, content: msg.content + contentBefore } : msg
            ));
          }
          
          const jsonStart = toolCallIndex + toolCallPrefix.length;
          let endOfToolCall = buffer.indexOf('\n', jsonStart);
          if (endOfToolCall === -1 && done) endOfToolCall = buffer.length;

          if (endOfToolCall !== -1) {
            const toolCallStr = buffer.substring(jsonStart, endOfToolCall).trim();
            if (toolCallStr) {
              try {
                const toolCall = JSON.parse(toolCallStr);
                if (toolCall.name === 'ask_user' && toolCall.parameters) {
                  const { question, placeholder } = toolCall.parameters;
                  setModalQuestion(question);
                  setModalPlaceholder(placeholder || "Initialize response...");
                  setIsModalOpen(true);
                } else if (toolCall.name === 'ask_user_choice' && toolCall.parameters) {
                  const { question, options } = toolCall.parameters;
                  setChoiceQuestion(question);
                  setChoiceOptions(options || []);
                  setIsChoiceModalOpen(true);
                } else if (toolCall.name === 'render_html' && toolCall.parameters) {
                  const { html, title, fullScreen } = toolCall.parameters;
                  setMessages((prev) => prev.map((msg) => 
                    msg.id === activeAssistantMessageId 
                      ? { ...msg, inlineHtml: { html, title, fullScreen } } 
                      : msg
                  ));
                }
              } catch (e) {}
            }
            buffer = buffer.substring(endOfToolCall + (done ? 0 : 1));
          } else { buffer = buffer.substring(toolCallIndex); break; }
        }

        if (done) {
          if (buffer.trim()) {
             setMessages((prev) => prev.map((msg) => 
               msg.id === activeAssistantMessageId ? { ...msg, content: msg.content + buffer } : msg
             ));
          }
          break;
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const friendlyError = "Interface Connectivity Issue.";
      toast.error(friendlyError);
      setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: `⚠️ SYSTEM ERROR: ${friendlyError}` } : msg));
    } finally {
      setMessages(prev => prev.filter(msg => 
        (msg.content && msg.content.trim() !== '') || msg.role !== 'assistant' || (msg.inlineHtml && msg.inlineHtml.html)
      ));
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, student]);

  const handleClear = React.useCallback(() => {
    if (messages.length === 0) return;
    setMessages([]);
    toast.success('Buffer Purged');
  }, [messages.length]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-8 flex flex-col h-[calc(100dvh-140px)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-lg text-primary-foreground border border-primary/20 shadow-lg shadow-primary/10">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground uppercase tracking-tight leading-none">Aegis Assistant</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">Intelligence Interface</p>
          </div>
        </div>
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="p-3 bg-muted/50 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all border border-border/50 shadow-sm active:scale-95"
          title="Neural Preferences"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-card rounded-xl border border-border/50 shadow-2xl shadow-black/5 overflow-hidden flex flex-col relative ring-1 ring-black/5">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 md:p-8 scroll-smooth custom-scrollbar">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-10 px-4">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150" />
                <div className="relative bg-foreground p-5 rounded-xl text-background shadow-2xl">
                    <Bot className="h-10 w-10" />
                </div>
              </div>
              
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full text-[9px] font-black tracking-widest uppercase mb-6 text-primary">
                <Sparkles className="h-3 w-3 animate-pulse" />
                Aegis Protocol Active
              </div>

              <h2 className="text-3xl font-black text-foreground mb-4 uppercase tracking-tight">Greeting, {student?.parsedName?.firstName || 'LCCian'}</h2>
              <p className="text-[11px] text-muted-foreground mb-12 uppercase tracking-widest font-black leading-relaxed max-w-sm">
                I am your integrated academic companion. Initializing access to <span className="text-foreground">records</span> and <span className="text-foreground">registries</span>.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    onClick={() => sendMessage(s.text)}
                    className="group flex items-center gap-4 p-4 surface-neutral border border-border/50 hover:border-primary/40 rounded-xl transition-all text-left relative active:scale-[0.98] ring-1 ring-black/5"
                  >
                    <div className={`${s.bg} ${s.color} p-2.5 rounded-lg shrink-0`}>
                        <s.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black text-foreground uppercase tracking-widest leading-tight">{s.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false} mode="popLayout">
            {messages.map((m, idx) => {
              const isContinuation = idx > 0 && messages[idx - 1].role === m.role;
              return (
                <motion.div 
                  key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'} ${isContinuation ? 'mt-1' : 'mt-8'}`}
                >
                  <div className={`flex gap-4 ${m.role === 'user' ? 'max-w-[90%] sm:max-w-[75%]' : 'flex-col w-full'}`}>
                    {m.role !== 'user' && !isContinuation && (
                      <div className="w-full flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-foreground text-background flex items-center justify-center border border-white/10 shadow-lg">
                            <BrainCircuit className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Aegis Intelligence</span>
                            {isLoading && idx === messages.length - 1 && <div className="h-1 w-12 bg-primary/20 rounded-full mt-1 overflow-hidden"><div className="h-full bg-primary animate-progress-indeterminate" /></div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {m.tools && m.tools.length > 0 && (
                            <div className="flex -space-x-1 mr-2">
                              {m.tools.map((tool, i) => {
                                const ToolIcon = getToolIcon(tool);
                                return (
                                  <div key={i} className="h-5 w-5 rounded-full bg-muted border border-border/50 flex items-center justify-center text-primary shadow-sm" title={tool.replace(/_/g, ' ')}>
                                    <ToolIcon className="h-2.5 w-2.5" />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {m.content && !isLoading && (
                            <div className="flex items-center gap-1.5">
                              <SpeakButton messageId={m.id} content={m.content} isSpeaking={currentlySpeakingId === m.id} onSpeak={handleSpeak} />
                              <CopyButton content={m.content} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className={`${
                      m.role === 'user' 
                        ? 'p-4 rounded-xl rounded-tr-none bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/10 text-sm' 
                        : 'w-full'
                    }`}>
                      {m.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        (m.content || m.inlineHtml) ? (
                          <div className={`surface-neutral p-6 md:p-8 border border-border/50 shadow-sm ring-1 ring-black/5 ${
                            isContinuation ? 'rounded-xl' : 'rounded-xl rounded-tl-none'
                          }`}>
                            {m.content && (
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkMath]} 
                                rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
                                className={`prose prose-slate dark:prose-invert max-w-full leading-relaxed text-muted-foreground font-medium text-sm break-words ${
                                  isLoading && idx === messages.length - 1 ? 'streaming-active' : ''
                                }`}
                                components={{
                                  p: ({children}) => <p className="mb-6 last:mb-0 leading-relaxed text-sm/7">{children}</p>,
                                  table: ({...props}) => <div className="overflow-x-auto my-8 rounded-lg border border-border/50 bg-card/30"><table className="w-full text-[11px] text-left" {...props} /></div>,
                                  thead: ({...props}) => <thead className="bg-muted text-foreground font-black uppercase tracking-widest text-[9px]" {...props} />,
                                  th: ({...props}) => <th className="px-4 py-3" {...props} />,
                                  td: ({...props}) => <td className="px-4 py-3 border-t border-border/40 font-bold" {...props} />,
                                  code: ({className, children, ...props}) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return match ? (
                                      <div className="relative group my-8">
                                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                                          <div className="px-2 py-1 bg-muted rounded text-[8px] font-black uppercase tracking-widest text-muted-foreground border border-border/50">
                                            {match[1]}
                                          </div>
                                          <CopyButton content={String(children).replace(/\n$/, '')} />
                                        </div>
                                        <pre className="bg-muted/30 text-foreground rounded-lg p-6 overflow-x-auto text-[11px] font-mono border border-border/50 shadow-inner">
                                          <code className={className} {...props}>{children}</code>
                                        </pre>
                                      </div>
                                    ) : (
                                      <code className="bg-primary/5 text-primary rounded px-1.5 py-0.5 font-mono text-[0.85em] font-black border border-primary/10" {...props}>{children}</code>
                                    );
                                  },
                                  h1: ({children}) => <h1 className="text-xl font-black text-foreground mt-12 mb-6 pb-2 border-b-2 border-primary/10 uppercase tracking-tight">{children}</h1>,
                                  h2: ({children}) => <h2 className="text-lg font-black text-foreground mt-10 mb-5 uppercase tracking-tight">{children}</h2>,
                                  blockquote: ({...props}) => <blockquote className="border-l-4 border-primary/30 pl-6 py-4 my-8 text-muted-foreground italic bg-muted/20 rounded-r-lg font-bold" {...props} />,
                                }}
                              >
                                {(() => {
                                  const content = m.content.trim();
                                  const match = content.match(/^```(?:markdown|text|txt)?\s*([\s\S]*?)\s*```$/i);
                                  return match ? match[1] : m.content;
                                })()}
                              </ReactMarkdown>
                            )}

                            {m.inlineHtml && (
                              <div className={`${m.content ? 'mt-8' : ''} h-[550px] relative border border-border/50 rounded-lg overflow-hidden bg-background/50 ring-1 ring-black/5`}>
                                <div className="absolute top-4 right-4 z-20">
                                  <button onClick={() => { setHtmlModalContent(m.inlineHtml!.html); setHtmlModalTitle(m.inlineHtml!.title || 'System Visualization'); setHtmlModalFullScreen(!!m.inlineHtml!.fullScreen); setIsHtmlModalOpen(true); }} className="flex items-center gap-2.5 px-4 py-2.5 bg-foreground text-background rounded-lg shadow-2xl active:scale-95 transition-all text-[9px] font-black uppercase tracking-widest">
                                    <Maximize2 size={12} /> Expand Interface
                                  </button>
                                </div>
                                <iframe srcDoc={getIframeSrcDoc(m.inlineHtml.html)} className="w-full h-full border-none" title="Visualization" sandbox="allow-scripts allow-modals allow-popups allow-forms" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <TypingIndicator status={m.status} />
                        )
                      )}
                    </div>
                </div>
              </motion.div>
            );
            })}
          </AnimatePresence>
        </div>

        <ChatInput onSend={sendMessage} onStop={handleStop} isLoading={isLoading} onClear={handleClear} hasMessages={messages.length > 0} />
      </div>

      {/* Modals */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="max-w-md" title={<div className="flex items-center gap-3"><div className="bg-primary/10 p-2.5 rounded-lg text-primary"><HelpCircle size={22} /></div><h3 className="text-sm font-black text-foreground uppercase tracking-tight">System Request</h3></div>}>
        <div className="p-8">
          <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest mb-8 leading-relaxed">{modalQuestion}</p>
          <form onSubmit={(e) => { e.preventDefault(); if (modalInput.trim()) { setIsModalOpen(false); sendMessage(modalInput.trim()); } }}>
            <input autoFocus type="text" value={modalInput} onChange={(e) => setModalInput(e.target.value)} maxLength={500} placeholder={modalPlaceholder} className="w-full bg-muted/30 border border-border/50 focus:border-primary/50 rounded-lg px-4 py-4 text-xs font-black uppercase tracking-tight outline-none transition-all mb-6" />
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Abort</button>
              <button type="submit" disabled={!modalInput.trim()} className="flex-1 py-3.5 bg-foreground text-background hover:opacity-90 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-black/10">Submit</button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isChoiceModalOpen} onClose={() => setIsChoiceModalOpen(false)} maxWidth="max-w-md" title={<div className="flex items-center gap-3"><div className="bg-primary/10 p-2.5 rounded-lg text-primary"><Zap size={22} /></div><h3 className="text-sm font-black text-foreground uppercase tracking-tight">Option Select</h3></div>}>
        <div className="p-8">
          <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest mb-8 leading-relaxed">{choiceQuestion}</p>
          <div className="flex flex-col gap-2 mb-8">{choiceOptions.map((opt, i) => (
            <button key={i} onClick={() => { setIsChoiceModalOpen(false); sendMessage(opt); }} className="w-full text-left p-4 surface-neutral border border-border/50 hover:border-primary/40 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest text-foreground active:scale-[0.98] ring-1 ring-black/5">{opt}</button>
          ))}</div>
          <button onClick={() => setIsChoiceModalOpen(false)} className="w-full py-3.5 bg-muted text-muted-foreground rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Abort</button>
        </div>
      </Modal>

      <Modal isOpen={isHtmlModalOpen} onClose={() => setIsHtmlModalOpen(false)} title={<span className="uppercase tracking-widest font-black text-sm">{htmlModalTitle}</span>} maxWidth={htmlModalFullScreen ? "max-w-[95vw]" : "max-w-5xl"} className={htmlModalFullScreen ? "h-[92vh] flex flex-col" : ""}>
        <div className={`w-full bg-white overflow-hidden relative ${htmlModalFullScreen ? "flex-1" : "h-[75vh]"}`}>
          <iframe srcDoc={getIframeSrcDoc(htmlModalContent)} className="w-full h-full border-none" title="Visualization" sandbox="allow-scripts allow-modals allow-popups allow-forms" />
        </div>
        <div className="flex justify-end p-5 border-t border-border/50 bg-card">
          <button onClick={() => setIsHtmlModalOpen(false)} className="px-8 py-3 bg-foreground text-background rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Close Interface</button>
        </div>
      </Modal>

      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} maxWidth="max-w-2xl" title={<div className="flex items-center gap-3"><div className="bg-primary/10 p-2.5 rounded-lg text-primary"><Settings size={22} /></div><h3 className="text-sm font-black text-foreground uppercase tracking-tight">Aegis Preferences</h3></div>}>
        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">{student && <AssistantTab student={student} updateSettings={updateSettings} />}</div>
      </Modal>
    </div>
  );
}
