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
  Zap,
  Trash2,
  BrainCircuit,
  MessageSquare,
  Loader2,
  Image as ImageIcon,
  X,
  Paperclip
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudent } from '@/lib/hooks';
import AssistantTab from '@/components/settings/AssistantTab';
import AssistantMarkdown from '@/components/community/AssistantMarkdown';
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
  attachments?: { data: string; mimeType: string }[];
};

const TypingIndicator = ({ status }: { status?: string }) => (
  <div className="flex items-center gap-3 px-1 py-1 min-w-0 overflow-hidden">
    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary/60 shrink-0" />
    {status && (
      <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest animate-pulse truncate min-w-0">
        {status}
      </span>
    )}
  </div>
);

const ActionButtons = ({ content, messageId, currentlySpeakingId, onSpeak, onShowReasoning, hasReasoning }: any) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: any) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {}
  };

  return (
    <div className="flex gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
      {hasReasoning && (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onShowReasoning(); }} className="h-7 w-7 text-muted-foreground hover:text-primary" title="View reasoning">
          <BrainCircuit className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onSpeak(messageId, content); }} className="h-7 w-7 text-muted-foreground hover:text-foreground">
        {currentlySpeakingId === messageId ? <VolumeX className="h-3.5 w-3.5 animate-pulse text-primary" /> : <Volume2 className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={handleCopy} className="h-7 w-7 text-muted-foreground hover:text-foreground">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
};

