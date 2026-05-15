'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import { cn } from '@/lib/utils';
import { BrainCircuit, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface AssistantMarkdownProps {
  content: string;
  isLoading?: boolean;
  showThinking?: boolean;
  isReasoning?: boolean;
}

const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error("Clipboard unavailable");
      }
    } catch (err) {}
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-7 w-7 text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
};

export default function AssistantMarkdown({ content, isLoading, showThinking, isReasoning }: AssistantMarkdownProps) {
  // Always filter out thinking/reasoning tags from the main chat bubble.
  // Unless we are explicitly in the reasoning modal.
  const displayContent = isReasoning 
    ? content 
    : content.replace(/<(thought|think|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, '').trim();

  return (
    <div className="w-full max-w-full overflow-hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeKatex, rehypeRaw]}
        className={cn(
          "text-sm leading-relaxed max-w-full",
          isLoading && "streaming-active"
        )}
        components={{
          p: ({ children }: any) => (
            <p className="mb-3 last:mb-0 break-words whitespace-pre-wrap max-w-full leading-relaxed overflow-hidden">
              {children}
            </p>
          ),
          thead: ({ ...props }: any) => (
            <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]" {...props} />
          ),
          th: ({ children, ...props }: any) => (
            <th className="px-4 py-3 border-b border-border whitespace-nowrap font-bold" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }: any) => (
            <td className="px-4 py-3 border-b border-border/50 font-medium" {...props}>
              {children}
            </td>
          ),
          table: ({ ...props }: any) => (
            <div className="my-4 w-full overflow-x-auto rounded-md border border-border bg-muted/10 custom-scrollbar shadow-inner">
              <table className="w-full min-w-[450px] border-collapse text-xs text-left" {...props} />
            </div>
          ),
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeContent = String(children).replace(/\n$/, '');
            return match ? (
              <div className="relative group my-4 max-w-full overflow-hidden rounded-md border border-border bg-muted/30">
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1.5">
                  <span className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border">
                    {match[1]}
                  </span>
                  <CopyButton content={codeContent} />
                </div>
                <pre className="p-4 overflow-x-auto text-[11px] font-mono custom-scrollbar max-w-full">
                  <code className={cn("leading-normal", className)} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-[0.85em] font-semibold border border-border/50" {...props}>
                {children}
              </code>
            );
          },

          a: ({ ...props }: any) => (
            <a 
              className="text-primary font-bold underline decoration-primary/20 underline-offset-4 hover:decoration-primary transition-all break-all" 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props} 
            />
          ),
          ul: ({ ...props }: any) => (
            <ul className="list-disc list-outside ml-5 my-3 space-y-1 max-w-full overflow-hidden break-words" {...props} />
          ),
          ol: ({ ...props }: any) => (
            <ol className="list-decimal list-outside ml-5 my-3 space-y-1 max-w-full overflow-hidden break-words" {...props} />
          ),
          li: ({ ...props }: any) => (
            <li className="break-words max-w-full mb-1" {...props} />
          ),
          blockquote: ({ ...props }: any) => (
            <blockquote 
              className="border-l-4 border-muted pl-4 py-1.5 my-4 text-muted-foreground italic bg-muted/10 rounded-r max-w-full overflow-hidden break-words" 
              {...props} 
            />
          ),
          h1: ({ children }: any) => (
            <h1 className="text-base font-bold mt-5 mb-2.5 border-b border-border pb-1.5 tracking-tight max-w-full overflow-hidden break-words">
              {children}
            </h1>
          ),
          h2: ({ children }: any) => (
            <h2 className="text-sm font-bold mt-4 mb-2 tracking-tight max-w-full overflow-hidden break-words">
              {children}
            </h2>
          ),
          h3: ({ children }: any) => (
            <h3 className="text-xs font-bold mt-3 mb-1.5 tracking-tight max-w-full overflow-hidden text-muted-foreground break-words">
              {children}
            </h3>
          ),
          // Custom component for AI thoughts/reasoning
          thought: ({ children }: any) => (
            <div className="text-[11px] leading-relaxed text-muted-foreground/60 italic border-l border-border pl-4 py-2 my-4 bg-muted/5 transition-all max-w-full break-words">
              <div className="relative z-10 overflow-hidden max-w-full">{children}</div>
            </div>
          ),
        } as any}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
}
