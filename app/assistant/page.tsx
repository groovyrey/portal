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
  Check
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
  <div className="px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
    <span className="text-[11px] font-bold text-slate-500 animate-pulse uppercase tracking-[0.2em] leading-none">
      Thinking...
    </span>
  </div>
);

// Copy Button Component for Assistant Messages
const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
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
      className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all border border-slate-100 shadow-sm"
      title="Copy message"
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
    </button>
  );
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "What's my current balance?",
    "Show my schedule for today",
    "Search for Latest AI Advancement",
    "Summarize: https://laconcepcioncollege.com/"
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await fetch('/api/student/me');
        if (response.ok) {
          const result = await response.json();
          // Use current schedule instead of historical grades
          const subjects = result.data?.schedule || [];
          if (subjects.length > 0) {
            const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
            const subjectTitle = randomSubject.description || randomSubject.subject;
            if (subjectTitle) {
              setSuggestions(prev => [
                ...prev,
                `Search for "${subjectTitle}" learning Resources`
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
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          buffer += textDecoder.decode(value, { stream: true });
        }

        // Remove status signals if they appear in the stream
        buffer = buffer.replace(/STATUS:(SEARCHING|PROCESSING|FINALIZING)/g, '');

        // Process buffer for tool calls
        const toolCallPrefix = "TOOL_CALL:";        while (true) {
          const toolCallIndex = buffer.indexOf(toolCallPrefix);
          
          if (toolCallIndex === -1) {
            // No tool call prefix found. 
            // However, the buffer might end with a partial "TOOL_CALL:" prefix.
            // We should only append text that is definitely not part of a prefix.
            const safeLength = Math.max(0, buffer.length - toolCallPrefix.length);
            const safeContent = buffer.substring(0, safeLength);
            
            if (safeContent) {
              setMessages((prev) => 
                prev.map((msg) => 
                  msg.id === assistantMessageId ? { ...msg, content: msg.content + safeContent } : msg
                )
              );
              buffer = buffer.substring(safeLength);
            }
            break; 
          }

          // We found a tool call prefix.
          // 1. Append everything BEFORE the prefix to the message.
          const contentBefore = buffer.substring(0, toolCallIndex);
          if (contentBefore) {
            setMessages((prev) => 
              prev.map((msg) => 
                msg.id === assistantMessageId ? { ...msg, content: msg.content + contentBefore } : msg
              )
            );
          }
          
          // 2. Remove the contentBefore and the prefix from the buffer.
          buffer = buffer.substring(toolCallIndex + toolCallPrefix.length);

          // 3. Look for the end of the tool call (newline) or end of stream.
          let endOfToolCall = buffer.indexOf('\n');
          
          if (endOfToolCall === -1 && done) {
            // Stream ended, take the rest of the buffer as the tool call
            endOfToolCall = buffer.length;
          }

          if (endOfToolCall !== -1) {
            const toolCallStr = buffer.substring(0, endOfToolCall).trim();
            if (toolCallStr) {
              try {
                const toolCall = JSON.parse(toolCallStr);
                if (toolCall.name === 'show_toast' && toolCall.parameters) {
                  const { message, type } = toolCall.parameters as { message: string; type: 'success' | 'error' | 'info' | 'warning' };
                  toast[type || 'info'](`[Assistant]: ${message}`);
                }
              } catch (e) {
                console.error('Failed to parse tool call', e, toolCallStr);
                // If it's not valid JSON, maybe it was just text that looked like a tool call
                // but we already committed to it being a tool call by removing the prefix.
              }
            }
            buffer = buffer.substring(endOfToolCall + (done ? 0 : 1));
          } else {
            // Incomplete tool call, wait for more data.
            // Put the prefix back so we can find it again or wait for the newline.
            buffer = toolCallPrefix + buffer;
            break;
          }
        }

        if (done) {
          // Final flush of any remaining buffer
          if (buffer) {
            setMessages((prev) => 
              prev.map((msg) => 
                msg.id === assistantMessageId ? { ...msg, content: msg.content + buffer } : msg
              )
            );
          }
          break;
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
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-lg shadow-slate-200">
                  <Bot className="h-6 w-6" />
                </div>
                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 border border-blue-100">
                  <Globe className="h-6 w-6" />
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 border border-amber-100">
                  <Search className="h-6 w-6" />
                </div>
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-bold tracking-wider uppercase mb-4 animate-pulse">
                <Sparkles className="h-3 w-3" />
                Web-Enabled Assistant
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2">How can I help?</h2>
              <p className="text-xs text-slate-500 mb-8 leading-relaxed">
                Check your grades, schedule, or balance.
                <br />
                Now with <span className="text-slate-900 font-bold">Web Research</span> and <span className="text-slate-900 font-bold">URL Summarization</span>.
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
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">Assistant</span>
                        {m.content && !isLoading && <CopyButton content={m.content} />}
                      </div>
                    )}
                  </div>

                  {/* Bubble */}
                  <div className={`text-sm leading-relaxed break-words overflow-hidden ${
                    m.role === 'user' 
                      ? 'p-3 rounded-xl bg-slate-900 text-white font-medium self-end ml-auto' 
                      : 'py-1 px-0.5 text-slate-700 w-full max-w-full'
                  }`}>
                    {m.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      m.content ? (
                        <div className="relative w-full overflow-hidden">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeHighlight]}
                            className={`prose prose-slate max-w-full leading-relaxed text-slate-600 font-normal break-words ${
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