const ChatInput = React.memo(({ onSend, onStop, isLoading, onClear, hasMessages }: any) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<{ file: File; preview: string; base64: string }[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (>5MB)`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        setAttachments(prev => [...prev, { 
          file, 
          preview: URL.createObjectURL(file), 
          base64 
        }]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAtt = [...prev];
      URL.revokeObjectURL(newAtt[index].preview);
      newAtt.splice(index, 1);
      return newAtt;
    });
  };

  const startRecording = async () => {
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
        const toastId = toast.loading("Processing...");
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob);
          const response = await fetch('/api/deepgram', { method: 'POST', body: formData });
          const data = await response.json();
          if (data && data.transcript) {
            setInput((prev) => prev ? `${prev} ${data.transcript}` : data.transcript);
            toast.success("Done", { id: toastId });
          }
        } catch (error) {
          toast.error("Failed", { id: toastId });
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { toast.error("Mic error"); }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) { onStop(); return; }
    if (input.trim() || attachments.length > 0) { 
      onSend(input, attachments.map(a => ({ data: a.base64, mimeType: a.file.type }))); 
      setInput(''); 
      attachments.forEach(a => URL.revokeObjectURL(a.preview));
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 md:p-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-4">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2">
              {attachments.map((att, i) => (
                <div key={i} className="relative group/att h-20 w-20 rounded-xl border border-border overflow-hidden bg-muted shadow-sm">
                  <img src={att.preview} alt="preview" className="h-full w-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="absolute top-1 right-1 bg-background/90 rounded-full p-1 opacity-0 group-hover/att:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={cn(
            "relative flex flex-col transition-all duration-300 rounded-[1.5rem] border border-border bg-muted/30 focus-within:bg-muted/50 focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/30 shadow-sm overflow-hidden",
            isLoading && "opacity-80 pointer-events-none"
          )}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask assistant or analyze images..."
              rows={1}
              className="w-full bg-transparent border-none focus:ring-0 px-6 pt-4 pb-2 text-sm font-medium resize-none min-h-[56px] max-h-[200px] custom-scrollbar"
            />
            
            <div className="flex items-center justify-between px-3 pb-3">
               <div className="flex items-center gap-1">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <Paperclip className="h-4.5 w-4.5" />
                  </Button>

                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => isRecording ? mediaRecorderRef.current?.stop() : startRecording()} 
                    className={cn(
                      "h-9 w-9 rounded-full transition-all", 
                      isRecording ? "text-destructive bg-destructive/10 animate-pulse" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {isRecording ? <StopCircle className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
                  </Button>

                  {hasMessages && !input && attachments.length === 0 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={onClear} 
                      className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  )}
               </div>

                <Button 
                  onClick={() => handleSubmit()}
                  size="icon" 
                  disabled={(!input.trim() && attachments.length === 0) || isLoading}
                  variant={isLoading ? "ghost" : "default"}
                  className={cn(
                    "h-9 w-9 rounded-full shadow-md transition-all active:scale-90",
                    !input.trim() && attachments.length === 0 ? "bg-muted text-muted-foreground shadow-none" : "bg-primary text-primary-foreground"
                  )}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" multiple className="hidden" />
          <p className="text-[10px] text-center text-muted-foreground/40 font-medium tracking-tight px-10 leading-tight">
            LCC Hub Assistant may occasionally provide inaccurate information. Always verify important details through official LCC portal records.
          </p>
      </div>
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

  const [isReasoningModalOpen, setIsReasoningModalOpen] = useState(false);
  const [reasoningContent, setReasoningContent] = useState('');

  const [suggestions] = useState([
    { text: "My balance?", icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { text: "Today's schedule", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
    { text: "AI news", icon: Search, color: "text-purple-500", bg: "bg-purple-500/10" },
    { text: "Summarize site", icon: Globe, color: "text-amber-500", bg: "bg-amber-500/10" }
  ]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['chat', 'settings'].includes(tab)) setActiveTab(tab as 'chat' | 'settings');
  }, [searchParams]);

  const handleTabChange = (tabId: 'chat' | 'settings') => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.replace(`${pathname}?${params.toString()}`);
  };

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
      if (res.ok) toast.success('Updated');
    } catch (e) {
      toast.error('Failed to save');
    }
  };

  const handleSpeak = async (messageId: string, content: string) => {
    if (currentlySpeakingId === messageId && currentAudio) { currentAudio.pause(); setCurrentlySpeakingId(null); return; }
    if (currentAudio) currentAudio.pause();
    
    // Clean text for TTS: Remove reasoning tags, code blocks, and markdown symbols
    const cleanedText = content
      .replace(/<(thought|think|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, '') // Remove reasoning
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/[*#~>|]/g, '') // Remove markdown formatting chars
      .trim();

    if (!cleanedText) return;
    try {
      setCurrentlySpeakingId(messageId);
      const response = await fetch('/api/deepgram', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: cleanedText, model: student?.settings?.assistant?.voiceModel || 'aura-helios-en' }) });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = () => setCurrentlySpeakingId(null);
      setCurrentAudio(audio);
      audio.play();
    } catch (err) { setCurrentlySpeakingId(null); }
  };

  const sendMessage = React.useCallback(async (content: string, attachments?: { data: string; mimeType: string }[]) => {
    if ((!content.trim() && !attachments) || isLoading) return;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: content.trim(),
      attachments
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/ai/assistant', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(m => ({ 
            role: m.role, 
            content: m.content,
            attachments: m.attachments 
          })) 
        }), 
        signal: abortController.signal 
      });
      const reader = response.body?.getReader();
      if (!reader) throw new Error();
      const textDecoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (value) buffer += textDecoder.decode(value, { stream: true });
        
        const statusRegex = /STATUS:([^\n]+)\n?/g;
        let match;
        while ((match = statusRegex.exec(buffer)) !== null) {
          const statusVal = match[1].trim();
          if (statusVal && student?.settings?.assistant?.showThinkingProcess) {
            setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, status: statusVal } : msg));
          }
        }
        buffer = buffer.replace(statusRegex, '');

        const toolUsedPrefix = "TOOL_USED:";
        while (true) {
          const usedIndex = buffer.indexOf(toolUsedPrefix);
          if (usedIndex === -1) break;
          let endOfUsed = buffer.indexOf('\n', usedIndex);
          if (endOfUsed === -1 && done) endOfUsed = buffer.length;
          if (endOfUsed !== -1) {
             const toolName = buffer.substring(usedIndex + toolUsedPrefix.length, endOfUsed).trim();
             if (toolName && student?.settings?.assistant?.showThinkingProcess) setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, tools: Array.from(new Set([...(msg.tools || []), toolName])) } : msg));
             buffer = buffer.substring(0, usedIndex) + buffer.substring(endOfUsed + (done ? 0 : 1));
          } else break;
        }

        const toolCallPrefix = "TOOL_CALL:";
        const filterThoughts = (text: string) => {
          if (student?.settings?.assistant?.showThinkingProcess) return text;
          return text.replace(/<(thought|think|reasoning)>[\s\S]*?<\/\1>/gi, '').trim();
        };

        while (true) {
          const toolCallIndex = buffer.indexOf(toolCallPrefix);
          if (toolCallIndex === -1) {
            const safeLength = done ? buffer.length : Math.max(0, buffer.length - toolCallPrefix.length);
            const rawChunk = buffer.substring(0, safeLength);
            const textToAppend = filterThoughts(rawChunk);
            if (textToAppend) { 
              setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: msg.content + textToAppend } : msg)); 
              buffer = buffer.substring(safeLength); 
            } else if (rawChunk && student?.settings?.assistant?.showThinkingProcess) {
               setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: msg.content + rawChunk } : msg)); 
               buffer = buffer.substring(safeLength); 
            }
            break; 
          }
          const contentBefore = filterThoughts(buffer.substring(0, toolCallIndex));
          if (contentBefore) setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: msg.content + contentBefore } : msg));
          const jsonStart = toolCallIndex + toolCallPrefix.length;
          let endOfToolCall = buffer.indexOf('\n', jsonStart);
          if (endOfToolCall === -1 && done) endOfToolCall = buffer.length;
          if (endOfToolCall !== -1) {
            try {
              const toolCall = JSON.parse(buffer.substring(jsonStart, endOfToolCall).trim());
              if (toolCall.name === 'ask_user') { setModalQuestion(toolCall.parameters.question); setModalPlaceholder(toolCall.parameters.placeholder || "Response..."); setIsQuestionModalOpen(true); }
              else if (toolCall.name === 'ask_user_choice') { setChoiceQuestion(toolCall.parameters.question); setChoiceOptions(toolCall.parameters.options || []); setIsChoiceModalOpen(true); }
            } catch (e) {}
            buffer = buffer.substring(endOfToolCall + (done ? 0 : 1));
          } else { buffer = buffer.substring(toolCallIndex); break; }
        }
        if (done) break;
      }
    } catch (err) { if ((err as any).name !== 'AbortError') toast.error("Error"); }
    finally { setIsLoading(false); abortControllerRef.current = null; }
  }, [messages, isLoading, student?.settings?.assistant?.showThinkingProcess]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const { scrollHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <TabbedPageLayout title="Assistant" icon={BrainCircuit} subtitle="AI Study Companion" tabs={[{ id: 'chat', name: 'Chat', icon: MessageSquare }, { id: 'settings', name: 'Settings', icon: Settings }]} activeTab={activeTab} onTabChange={(id) => handleTabChange(id as any)}>
      <div className="flex flex-col h-[calc(100vh-14rem)] w-full overflow-hidden">
        {activeTab === 'chat' && (
          <Card className="flex-1 flex flex-col shadow-none overflow-hidden border-border bg-background w-full rounded-xl">
            <ScrollArea ref={scrollContainerRef} className="flex-1 w-full">
              <div className="flex flex-col min-h-full w-full max-w-4xl mx-auto px-4 py-8 md:px-6 relative">
                {messages.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-12 w-full">
                    <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10"><Bot className="h-6 w-6" /></div>
                    <div className="space-y-1"><h2 className="text-xl font-bold">How can I help?</h2><p className="text-muted-foreground text-sm">Ask about your academic records.</p></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl px-4">
                      {suggestions.map((s, i) => (
                        <button key={i} onClick={() => sendMessage(s.text)} className="flex items-center gap-3 p-3 bg-card border border-border hover:bg-accent rounded-lg transition-all text-left text-sm font-medium active:scale-[0.98] w-full"><div className={cn("p-1.5 rounded-md", s.bg, s.color)}><s.icon className="h-4 w-4" /></div><span>{s.text}</span></button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-6 w-full py-4 overflow-hidden">
                  {messages.map((m, idx) => (
                    <div key={m.id} className={cn("flex w-full min-w-0 overflow-hidden group", m.role === 'assistant' ? "justify-start" : "justify-end")}>
                      <div className={cn("flex flex-col gap-1 min-w-0 max-w-[85%] sm:max-w-[75%]", m.role === 'assistant' ? "items-start" : "items-end")}>
                        <div className={cn("flex items-center gap-2 px-1 h-4", m.role === 'assistant' ? "flex-row" : "flex-row-reverse")}>
                          {m.role === 'assistant' && <span className="text-[10px] font-bold uppercase text-muted-foreground/40 tracking-widest">Assistant</span>}
                          {!isLoading && m.content && m.role === 'assistant' && (
                            <ActionButtons 
                              content={m.content} 
                              messageId={m.id} 
                              currentlySpeakingId={currentlySpeakingId} 
                              onSpeak={handleSpeak}
                              hasReasoning={student?.settings?.assistant?.showThinkingProcess && /<(thought|think|reasoning)>[\s\S]*?<\/\1>/gi.test(m.content)}
                              onShowReasoning={() => {
                                const matches = Array.from(m.content.matchAll(/<(thought|think|reasoning)>([\s\S]*?)<\/\1>/gi));
                                if (matches.length > 0) {
                                  const joined = matches.map(match => match[2].trim()).join('\n\n---\n\n');
                                  setReasoningContent(joined);
                                  setIsReasoningModalOpen(true);
                                }
                              }}
                            />
                          )}
                        </div>
                        <div className={cn("rounded-2xl px-4 py-2.5 border transition-all duration-200 min-w-0 w-fit max-w-full overflow-hidden shadow-sm", m.role === 'assistant' ? "bg-muted/30 border-border text-foreground rounded-tl-none" : "bg-primary text-primary-foreground border-primary rounded-tr-none")}>
                          {m.role === 'assistant' ? (
                            <div className="min-w-0 w-full overflow-hidden flex flex-col">
                              {(() => {
                                const visibleText = m.content.replace(/<(thought|think|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, '').trim();
                                if (isLoading && !visibleText && idx === messages.length - 1) {
                                  const hasThought = /<(thought|think|reasoning)>/.test(m.content);
                                  return <TypingIndicator status={m.status || (hasThought ? 'THINKING' : 'PROCESSING')} />;
                                }
                                return <AssistantMarkdown content={m.content} isLoading={isLoading && idx === messages.length - 1} showThinking={student?.settings?.assistant?.showThinkingProcess} />;
                              })()}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                               {m.attachments && m.attachments.length > 0 && (
                                 <div className="flex flex-wrap gap-2 mb-1">
                                    {m.attachments.map((att, i) => (
                                      <img key={i} src={`data:${att.mimeType};base64,${att.data}`} alt="upload" className="h-32 w-32 object-cover rounded-lg border border-primary/20 shadow-md" />
                                    ))}
                                 </div>
                               )}
                               <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed break-all sm:break-words">{m.content}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
            <ChatInput onSend={sendMessage} onStop={() => { abortControllerRef.current?.abort(); setIsLoading(false); }} isLoading={isLoading} onClear={() => { setMessages([]); toast.success("Cleared"); }} hasMessages={messages.length > 0} />
          </Card>
        )}
        {activeTab === 'settings' && <Card className="flex-1 overflow-y-auto bg-background border-border shadow-none rounded-xl m-4"><CardContent className="p-6 md:p-8">{student && <AssistantTab student={student} updateSettings={updateSettings} />}</CardContent></Card>}
        
        <Dialog open={isQuestionModalOpen} onOpenChange={setIsQuestionModalOpen}>
          <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Assistant Question</DialogTitle><DialogDescription>{modalQuestion}</DialogDescription></DialogHeader><div className="py-4"><Input value={modalInput} onChange={(e) => setModalInput(e.target.value)} placeholder={modalPlaceholder} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { setIsQuestionModalOpen(false); sendMessage(modalInput); setModalInput(''); } }} /></div><DialogFooter><Button variant="ghost" onClick={() => setIsQuestionModalOpen(false)}>Cancel</Button><Button onClick={() => { setIsQuestionModalOpen(false); sendMessage(modalInput); setModalInput(''); }}>Submit</Button></DialogFooter></DialogContent>
        </Dialog>
        <Dialog open={isChoiceModalOpen} onOpenChange={setIsChoiceModalOpen}>
          <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Please Choose</DialogTitle><DialogDescription>{choiceQuestion}</DialogDescription></DialogHeader><div className="grid gap-2 py-4">{choiceOptions.map((opt, i) => (<Button key={i} variant="outline" className="justify-start h-auto py-3 px-4 font-semibold text-left" onClick={() => { setIsChoiceModalOpen(false); sendMessage(opt); }}>{opt}</Button>))}</div></DialogContent>
        </Dialog>

        <Dialog open={isReasoningModalOpen} onOpenChange={setIsReasoningModalOpen}>
          <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
            <div className="p-6 pb-2">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  <span>System Reasoning</span>
                </DialogTitle>
                <DialogDescription>Internal logic used to generate this response.</DialogDescription>
              </DialogHeader>
            </div>
            <div className="flex-1 min-h-0 px-6 pb-6">
              <ScrollArea className="h-full w-full rounded-md border bg-muted/20 p-4">
                <AssistantMarkdown content={reasoningContent} isReasoning={true} />
              </ScrollArea>
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button onClick={() => setIsReasoningModalOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TabbedPageLayout>
  );
}
