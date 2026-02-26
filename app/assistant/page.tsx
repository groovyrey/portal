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
  <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 w-fit">
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0 }}
      className="w-1 h-1 bg-slate-300 rounded-full"
    />
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
      className="w-1 h-1 bg-slate-400 rounded-full"
    />
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
      className="w-1 h-1 bg-slate-500 rounded-full"
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
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-6 flex flex-col h-[calc(100vh-128px)]">
      {/* Messages Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth custom-scrollbar"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-4">
              <div className="bg-slate-50 p-3 rounded-xl mb-4 text-slate-400">
                <Bot className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">How can I help?</h2>
              <p className="text-xs text-slate-500 mb-8 leading-relaxed">
                Check your grades, schedule, or balance.
                <br />
                <span className="font-medium text-slate-400">Conversations are not saved.</span>
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-[13px] text-slate-600 bg-slate-50 border border-slate-100 hover:border-slate-300 hover:bg-slate-100 px-4 py-2.5 rounded-xl transition-all text-left flex items-center justify-between group"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div 
                key={m.id} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse max-w-[85%]' : 'flex-col w-full items-start'}`}>
                  {/* Avatar & Name */}
                  <div className={`flex items-center gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${
                      m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    {m.role === 'assistant' && (
                      <span className="text-xs font-bold text-slate-900">Assistant</span>
                    )}
                  </div>

                  {/* Bubble */}
                  <div className={`text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'p-3 rounded-xl bg-slate-900 text-white font-medium' 
                      : 'py-1 px-0.5 text-slate-700'
                  }`}>
                    {m.role === 'user' ? (
                      <p>{m.content}</p>
                    ) : (
                      m.content ? (
                        <div className="relative">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeHighlight]}
                            className={`prose prose-slate max-w-none leading-relaxed text-slate-600 font-normal ${
                              isLoading && m.id === messages[messages.length - 1].id ? 'streaming-active' : ''
                            }`}
                            components={{
                              p: ({node, children}) => <p className="mb-4 last:mb-0">{children}</p>,
                              table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded-xl border border-slate-200"><table className="w-full text-xs text-left" {...props} /></div>,
                              thead: ({node, ...props}) => <thead className="bg-slate-50 text-slate-900 font-bold" {...props} />,
                              th: ({node, ...props}) => <th className="px-4 py-2.5" {...props} />,
                              td: ({node, ...props}) => <td className="px-4 py-2.5 border-t border-slate-100" {...props} />,
                              code: ({node, ...props}) => <code className="bg-slate-100 text-slate-900 rounded px-1.5 py-0.5 font-mono text-[0.9em]" {...props} />,
                              pre: ({node, ...props}) => <pre className="bg-slate-900 text-slate-50 rounded-xl p-4 my-4 overflow-x-auto text-xs" {...props} />,
                              a: ({node, ...props}) => <a className="text-blue-600 font-bold hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 my-4 space-y-2 text-slate-600" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 my-4 space-y-2 text-slate-600" {...props} />,
                              li: ({node, children}) => <li className="pl-1">{children}</li>,
                              h1: ({node, children}) => <h1 className="text-xl font-bold text-slate-900 mt-6 mb-3 pb-1 border-b border-slate-100">{children}</h1>,
                              h2: ({node, children}) => <h2 className="text-lg font-bold text-slate-900 mt-5 mb-3">{children}</h2>,
                              h3: ({node, children}) => <h3 className="text-base font-bold text-slate-900 mt-4 mb-2">{children}</h3>,
                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-200 pl-4 py-1 my-4 text-slate-500 italic" {...props} />,
                              hr: ({node, ...props}) => <hr className="my-6 border-slate-100" {...props} />,
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
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder={isLoading ? "Thinking..." : "Ask a question..."}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl pl-4 pr-12 py-3 text-sm font-medium transition-all outline-none disabled:opacity-60"
              />
              <button 
                type="submit"
                disabled={!input?.trim() || isLoading}
                className="absolute right-2 p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-all shadow-sm active:scale-95"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
              AI may produce inaccurate information.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
