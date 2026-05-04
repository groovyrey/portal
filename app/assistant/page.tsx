'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  Sparkles,
  BrainCircuit,
  HelpCircle,
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
import Link from 'next/link';
import { toast } from 'sonner';
import { useStudent } from '@/lib/hooks';
import AssistantTab from '@/components/settings/AssistantTab';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
    className="px-4 py-2.5 bg-muted/50 rounded-md border w-fit flex items-center gap-3"
  >
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          className="h-1 w-1 rounded-full bg-primary"
        />
      ))}
    </div>
    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
      {status ? `Assistant is ${status.toLowerCase()}` : "Thinking"}
    </span>
  </motion.div>
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
      className="h-7 w-7 text-muted-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
};

const SpeakButton = ({ messageId, content, isSpeaking, onSpeak }: { messageId: string, content: string, isSpeaking: boolean, onSpeak: (id: string, content: string) => void }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => { e.stopPropagation(); onSpeak(messageId, content); }}
      className="h-7 w-7 text-muted-foreground"
    >
      {isSpeaking ? <VolumeX className="h-3.5 w-3.5 animate-pulse" /> : <Volume2 className="h-3.5 w-3.5" />}
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
    <div className="p-4 border-t bg-background">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-2">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
             <div className="absolute left-1 top-1 flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClear}
                  disabled={!hasMessages || isLoading}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading || isTranscribing}
                  className={cn("h-8 w-8", isRecording ? "text-destructive animate-pulse" : "text-muted-foreground")}
                >
                  {isRecording ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
             </div>
             <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading || isTranscribing}
                placeholder={isRecording ? "Listening..." : isLoading ? "Assistant is responding..." : "Ask a question..."}
                className="pl-20 h-10 pr-12"
             />
             {input.length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold text-muted-foreground/40 uppercase">
                   {input.length}/2000
                </div>
             )}
          </div>
          <Button 
            type="submit" 
            size="icon" 
            disabled={(!input.trim() && !isLoading) || isTranscribing}
            variant={isLoading ? "destructive" : "default"}
            className="h-10 w-10 shrink-0"
          >
            {isLoading ? <Square className="h-4 w-4 fill-current" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[9px] text-center text-muted-foreground font-semibold uppercase tracking-wider">
          AI may generate inaccurate information.
        </p>
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

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

  const [suggestions] = useState([
    { text: "What's my schedule today?", icon: Calendar },
    { text: "Check my remaining balance", icon: Wallet },
    { text: "Help me with my grades", icon: Info }
  ]);

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
      case 'render_html': return Sparkles;
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
        let match;
        while ((match = statusRegex.exec(buffer)) !== null) {
          const statusVal = match[1];
          setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, status: statusVal } : msg));
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
            if (toolName) {
              setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, tools: Array.from(new Set([...(msg.tools || []), toolName])) } : msg));
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
              setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: msg.content + textToAppend } : msg));
              buffer = buffer.substring(safeLength);
            }
            break; 
          }
          const contentBefore = buffer.substring(0, toolCallIndex);
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
                  setIsModalOpen(true);
                } else if (toolCall.name === 'ask_user_choice') {
                  setChoiceQuestion(toolCall.parameters.question);
                  setChoiceOptions(toolCall.parameters.options || []);
                  setIsChoiceModalOpen(true);
                } else if (toolCall.name === 'render_html') {
                  setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, inlineHtml: toolCall.parameters } : msg));
                }
              } catch (e) {}
            }
            buffer = buffer.substring(endOfToolCall + (done ? 0 : 1));
          } else { buffer = buffer.substring(toolCallIndex); break; }
        }
        if (done) {
          if (buffer.trim()) setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: msg.content + buffer } : msg));
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
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto w-full p-4 md:p-6 gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Assistant</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSettingsModalOpen(true)}>
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col shadow-sm">
        <ScrollArea ref={scrollContainerRef} className="flex-1 p-4 md:p-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Bot className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Hello, {student?.parsedName?.firstName}!</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  I can help you check your grades, schedule, or balance. Just ask!
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
                {suggestions.map((s, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="h-auto flex-col p-4 gap-2 border-dashed bg-muted/20"
                    onClick={() => sendMessage(s.text)}
                  >
                    <s.icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">{s.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6 pb-4">
            {messages.map((m, idx) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div key={m.id} className={cn("flex flex-col gap-2", isAssistant ? "items-start" : "items-end")}>
                  {isAssistant && (
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                         <Badge variant="secondary" className="h-5 px-1.5 gap-1.5">
                            <BrainCircuit className="h-3 w-3" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">AI Assistant</span>
                         </Badge>
                         {m.tools && m.tools.length > 0 && (
                            <div className="flex -space-x-1">
                               {m.tools.map((t, i) => {
                                 const Icon = getToolIcon(t);
                                 return <div key={i} className="h-5 w-5 rounded-full border bg-background flex items-center justify-center"><Icon className="h-2.5 w-2.5 text-primary" /></div>;
                               })}
                            </div>
                         )}
                      </div>
                      {!isLoading && m.content && (
                        <div className="flex gap-1">
                          <SpeakButton messageId={m.id} content={m.content} isSpeaking={currentlySpeakingId === m.id} onSpeak={handleSpeak} />
                          <CopyButton content={m.content} />
                        </div>
                      )}
                    </div>
                  )}

                  <div className={cn(
                    "max-w-[85%] rounded-md p-3.5 text-sm leading-relaxed",
                    isAssistant ? "bg-muted/50 border" : "bg-primary text-primary-foreground font-medium"
                  )}>
                    {isAssistant && !m.content && !m.inlineHtml ? (
                      <TypingIndicator status={m.status} />
                    ) : (
                      <>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkMath]} 
                          rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
                          className="prose prose-slate dark:prose-invert max-w-none text-sm leading-normal break-words"
                        >
                          {m.content}
                        </ReactMarkdown>
                        {m.inlineHtml && (
                          <div className="mt-4 h-64 border rounded-md overflow-hidden bg-white">
                            <iframe 
                              srcDoc={m.inlineHtml.html} 
                              className="w-full h-full border-none" 
                              sandbox="allow-scripts"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <ChatInput 
          onSend={sendMessage} 
          onStop={handleStop}
          isLoading={isLoading} 
          onClear={() => { setMessages([]); toast.success("Cleared"); }}
          hasMessages={messages.length > 0}
        />
      </Card>

      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent className="max-w-md">
           <DialogHeader>
              <DialogTitle>Assistant Settings</DialogTitle>
              <DialogDescription>Customize your AI experience</DialogDescription>
           </DialogHeader>
           {student && <AssistantTab student={student} updateSettings={updateSettings} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-sm">
           <DialogHeader>
              <DialogTitle>Question</DialogTitle>
              <DialogDescription>{modalQuestion}</DialogDescription>
           </DialogHeader>
           <Input 
              value={modalInput} 
              onChange={(e) => setModalInput(e.target.value)} 
              placeholder={modalPlaceholder}
           />
           <DialogFooter>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={() => { setIsModalOpen(false); sendMessage(modalInput); setModalInput(''); }}>Submit</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isChoiceModalOpen} onOpenChange={setIsChoiceModalOpen}>
        <DialogContent className="sm:max-w-sm">
           <DialogHeader>
              <DialogTitle>Please Choose</DialogTitle>
              <DialogDescription>{choiceQuestion}</DialogDescription>
           </DialogHeader>
           <div className="grid gap-2">
              {choiceOptions.map((opt, i) => (
                <Button key={i} variant="outline" onClick={() => { setIsChoiceModalOpen(false); sendMessage(opt); }}>{opt}</Button>
              ))}
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
