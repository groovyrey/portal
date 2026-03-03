"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Bot, Sparkles, Loader2, Image as ImageIcon, X, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { askLlama } from "./actions";

interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  image?: string; // base64 data
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg bg-accent/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-all border border-border/50 shadow-sm active:scale-90"
      title="Copy message"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
};

export default function ChatBox() {
  const initialMessages: Message[] = [
    { role: "system", content: "You are a helpful, multimodal AI assistant. You can analyze images, write code, and answer questions accurately and concisely." },
    { role: "assistant", content: "Hello! How can I assist you today? You can type a message or upload an image to get started." }
  ];

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleClear = () => {
    setMessages(initialMessages);
    setSelectedImage(null);
    setInput("");
    toast.success("Chat history cleared");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        setSelectedImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg: Message = { 
      role: "user", 
      content: input,
      image: selectedImage || undefined
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      let currentHistory = [...messages, userMsg];
      const result = await askLlama(currentHistory);
      
      const assistantMsg: Message = { 
        role: "assistant", 
        content: result.response || "", 
        tool_calls: result.tool_calls 
      };
      
      setMessages((prev) => [...prev, assistantMsg]);
      currentHistory.push(assistantMsg);

      if (result.tool_calls && result.tool_calls.length > 0) {
        let toolResultsHistory = [...currentHistory];
        
        for (const toolCall of result.tool_calls) {
          if (toolCall.name === "show_toast") {
            let args;
            try {
              args = typeof toolCall.arguments === 'string' 
                ? JSON.parse(toolCall.arguments) 
                : toolCall.arguments;
            } catch (e) {
              args = toolCall.arguments || {};
            }
            
            const toastType = args.type || "success";
            (toast as any)[toastType]?.(args.message) || toast(args.message);

            const toolResponse: Message = {
              role: "tool",
              content: `Toast shown: ${args.message}`,
              name: toolCall.name,
              tool_call_id: toolCall.id
            };
            
            toolResultsHistory.push(toolResponse);
            setMessages((prev) => [...prev, toolResponse]);
          }
        }
        
        const finalResult = await askLlama(toolResultsHistory);
        setMessages((prev) => [...prev, { 
          role: "assistant", 
          content: finalResult.response || "Operation completed." 
        }]);
      }
    } catch (error) {
      console.error(error);
      toast.error("AI assistant error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] w-full max-w-3xl mx-auto bg-card border border-border rounded-2xl overflow-hidden shadow-xl transition-colors duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-accent/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium italic">Online</span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleClear}
          className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-accent"
          title="Clear History"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide"
      >
        <AnimatePresence initial={false}>
          {messages
            .filter(m => m.role !== 'system' && m.role !== 'tool' && (m.content.trim() !== '' || m.image))
            .map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-col w-full"}`}
            >
              <div className={`flex items-center gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-blue-600 shadow-md" : "bg-accent border border-border"
                }`}>
                  {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-blue-500" />}
                </div>
                {msg.role === 'assistant' && msg.content && !isLoading && (
                  <CopyButton content={msg.content} />
                )}
              </div>

              <div className={`max-w-[85%] space-y-2 ${msg.role === 'assistant' ? 'w-full max-w-full' : ''}`}>
                {msg.image && (
                  <div className={`rounded-xl overflow-hidden border border-border shadow-md ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                    <img src={`data:image/jpeg;base64,${msg.image}`} alt="AI Input" className="w-full max-h-60 object-cover" />
                  </div>
                )}
                {msg.content && (
                  <div className={`${
                    msg.role === "user" 
                      ? "bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-3 text-sm leading-relaxed shadow-md ml-auto" 
                      : "bg-accent/40 text-foreground border border-border rounded-2xl rounded-tl-none p-4 md:p-5 w-full overflow-hidden"
                  }`}>
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkMath]} 
                        rehypePlugins={[rehypeHighlight, rehypeKatex]}
                        className="prose prose-slate dark:prose-invert max-w-full font-medium text-sm"
                        components={{
                          p: ({children}) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                          table: ({...props}) => <div className="overflow-x-auto my-4 rounded-xl border border-border shadow-sm"><table className="w-full text-xs text-left" {...props} /></div>,
                          thead: ({...props}) => <thead className="bg-accent text-foreground font-bold uppercase tracking-wider text-[10px]" {...props} />,
                          th: ({...props}) => <th className="px-3 py-2" {...props} />,
                          td: ({...props}) => <td className="px-3 py-2 border-t border-border/50" {...props} />,
                          code: ({className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <div className="relative group my-4">
                                <pre className="bg-zinc-950 text-zinc-50 rounded-xl p-4 overflow-x-auto text-xs scroll-smooth custom-scrollbar border border-border">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              </div>
                            ) : (
                              <code className="bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded px-1.5 py-0.5 font-mono text-[0.9em] font-bold" {...props}>
                                {children}
                              </code>
                            );
                          },
                          a: ({...props}) => <a className="text-blue-500 font-bold hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                          ul: ({...props}) => <ul className="list-disc list-outside ml-5 my-4 space-y-2" {...props} />,
                          ol: ({...props}) => <ol className="list-decimal list-outside ml-5 my-4 space-y-2" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent border border-border flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
            </div>
            <div className="bg-accent border border-border rounded-2xl rounded-tl-none px-4 py-3 w-fit flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-accent/30 border-t border-border space-y-4">
        {selectedImage && (
          <div className="relative inline-block">
            <img 
              src={`data:image/jpeg;base64,${selectedImage}`} 
              alt="Preview" 
              className="w-20 h-20 object-cover rounded-lg border border-blue-500/50 shadow-md"
            />
            <button 
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-card text-foreground rounded-full p-1 border border-border hover:bg-accent transition-colors shadow-sm"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-accent hover:bg-accent/80 text-muted-foreground rounded-xl transition-all border border-border active:scale-95"
            title="Upload Image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="absolute right-2 top-1.5 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-muted disabled:text-muted-foreground text-white rounded-lg transition-all active:scale-95 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
