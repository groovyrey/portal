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
  Wallet
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Link from 'next/link';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

// Modern Typing Indicator Component
const TypingIndicator = () => (
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
          className="h-1.5 w-1.5 rounded-full bg-blue-500"
        />
      ))}
    </div>
    <span className="text-[10px] font-bold text-muted-foreground animate-pulse uppercase tracking-wider leading-none">
      Assistant is thinking
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
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    { text: "What's my current balance?", icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { text: "Show my schedule for today", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
    { text: "Search for Latest AI Advancement", icon: Search, color: "text-purple-500", bg: "bg-purple-500/10" },
    { text: "Summarize: laconcepcioncollege.com", icon: Globe, color: "text-amber-500", bg: "bg-amber-500/10" }
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
                ...prev.slice(0, 3),
                { text: `Resources for "${subjectTitle}"`, icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-500/10" }
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

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
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
      });

      if (!response.ok) throw new Error(await response.text() || 'Failed to get a response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const textDecoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (value) buffer += textDecoder.decode(value, { stream: true });
        
        buffer = buffer.replace(/STATUS:(SEARCHING|PROCESSING|FINALIZING)/g, '');

        const toolCallPrefix = "TOOL_CALL:";
        while (true) {
          const toolCallIndex = buffer.indexOf(toolCallPrefix);
          if (toolCallIndex === -1) {
            const safeLength = Math.max(0, buffer.length - toolCallPrefix.length);
            const safeContent = buffer.substring(0, safeLength);
            if (safeContent) {
              setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: msg.content + safeContent } : msg));
              buffer = buffer.substring(safeLength);
            }
            break; 
          }

          const contentBefore = buffer.substring(0, toolCallIndex);
          if (contentBefore) {
            setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: msg.content + contentBefore } : msg));
          }
          buffer = buffer.substring(toolCallIndex + toolCallPrefix.length);

          let endOfToolCall = buffer.indexOf('\n');
          if (endOfToolCall === -1 && done) endOfToolCall = buffer.length;

          if (endOfToolCall !== -1) {
            const toolCallStr = buffer.substring(0, endOfToolCall).trim();
            if (toolCallStr) {
              try {
                const toolCall = JSON.parse(toolCallStr);
                if (toolCall.name === 'show_toast' && toolCall.parameters) {
                  const { message, type } = toolCall.parameters as { message: string; type: 'success' | 'error' | 'info' | 'warning' };
                  toast[type || 'info']("Assistant Message", {
                    description: message,
                    duration: 4000,
                  });
                } else if (toolCall.name === 'ask_user' && toolCall.parameters) {
                  const { question, placeholder } = toolCall.parameters as { question: string; placeholder?: string };
                  setModalQuestion(question);
                  setModalPlaceholder(placeholder || "Type your response here...");
                  setModalInput('');
                  setIsModalOpen(true);
                } else if (toolCall.name === 'ask_user_choice' && toolCall.parameters) {
                  const { question, options } = toolCall.parameters as { question: string; options: string[] };
                  setChoiceQuestion(question);
                  setChoiceOptions(options || []);
                  setIsChoiceModalOpen(true);
                }
              } catch (e) {}
            }
            buffer = buffer.substring(endOfToolCall + (done ? 0 : 1));
          } else {
            buffer = toolCallPrefix + buffer;
            break;
          }
        }
        if (done) {
          if (buffer) setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: msg.content + buffer } : msg));
          break;
        }
      }
    } catch (err: any) {
      const friendlyError = "I'm having trouble connecting right now. Please try again in a moment.";
      toast.error(friendlyError);
      setMessages((prev) => prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: `⚠️ ${friendlyError}` } : msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (messages.length === 0) return;
    setMessages([]);
    toast.success('Conversation cleared');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-6 flex flex-col h-[calc(100vh-140px)]">
      {/* Messages Area */}
      <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col relative">
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth custom-scrollbar"
        >
          {messages.length === 0 && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto p-4"
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
                AI Assistant
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">How can I help?</h2>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed font-medium">
                I'm connected to your academic records. Ask about your <span className="text-foreground font-bold">grades</span>, <span className="text-foreground font-bold">fees</span>, or <span className="text-foreground font-bold">schedules</span>.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => sendMessage(s.text)}
                    className="group flex flex-col items-start p-4 bg-accent/40 border border-border hover:border-primary/40 hover:bg-accent rounded-xl transition-all text-left relative overflow-hidden active:scale-[0.98]"
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
            {messages.map((m, idx) => (
              <motion.div 
                key={m.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3.5 ${m.role === 'user' ? 'flex-row-reverse max-w-[85%] sm:max-w-[75%]' : 'flex-col w-full items-start'}`}>
                  {/* Avatar & Label */}
                  <div className={`flex items-center gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center border ${
                      m.role === 'user' ? 'bg-primary border-primary text-primary-foreground' : 'bg-accent border-border text-primary'
                    }`}>
                      {m.role === 'user' ? <User className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
                    </div>
                    {m.role === 'assistant' && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Assistant</span>
                        {m.content && !isLoading && <CopyButton content={m.content} />}
                      </div>
                    )}
                  </div>

                  {/* Bubble */}
                  <div className={`leading-relaxed break-words overflow-hidden ${
                    m.role === 'user' 
                      ? 'p-3.5 rounded-2xl rounded-tr-none bg-primary text-primary-foreground font-medium shadow-md' 
                      : 'w-full max-w-full'
                  }`}>
                    {m.role === 'user' ? (
                      <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                    ) : (
                      m.content ? (
                        <div className="relative w-full overflow-hidden bg-accent/20 p-4 rounded-2xl rounded-tl-none border border-border/50">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkMath]} 
                            rehypePlugins={[rehypeHighlight, rehypeKatex]}
                            className={`prose prose-slate dark:prose-invert max-w-full leading-relaxed text-muted-foreground font-medium text-sm break-words ${
                              isLoading && idx === messages.length - 1 ? 'streaming-active' : ''
                            }`}
                            components={{
                              p: ({children}) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                              table: ({...props}) => <div className="overflow-x-auto my-6 rounded-xl border border-border shadow-sm"><table className="w-full text-xs text-left" {...props} /></div>,
                              thead: ({...props}) => <thead className="bg-accent text-foreground font-bold uppercase tracking-wider text-[9px]" {...props} />,
                              th: ({...props}) => <th className="px-3 py-2" {...props} />,
                              td: ({...props}) => <td className="px-3 py-2 border-t border-border/50" {...props} />,
                              code: ({className, children, ...props}) => {
                                const match = /language-(\w+)/.exec(className || '');
                                return match ? (
                                  <div className="relative group my-4">
                                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                      <CopyButton content={String(children).replace(/\n$/, '')} />
                                    </div>
                                    <pre className="bg-slate-950 text-slate-50 rounded-xl p-4 overflow-x-auto text-xs scroll-smooth custom-scrollbar">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  </div>
                                ) : (
                                  <code className="bg-primary/5 text-primary rounded px-1.5 py-0.5 font-mono text-[0.9em] font-bold" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              a: ({...props}) => <a className="text-blue-500 font-bold hover:underline transition-all" target="_blank" rel="noopener noreferrer" {...props} />,
                              ul: ({...props}) => <ul className="list-disc list-outside ml-5 my-4 space-y-2" {...props} />,
                              ol: ({...props}) => <ol className="list-decimal list-outside ml-5 my-4 space-y-2" {...props} />,
                              h1: ({children}) => <h1 className="text-lg font-bold text-foreground mt-8 mb-4 pb-2 border-b border-border/50 uppercase tracking-tight">{children}</h1>,
                              h2: ({children}) => <h2 className="text-base font-bold text-foreground mt-6 mb-3">{children}</h2>,
                              h3: ({children}) => <h3 className="text-sm font-bold text-foreground mt-4 mb-2">{children}</h3>,
                              blockquote: ({...props}) => <blockquote className="border-l-4 border-primary pl-4 py-2 my-6 text-muted-foreground italic bg-primary/5 rounded-r-lg" {...props} />,
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <TypingIndicator />
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-card border-t border-border">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="max-w-3xl mx-auto">
            <div className="relative flex items-center bg-accent border border-border focus-within:border-primary/50 focus-within:bg-card rounded-xl transition-all shadow-sm overflow-hidden">
                <button
                    type="button"
                    onClick={handleClear}
                    className="pl-3 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Clear Chat"
                >
                    <RefreshCcw className="h-3.5 w-3.5" />
                </button>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    placeholder={isLoading ? "Processing..." : "Ask a question..."}
                    className="w-full bg-transparent px-3 py-3 text-sm font-medium transition-all outline-none disabled:opacity-60 text-foreground"
                />
                <div className="pr-1.5">
                    <button 
                        type="submit"
                        disabled={!input?.trim() || isLoading}
                        className="bg-primary text-primary-foreground p-2 rounded-lg hover:opacity-90 disabled:opacity-30 transition-all shadow-sm active:scale-90"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                </div>
            </div>
            <p className="text-[9px] text-center text-muted-foreground mt-2.5 font-bold uppercase tracking-widest">
              AI may produce inaccurate information
            </p>
          </form>
        </div>
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
    </div>
  );
}
