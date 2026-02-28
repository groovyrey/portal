'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Send, 
  User, 
  Sparkles, 
  RotateCcw, 
  Globe, 
  Link as LinkIcon,
  MessageSquare,
  ChevronDown,
  Info,
  Maximize2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '@/types';
import { useStudentQuery } from '@/lib/hooks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

export default function AssistantPage() {
  const { data: student } = useStudentQuery();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting
    if (messages.length === 0 && student) {
      const firstName = student.parsedName?.firstName || student.name.split(',')[0];
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hello, **${firstName}**! I'm your LCC Hub Assistant. How can I help you with your academics today?`
        }
      ]);
    }
  }, [student, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          studentData: student
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content
        }]);
      } else {
        toast.error(data.error || 'Failed to get a response.');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (messages.length <= 1) return;
    setMessages(messages.slice(0, 1));
    toast.success('Conversation cleared');
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-140px)] flex flex-col">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">AI Assistant</h1>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Always Online</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={clearChat}
            className="p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30 transition-all active:scale-95 shadow-sm"
            title="Clear Chat"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col relative">
          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar scroll-smooth"
          >
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border ${
                      m.role === 'user' 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'bg-accent border-border text-primary'
                    }`}>
                      {m.role === 'user' ? <User className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
                    </div>
                    <div className={`p-4 rounded-2xl shadow-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-accent text-foreground rounded-tl-none border border-border'
                    }`}>
                      <div className={`prose prose-sm max-w-none ${m.role === 'user' ? 'prose-invert' : 'dark:prose-invert'} prose-p:leading-relaxed prose-pre:bg-black/10 prose-pre:border prose-pre:border-white/5`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-3 items-center ml-11">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          className="h-1.5 w-1.5 rounded-full bg-blue-500"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Thinking</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-card border-t border-border">
            <form onSubmit={handleSend} className="relative flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your portal..."
                disabled={isLoading}
                className="w-full bg-accent border border-border focus:bg-card focus:border-primary rounded-xl pl-4 pr-12 py-3 text-sm font-medium transition-all outline-none disabled:opacity-60 text-foreground"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all disabled:opacity-30 active:scale-90"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="flex items-center justify-center gap-4 mt-3">
               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  Encrypted Session
               </p>
               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-blue-500" />
                  AI may hallucinate
               </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { ShieldCheck } from 'lucide-react';
