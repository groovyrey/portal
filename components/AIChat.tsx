'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  X, 
  Bot, 
  Loader2,
  Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    const assistantMessageId = (Date.now() + 1).toString();
    const newAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };

    setMessages((prev) => [...prev, newAssistantMessage]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to get a response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextEncoder().encode('').length === 0 ? new TextDecoder() : null; // Basic check
      // Use standard TextDecoder
      const textDecoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = textDecoder.decode(value, { stream: true });
        
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === assistantMessageId 
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Something went wrong');
      // Remove the empty assistant message if it's still empty and there was an error
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.id === assistantMessageId && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-20 right-0 w-[350px] md:w-[380px] h-[500px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Portal AI</h3>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Online</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <Bot className="h-10 w-10 text-slate-400 mb-2" />
                  <p className="text-xs font-medium text-slate-500">How can I help you today?</p>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none font-medium' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none prose prose-slate prose-sm max-w-none'
                  }`}>
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]} 
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          table: ({node, ...props}) => <div className="overflow-x-auto my-2"><table className="border-collapse border border-slate-200 w-full" {...props} /></div>,
                          th: ({node, ...props}) => <th className="border border-slate-200 px-2 py-1 bg-slate-50 font-bold" {...props} />,
                          td: ({node, ...props}) => <td className="border border-slate-200 px-2 py-1" {...props} />,
                          code: ({node, ...props}) => <code className="bg-slate-100 rounded px-1 py-0.5 font-mono text-xs" {...props} />,
                          pre: ({node, ...props}) => <pre className="bg-slate-100 rounded-lg p-3 my-2 overflow-x-auto" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc ml-4 my-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal ml-4 my-2" {...props} />,
                          a: ({node, ...props}) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-3 rounded-xl rounded-tl-none">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-start">
                  <div className="bg-red-50 border border-red-200 p-3 rounded-xl rounded-tl-none text-red-600 text-xs font-medium">
                    ⚠️ {error}. Please try again.
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-50 text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!input?.trim() || isLoading}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
}
