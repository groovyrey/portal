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
  ArrowLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import Link from 'next/link';
import { toast } from 'sonner';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

// Modern Typing Indicator Component
const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0 }}
      className="w-1.5 h-1.5 bg-blue-400 rounded-full"
    />
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
      className="w-1.5 h-1.5 bg-blue-500 rounded-full"
    />
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
      className="w-1.5 h-1.5 bg-blue-600 rounded-full"
    />
  </div>
);

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create a temporary assistant message with empty content to show loading state
    const assistantMessageId = (Date.now() + 1).toString();
    const temporaryAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '', // Empty content indicates loading state
    };
    setMessages((prev) => [...prev, temporaryAssistantMessage]);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to get a response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const textDecoder = new TextDecoder();
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = textDecoder.decode(value, { stream: true });
        
        if (isFirstChunk) {
          isFirstChunk = false;
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === assistantMessageId ? { ...msg, content: chunk } : msg
            )
          );
        } else {
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === assistantMessageId ? { ...msg, content: msg.content + chunk } : msg
            )
          );
        }
      }
    } catch (err: any) {
      console.error('Assistant error:', err);
      const friendlyError = "I'm having trouble connecting right now. Please try again in a moment.";
      toast.error(friendlyError);
      
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === assistantMessageId 
            ? { ...msg, content: `⚠️ ${friendlyError}` } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const suggestions = [
    "What's my current balance?",
    "Show my schedule for today",
    "How are my grades doing?",
    "Explain my course requirements"
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-8 flex flex-col h-[calc(100vh-128px)]">
      {/* Messages Area */}
      <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative">
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth custom-scrollbar"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-4">
              <div className="bg-blue-50 p-4 rounded-2xl mb-6">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Hello! How can I help?</h2>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                I can help you check your grades, schedule, or financial status. 
                Please note that <span className="font-semibold text-slate-700">conversations are not saved</span> once you leave this page.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-sm text-slate-600 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm px-4 py-3 rounded-xl transition-all text-left flex items-center justify-between group"
                  >
                    {s}
                    <ArrowLeft className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all rotate-180" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div 
                key={m.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse max-w-[85%]' : 'flex-col w-full items-start'}`}>
                  {/* Avatar & Name */}
                  <div className={`flex items-center gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    {m.role === 'assistant' && (
                      <span className="text-sm font-semibold text-slate-700">Assistant</span>
                    )}
                  </div>

                  {/* Bubble */}
                  <div className={`text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'p-4 rounded-3xl shadow-lg shadow-blue-500/10 bg-blue-600 text-white rounded-tr-none border border-blue-500/20' 
                      : 'py-2 px-1 text-slate-800'
                  }`}>
                    {m.role === 'user' ? (
                      <p className="font-medium">{m.content}</p>
                    ) : (
                      m.content ? (
                        <div className="relative">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeHighlight]}
                            className={`prose prose-slate max-w-none leading-relaxed text-slate-700 font-medium ${
                              isLoading && m.id === messages[messages.length - 1].id ? 'streaming-active' : ''
                            }`}
                            components={{
                              p: ({node, children}) => <p className="mb-4 last:mb-0 inline-block w-full">{children}</p>,
                              table: ({node, ...props}) => <div className="overflow-x-auto my-6 rounded-2xl border border-slate-100 shadow-sm"><table className="w-full text-sm text-left" {...props} /></div>,
                              thead: ({node, ...props}) => <thead className="bg-slate-50/80 text-slate-800 font-semibold uppercase tracking-wider text-[10px]" {...props} />,
                              th: ({node, ...props}) => <th className="px-5 py-4" {...props} />,
                              td: ({node, ...props}) => <td className="px-5 py-4 border-t border-slate-50 text-slate-600" {...props} />,
                              code: ({node, ...props}) => <code className="bg-blue-50 text-blue-700 rounded-lg px-2 py-0.5 font-mono text-[0.85em] font-bold border border-blue-100/50" {...props} />,
                              pre: ({node, ...props}) => <pre className="bg-slate-900 text-slate-50 rounded-[2rem] p-6 my-6 overflow-x-auto text-xs shadow-2xl border border-slate-800" {...props} />,
                              a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-700 font-bold hover:underline decoration-blue-200 underline-offset-4 decoration-2" target="_blank" rel="noopener noreferrer" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 my-4 space-y-2.5 text-slate-700 marker:text-blue-400" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 my-4 space-y-2.5 text-slate-700 marker:text-blue-500 font-bold" {...props} />,
                              li: ({node, children}) => <li className="pl-1">{children}</li>,
                              h1: ({node, children}) => <h1 className="text-2xl font-black text-slate-900 mt-8 mb-4 tracking-tight border-b border-slate-100 pb-2">{children}</h1>,
                              h2: ({node, children}) => <h2 className="text-xl font-black text-slate-900 mt-7 mb-4 tracking-tight">{children}</h2>,
                              h3: ({node, children}) => <h3 className="text-lg font-bold text-slate-900 mt-6 mb-3">{children}</h3>,
                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500/20 pl-6 py-2 my-6 text-slate-500 italic bg-blue-50/30 rounded-r-3xl" {...props} />,
                              hr: ({node, ...props}) => <hr className="my-8 border-slate-100" {...props} />,
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

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/80 backdrop-blur border-t border-slate-100">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder={isLoading ? "Assistant is thinking..." : "Ask about grades, schedule, or fees..."}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-full pl-5 pr-12 py-3.5 text-sm font-medium transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button 
                type="submit"
                disabled={!input?.trim() || isLoading}
                className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-sm"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-center text-slate-400 mt-3 font-medium">
              <span className="text-slate-500">Note: Conversations are not saved.</span> AI may produce inaccurate information.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
