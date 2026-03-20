'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  Loader2,
  Sparkles,
  User,
  BrainCircuit,
  HelpCircle,
  MessageSquare,
  ArrowLeft,
  Globe,
  Search,
  Copy,
  Check,
  RefreshCcw,
  Zap,
  Info,
  Calendar,
  Wallet,
  Youtube,
  Calculator,
  Bell,
  List,
  FileText,
  CalendarDays,
  Square,
  Maximize2,
  VolumeX,
  Volume2,
  Mic,
  StopCircle
  } from 'lucide-react';import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import Link from 'next/link';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import { Avatar, AvatarGroup, Tooltip } from '@mui/material';
import { useStudent } from '@/lib/hooks';
import AssistantTab from '@/components/settings/AssistantTab';
import { Settings } from 'lucide-react';

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

// Modern Typing Indicator Component
const TypingIndicator = ({ status }: { status?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    className="px-4 py-3 bg-accent/50 rounded-xl border border-border w-fit flex items-center gap-3"
  >
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
        key={i}
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        className="h-1.5 w-1.5 rounded-full bg-primary"
        />
        ))}
        </div>
        <span className="text-[10px] font-bold text-muted-foreground animate-pulse uppercase tracking-tight leading-none">
          {status ? `Assistant is ${status.toLowerCase()}` : "Assistant is thinking"}
        </span>
        </motion.div>
        );

        // Copy Button Component
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
        className={`p-1.5 rounded-lg bg-accent/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-all border border-border/50 shadow-sm active:scale-90 ${className}`}
        title="Copy to clipboard"
        >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        );
        };

        // Speak Button Component
        const SpeakButton = ({ messageId, content, isSpeaking, onSpeak, className = "" }: { messageId: string, content: string, isSpeaking: boolean, onSpeak: (id: string, content: string) => void, className?: string }) => {
        return (
          <button
            onClick={(e) => { e.stopPropagation(); onSpeak(messageId, content); }}
            className={`p-1.5 rounded-lg bg-accent/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-all border border-border/50 shadow-sm active:scale-90 ${className}`}
            title={isSpeaking ? "Stop speaking" : "Read aloud"}
          >
            {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-primary animate-pulse" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        );
        };
// Sub-component for the input area to prevent full page re-renders on every keystroke
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
      toast.error("Voice input is only available in secure contexts (HTTPS or localhost).");
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
        const toastId = toast.loading("Processing speech...");

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
            toast.success("Speech processed", { id: toastId });
          } else {
            toast.info("No speech detected", { id: toastId });
          }
        } catch (error) {
          console.error("Transcription error:", error);
          toast.error("Failed to transcribe audio", { id: toastId });
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      toast.error("Microphone access denied. Please check permissions.");
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
    <div className="p-4 bg-card border-t border-border">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className={`relative flex items-center bg-accent border border-border focus-within:border-primary/50 focus-within:bg-card rounded-xl transition-all shadow-sm overflow-hidden ${isRecording ? 'ring-2 ring-red-500/50 border-red-500/50' : ''}`}>
            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="pl-3 pr-2 flex items-center gap-2 text-red-500 animate-pulse hover:text-red-600 transition-colors"
                title="Stop Recording"
              >
                <StopCircle className="h-5 w-5 fill-current" />
                <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap hidden sm:block">Recording...</span>
              </button>
            ) : (
              <div className="flex items-center pl-1">
                <button
                  type="button"
                  onClick={onClear}
                  disabled={!hasMessages || isLoading}
                  className="p-2 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30"
                  title="Clear Chat"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isLoading || isTranscribing}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
                  title="Speak to Assistant"
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>
            )}
            
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading || isTranscribing}
                placeholder={
                  isRecording ? "Listening..." : 
                  isTranscribing ? "Transcribing speech..." : 
                  isLoading ? "Assistant is responding..." : "Ask a question..."
                }
                className="w-full bg-transparent px-3 py-3 text-sm font-medium transition-all outline-none disabled:opacity-60 text-foreground"
            />
            <div className="pr-1.5">
                <button 
                    type="submit"
                    disabled={(!input?.trim() && !isLoading) || isTranscribing}
                    className={`${isLoading ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'} p-2 rounded-lg hover:opacity-90 transition-all shadow-sm active:scale-90 flex items-center justify-center`}
                    title={isLoading ? "Stop generating" : "Send message"}
                >
                    {isLoading ? <Square className="h-4 w-4 fill-current" /> : <Send className="h-4 w-4" />}
                </button>
            </div>
        </div>
        <div className="flex flex-col items-center gap-1 mt-2.5">
          <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-tight leading-none">
            AI may produce inaccurate information
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

  // Auto-speak effect
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
    
    // Optimistic update
    const updatedStudent = { ...student, settings: newSettings };
    localStorage.setItem('student_data', JSON.stringify(updatedStudent));
    window.dispatchEvent(new Event('local-storage-update'));

    try {
      console.log("[Assistant] Saving settings:", newSettings);
      const res = await fetch('/api/student/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings }),
      });
      
      if (!res.ok) throw new Error('Failed to update settings');
      toast.success('Preferences updated');
    } catch (e) {
      console.error("[Assistant] Settings update error:", e);
      toast.error('Failed to save preferences');
    }
  };

  const handleStop = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      toast.info('Response stopped');
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
      case 'get_today_schedule':
      case 'get_day_schedule': return Calendar;
      case 'get_weekly_schedule': return CalendarDays;
      default: return Zap;
    }
  };

  const [suggestions, setSuggestions] = useState([
    { text: "What's my current balance?", icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
    { text: "Show my schedule for today", icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
    { text: "Summarize: laconcepcioncollege.com", icon: Globe, color: "text-primary", bg: "bg-primary/10" }
  ]);

  // Modal state for ask_user tool
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalQuestion, setModalQuestion] = useState('');
  const [modalPlaceholder, setModalPlaceholder] = useState('');
  const [modalInput, setModalInput] = useState('');

  // Choice modal state for ask_user_choice tool
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [choiceQuestion, setChoiceQuestion] = useState('');
  const [choiceOptions, setChoiceOptions] = useState<string[]>([]);

  // HTML modal state for render_html tool
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [htmlModalContent, setHtmlModalContent] = useState('');
  const [htmlModalTitle, setHtmlModalTitle] = useState('');
  const [htmlModalFullScreen, setHtmlModalFullScreen] = useState(false);

  // TTS State
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const cleanTextForTTS = (text: string) => {
    return text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]*`/g, '')       // Remove inline code
      .replace(/!\[[^\]]*\]\([^\)]+\)/g, '') // Remove images
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Keep link text, remove URL
      .replace(/https?:\/\/\S+/g, '') // Remove standalone URLs
      .replace(/₱/g, ' Pesos ')       // Replace Peso sign with word
      .replace(/[*#~>|]/g, '')      // Remove markdown special characters
      .replace(/\s+/g, ' ')          // Normalize whitespace
      .trim();
  };

  const handleSpeak = async (messageId: string, content: string) => {
    if (currentlySpeakingId === messageId && currentAudio) {
      currentAudio.pause();
      setCurrentlySpeakingId(null);
      return;
    }

    // Stop any current audio
    if (currentAudio) {
      currentAudio.pause();
    }

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

      if (!response.ok) throw new Error('TTS failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onended = () => {
        setCurrentlySpeakingId(null);
        URL.revokeObjectURL(url);
      };

      setCurrentAudio(audio);
      audio.play();
    } catch (err) {
      console.error('Failed to speak text: ', err);
      setCurrentlySpeakingId(null);
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Helper to generate the isolated iframe content
  const getIframeSrcDoc = (content: string) => {
    const isDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;
    
    const libraries = `
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/lucide@latest"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    `;

    const lucideInit = `
      <script>
        const initLucide = () => {
          if (typeof lucide !== 'undefined') lucide.createIcons();
        };
        document.addEventListener('DOMContentLoaded', initLucide);
        setTimeout(initLucide, 500);
        setTimeout(initLucide, 2000);
      </script>
    `;

    // Check if content already contains a full HTML structure
    if (content.trim().toLowerCase().includes('<!doctype html>') || content.trim().toLowerCase().includes('<html')) {
      let finalContent = content;
      if (isDark && !content.includes('class="dark"') && !content.includes("class='dark'")) {
        finalContent = content.replace('<html', '<html class="dark"');
      }
      
      // Inject libraries and init if they seem to be missing
      if (!content.includes('tailwind')) finalContent = finalContent.replace('</head>', `${libraries}</head>`);
      if (!content.includes('lucide.createIcons')) finalContent = finalContent.replace('</body>', `${lucideInit}</body>`);
      
      return finalContent;
    }

    return `
      <!DOCTYPE html>
      <html class="${isDark ? 'dark' : ''}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${libraries}
          <script>
            tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  colors: {
                    background: '${isDark ? '#020617' : '#f4f8ff'}',
                    foreground: '${isDark ? '#f8faff' : '#020817'}',
                    card: '${isDark ? '#050b1d' : '#ffffff'}',
                    'card-foreground': '${isDark ? '#f8faff' : '#020817'}',
                    primary: '${isDark ? '#3b82f6' : '#2563eb'}',
                    'primary-foreground': '#ffffff',
                    secondary: '${isDark ? '#0f172a' : '#e0ebff'}',
                    'secondary-foreground': '${isDark ? '#f1f5f9' : '#1e40af'}',
                    muted: '${isDark ? '#070d1f' : '#f0f5ff'}',
                    'muted-foreground': '${isDark ? '#94a3b8' : '#64748b'}',
                    accent: '${isDark ? '#0f172a' : '#eef4ff'}',
                    'accent-foreground': '${isDark ? '#f1f5f9' : '#1e40af'}',
                    border: '${isDark ? '#141e33' : '#e2eaff'}',
                  }
                }
              }
            }
          </script>
          <style>
            body { 
              font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 0;
              background: transparent;
              overflow-x: hidden;
              color: ${isDark ? '#f1f5f9' : '#0f172a'};
            }
            #app-root { min-height: 100vh; }
            ::-webkit-scrollbar { width: 5px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: ${isDark ? '#1e293b' : '#cbd5e1'}; border-radius: 5px; }
          </style>
        </head>
        <body class="${isDark ? 'bg-transparent text-slate-200' : 'bg-transparent text-slate-800'}">
          <div id="app-root">
            ${content}
          </div>
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
                { text: `Resources for "${subjectTitle}"`, icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                ...prev
              ]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch student data for suggestions:', error);
      }
    };
    fetchStudentData();
  }, []);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = React.useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    lastAssistantMessageIdRef.current = assistantMessageId;
    const temporaryAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, temporaryAssistantMessage]);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
        signal: abortController.signal
      });

      if (!response.ok) throw new Error(await response.text() || 'Failed to get a response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const textDecoder = new TextDecoder();
      let buffer = "";
      let activeAssistantMessageId = assistantMessageId;

      while (true) {
        const { done, value } = await reader.read();
        if (value) {
          const chunk = textDecoder.decode(value, { stream: true });
          buffer += chunk;
        }
        
        // Process STATUS markers
        const statusRegex = /STATUS:(SEARCHING|PROCESSING|FETCHING|FINALIZING|COMPUTING|DESIGNING)\n?/g;
        let match;
        while ((match = statusRegex.exec(buffer)) !== null) {
          const statusVal = match[1];
          setMessages((prev) => prev.map((msg) => 
            msg.id === activeAssistantMessageId ? { ...msg, status: statusVal } : msg
          ));
        }
        
        // Clean up status markers from buffer after processing
        if (statusRegex.test(buffer)) {
          buffer = buffer.replace(statusRegex, '');
        }

        const toolCallPrefix = "TOOL_CALL:";
        const toolUsedPrefix = "TOOL_USED:";

        // Process TOOL_USED markers first
        while (true) {
          const usedIndex = buffer.indexOf(toolUsedPrefix);
          if (usedIndex === -1) break;

          let endOfUsed = buffer.indexOf('\n', usedIndex);
          if (endOfUsed === -1 && done) endOfUsed = buffer.length;

          if (endOfUsed !== -1) {
            const toolName = buffer.substring(usedIndex + toolUsedPrefix.length, endOfUsed).trim();
            if (toolName) {
              setMessages((prev) => prev.map((msg) => 
                msg.id === activeAssistantMessageId 
                  ? { ...msg, tools: Array.from(new Set([...(msg.tools || []), toolName])) } 
                  : msg
              ));
            }
            buffer = buffer.substring(0, usedIndex) + buffer.substring(endOfUsed + (done ? 0 : 1));
          } else {
            break; // Wait for more data
          }
        }

        // Process TOOL_CALL markers
        while (true) {
          const toolCallIndex = buffer.indexOf(toolCallPrefix);
          if (toolCallIndex === -1) {
            // No tool call marker, process buffer as normal text
            // Leave some room at the end for a partial marker
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

          // Marker found! Process text before marker first
          const contentBefore = buffer.substring(0, toolCallIndex);
          if (contentBefore) {
            setMessages((prev) => prev.map((msg) => 
              msg.id === activeAssistantMessageId ? { ...msg, content: msg.content + contentBefore } : msg
            ));
          }
          
          // Look for end of tool call (newline)
          const jsonStart = toolCallIndex + toolCallPrefix.length;
          let endOfToolCall = buffer.indexOf('\n', jsonStart);
          if (endOfToolCall === -1 && done) endOfToolCall = buffer.length;

          if (endOfToolCall !== -1) {
            const toolCallStr = buffer.substring(jsonStart, endOfToolCall).trim();
            if (toolCallStr) {
              try {
                const toolCall = JSON.parse(toolCallStr);
                console.log("[Assistant] Parsing Tool Call:", toolCall.name);
                
                if (toolCall.name === 'ask_user' && toolCall.parameters) {
                  const { question, placeholder } = toolCall.parameters;
                  setModalQuestion(question);
                  setModalPlaceholder(placeholder || "Type your response here...");
                  setIsModalOpen(true);
                } else if (toolCall.name === 'ask_user_choice' && toolCall.parameters) {
                  const { question, options } = toolCall.parameters;
                  setChoiceQuestion(question);
                  setChoiceOptions(options || []);
                  setIsChoiceModalOpen(true);
                } else if (toolCall.name === 'render_html' && toolCall.parameters) {
                  const { html, title, fullScreen } = toolCall.parameters;
                  console.log("[Assistant] Received Visualization:", { title, size: html.length });
                  setMessages((prev) => prev.map((msg) => 
                    msg.id === activeAssistantMessageId 
                      ? { ...msg, inlineHtml: { html, title, fullScreen } } 
                      : msg
                  ));
                }
              } catch (e) {
                console.error("[Assistant] Tool Call Parse Error:", e, "Payload:", toolCallStr.substring(0, 100));
              }
            }
            buffer = buffer.substring(endOfToolCall + (done ? 0 : 1));
          } else {
            // Tool call is incomplete, keep it in buffer and wait for more data
            // We need to keep everything from toolCallIndex onwards
            buffer = buffer.substring(toolCallIndex);
            break;
          }
        }

        if (done) {
          // Final sweep for any remaining buffer text
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
      console.error("[Assistant] Stream Error:", err);
      const friendlyError = "I'm having trouble connecting right now.";
      toast.error(friendlyError);
      setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: `⚠️ ${friendlyError}` } : msg));
    } finally {
      console.log("[Assistant] Message Stream Finalized");
      setMessages(prev => prev.filter(msg => 
        (msg.content && msg.content.trim() !== '') || 
        msg.role !== 'assistant' || 
        (msg.inlineHtml && msg.inlineHtml.html)
      ));
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading]);

  const handleClear = React.useCallback(() => {
    if (messages.length === 0) return;
    setMessages([]);
    toast.success('Conversation cleared');
  }, [messages.length]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-6 flex flex-col h-[calc(100dvh-140px)]">
      {/* Header with Settings */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Bot size={20} />
          </div>
        </div>
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="p-2 hover:bg-accent rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95"
          title="Assistant Settings"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col relative">
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth custom-scrollbar"
        >
          {messages.length === 0 && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="min-h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto p-4 py-8"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                <div className="relative flex items-center gap-3">
                    <div className="bg-primary p-3.5 rounded-2xl text-primary-foreground shadow-lg shadow-primary/20">
                      <Bot className="h-7 w-7" />
                    </div>
                </div>
              </div>
              
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent border border-border rounded-full text-[10px] font-bold tracking-wider uppercase mb-4">
                <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
                Assistant AI
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">How can I help?</h2>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed font-medium">
                I&apos;m Assistant, your study buddy connected to your academic records. Ask about your <span className="text-foreground font-bold">grades</span>, <span className="text-foreground font-bold">fees</span>, or <span className="text-foreground font-bold">schedules</span>.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => sendMessage(s.text)}
                    className={`group flex flex-col items-start p-4 bg-accent/40 border border-border hover:border-primary/40 hover:bg-accent rounded-xl transition-all text-left relative overflow-hidden active:scale-[0.98] ${
                      suggestions.length % 2 !== 0 && i === suggestions.length - 1 ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <div className={`${s.bg} ${s.color} p-2 rounded-lg mb-2.5 transition-transform group-hover:scale-110`}>
                        <s.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{s.text}</span>
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
                  key={m.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'} ${isContinuation ? 'mt-1' : 'mt-6'}`}
                >
                  <div className={`flex gap-3.5 ${m.role === 'user' ? 'max-w-[85%] sm:max-w-[75%]' : 'flex-col w-full items-start'}`}>
                    {/* Avatar & Label Area - Only show for first message of sequence */}
                    {m.role !== 'user' && !isContinuation && (
                      <div className="w-full flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-9 w-9 rounded-2xl bg-accent border border-border text-primary flex items-center justify-center shadow-sm">
                            <BrainCircuit className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-foreground uppercase tracking-tight">Assistant</span>
                              <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {/* Tool Stack */}
                          {m.tools && m.tools.length > 0 && (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tight leading-none mb-1">Tools Engaged</span>
                              <AvatarGroup 
                                max={6}
                                sx={{
                                  '& .MuiAvatar-root': { 
                                    width: 20, 
                                    height: 20, 
                                    fontSize: 10,
                                    border: '2px solid var(--card)',
                                    bgcolor: 'color-mix(in srgb, var(--primary), transparent 90%)',
                                    color: 'var(--primary)',
                                    boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.1)'
                                  },
                                }}
                              >
                                {m.tools.map((tool, i) => {
                                  const ToolIcon = getToolIcon(tool);
                                  return (
                                    <Tooltip key={i} title={tool.replace(/_/g, ' ')} arrow>
                                      <Avatar>
                                        <ToolIcon className="h-2.5 w-2.5" />
                                      </Avatar>
                                    </Tooltip>
                                  );
                                })}
                              </AvatarGroup>
                            </div>
                          )}
                          {m.content && !isLoading && (
                            <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />
                          )}
                          {m.content && !isLoading && (
                            <div className="flex items-center gap-2">
                              <SpeakButton 
                                messageId={m.id} 
                                content={m.content} 
                                isSpeaking={currentlySpeakingId === m.id} 
                                onSpeak={handleSpeak}
                                className="scale-110" 
                              />
                              <CopyButton content={m.content} className="scale-110" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bubble / Card */}
                    <div className={`leading-relaxed break-words overflow-hidden ${
                      m.role === 'user' 
                        ? 'p-3.5 rounded-2xl rounded-tr-none bg-primary text-primary-foreground font-medium shadow-md' 
                        : 'w-full max-w-full'
                    }`}>
                      {m.role === 'user' ? (
                        <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                      ) : (
                        (m.content || m.inlineHtml) ? (
                          <div className={`relative w-full overflow-x-auto bg-accent/10 p-5 md:p-7 border border-border/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] ${
                            isContinuation ? 'rounded-2xl' : 'rounded-2xl rounded-tl-none'
                          }`}>
                            {m.content && (
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkMath]} 
                                rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
                                className={`prose prose-slate dark:prose-invert max-w-full leading-relaxed text-muted-foreground font-medium text-sm break-words ${
                                  isLoading && idx === messages.length - 1 ? 'streaming-active' : ''
                                }`}
                                components={{
                                  p: ({children}) => <p className="mb-5 last:mb-0 leading-relaxed text-sm/6">{children}</p>,
                                  table: ({...props}) => <div className="overflow-x-auto my-8 rounded-xl border border-border/60 shadow-sm bg-card/50"><table className="w-full text-xs text-left" {...props} /></div>,
                                  thead: ({...props}) => <thead className="bg-accent/80 text-foreground font-bold uppercase tracking-tight text-[10px]" {...props} />,
                                  th: ({...props}) => <th className="px-4 py-3" {...props} />,
                                  td: ({...props}) => <td className="px-4 py-3 border-t border-border/40" {...props} />,
                                  code: ({className, children, ...props}) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return match ? (
                                      <div className="relative group my-6">
                                        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                                          <div className="px-2 py-1 bg-accent rounded text-[9px] font-bold uppercase tracking-tight text-muted-foreground border border-border">
                                            {match[1]}
                                          </div>
                                          <CopyButton content={String(children).replace(/\n$/, '')} />
                                        </div>
                                        <pre className="bg-muted text-foreground rounded-xl p-5 overflow-x-auto text-xs scroll-smooth custom-scrollbar border border-border shadow-xl">
                                          <code className={className} {...props}>
                                            {children}
                                          </code>
                                        </pre>
                                      </div>
                                    ) : (
                                      <code className="bg-primary/10 text-primary rounded-md px-1.5 py-0.5 font-mono text-[0.9em] font-bold border border-primary/20" {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                  a: ({...props}) => <a className="text-primary font-bold hover:opacity-80 transition-all underline decoration-primary/30 underline-offset-4" target="_blank" rel="noopener noreferrer" {...props} />,
                                  img: ({...props}) => <img className="rounded-2xl border border-border shadow-lg my-8 max-w-full h-auto" {...props} />,
                                  ul: ({...props}) => <ul className="list-disc list-outside ml-6 my-5 space-y-2.5" {...props} />,
                                  ol: ({...props}) => <ol className="list-decimal list-outside ml-6 my-5 space-y-2.5" {...props} />,
                                  h1: ({children}) => <h1 className="text-xl font-bold text-foreground mt-10 mb-5 pb-3 border-b border-border/60 uppercase tracking-tight">{children}</h1>,
                                  h2: ({children}) => <h2 className="text-lg font-bold text-foreground mt-8 mb-4 tracking-tight">{children}</h2>,
                                  h3: ({children}) => <h3 className="text-base font-bold text-foreground mt-6 mb-3">{children}</h3>,
                                  blockquote: ({...props}) => <blockquote className="border-l-4 border-primary/50 pl-5 py-3 my-8 text-muted-foreground italic bg-primary/5 rounded-r-2xl font-medium" {...props} />,
                                  iframe: ({...props}) => <iframe className="max-w-full rounded-xl border border-border shadow-sm my-4" {...props} />,
                                  video: ({...props}) => <video className="max-w-full rounded-xl border border-border shadow-sm my-4" controls {...props} />,
                                }}
                              >
                                {m.content}
                              </ReactMarkdown>
                            )}

                            {m.inlineHtml && (
                              <div className={`${m.content ? 'mt-6' : ''} h-[500px] relative group`}>
                                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 flex gap-2">
                                  <button 
                                    onClick={() => {
                                      setHtmlModalContent(m.inlineHtml!.html);
                                      setHtmlModalTitle(m.inlineHtml!.title || 'Visualization');
                                      setHtmlModalFullScreen(!!m.inlineHtml!.fullScreen);
                                      setIsHtmlModalOpen(true);
                                    }}
                                    className="p-2.5 bg-primary/90 text-primary-foreground hover:bg-primary rounded-xl shadow-xl backdrop-blur-md border border-white/10 active:scale-95 transition-all"
                                    title="View Fullscreen"
                                  >
                                    <Maximize2 className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                  <div className="px-3 py-1.5 bg-card/80 backdrop-blur-md border border-border rounded-lg text-[10px] font-bold text-foreground uppercase tracking-wider shadow-lg">
                                    {m.inlineHtml.title || 'Interactive Content'}
                                  </div>
                                </div>
                                <iframe
                                  srcDoc={getIframeSrcDoc(m.inlineHtml.html)}
                                  className="w-full h-full border-none bg-transparent"
                                  title={m.inlineHtml.title || "Assistant Visualization"}
                                  sandbox="allow-scripts allow-modals allow-popups allow-forms"
                                />
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

        {/* Input Area */}
        <ChatInput 
          onSend={sendMessage} 
          onStop={handleStop}
          isLoading={isLoading} 
          onClear={handleClear}
          hasMessages={messages.length > 0}
        />
      </div>

      {/* Ask User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="max-w-md"
        title={
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Assistant Request</h3>
          </div>
        }
      >
        <div className="p-6">
          <p className="text-sm text-muted-foreground font-medium mb-6 leading-relaxed">
            {modalQuestion}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (modalInput.trim()) {
                setIsModalOpen(false);
                sendMessage(modalInput.trim());
              }
            }}
          >
            <input
              autoFocus
              type="text"
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              placeholder={modalPlaceholder}
              className="w-full bg-accent border border-border focus:border-primary/50 focus:bg-card rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all mb-4"
            />
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-accent border border-border hover:bg-accent/80 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!modalInput.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-primary/20"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Choice Modal */}
      <Modal
        isOpen={isChoiceModalOpen}
        onClose={() => setIsChoiceModalOpen(false)}
        maxWidth="max-w-md"
        title={
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Assistant Suggestion</h3>
          </div>
        }
      >
        <div className="p-6">
          <p className="text-sm text-muted-foreground font-medium mb-6 leading-relaxed">
            {choiceQuestion}
          </p>

          <div className="flex flex-col gap-2 mb-6">
            {choiceOptions.map((option, i) => (
              <button
                key={i}
                onClick={() => {
                  setIsChoiceModalOpen(false);
                  sendMessage(option);
                }}
                className="w-full text-left p-3.5 bg-accent/40 border border-border hover:border-primary/40 hover:bg-accent rounded-xl transition-all text-xs font-bold text-foreground active:scale-[0.98]"
              >
                {option}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setIsChoiceModalOpen(false)}
            className="w-full px-4 py-2.5 bg-accent border border-border hover:bg-accent/80 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* HTML Visualization Modal */}
      <Modal
        isOpen={isHtmlModalOpen}
        onClose={() => setIsHtmlModalOpen(false)}
        title={htmlModalTitle}
        maxWidth={htmlModalFullScreen ? "max-w-[95vw]" : "max-w-4xl"}
        className={htmlModalFullScreen ? "h-[90vh] flex flex-col" : ""}
      >
        <div className={`w-full bg-card overflow-hidden relative ${htmlModalFullScreen ? "flex-1" : "h-[70vh]"}`}>
          <iframe
            srcDoc={getIframeSrcDoc(htmlModalContent)}
            className="w-full h-full border-none"
            title="Assistant Visualization"
            sandbox="allow-scripts allow-modals allow-popups allow-forms"
          />
        </div>
        <div className="flex justify-end p-4 border-t border-border bg-card">
          <button
            onClick={() => setIsHtmlModalOpen(false)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-blue-500/10 hover:opacity-90 transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Assistant Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        maxWidth="max-w-2xl"
        title={
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Assistant Preferences</h3>
          </div>
        }
      >
        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {student && <AssistantTab student={student} updateSettings={updateSettings} />}
        </div>
      </Modal>

    </div>
  );
}
