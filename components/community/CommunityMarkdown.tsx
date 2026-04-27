'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
import { Check, Copy } from 'lucide-react';

interface CommunityMarkdownProps {
  content: string;
  className?: string;
}

const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg bg-accent/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-all border border-border/50 shadow-sm active:scale-90"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
};

export default function CommunityMarkdown({ content, className = "" }: CommunityMarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
        components={{
          a: ({ ...props }) => (
            <a 
              {...props} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 font-bold underline hover:opacity-80 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              {props.children}
            </a>
          ),
          blockquote: ({ ...props }) => (
            <blockquote 
              className="border-l-4 border-primary/50 pl-4 py-1 my-4 text-muted-foreground italic bg-primary/5 rounded-r-lg" 
              {...props} 
            />
          ),
          ul: ({ ...props }) => (
            <ul className="list-disc list-outside ml-5 my-4 space-y-2 text-muted-foreground/90" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal list-outside ml-5 my-4 space-y-2 text-muted-foreground/90" {...props} />
          ),
          li: ({ ...props }) => (
            <li className="mb-1" {...props} />
          ),
          h1: ({children}) => <h1 className="text-lg font-black text-foreground mt-6 mb-3 pb-2 border-b border-border/50 uppercase tracking-tight">{children}</h1>,
          h2: ({children}) => <h2 className="text-base font-bold text-foreground mt-5 mb-2.5 tracking-tight">{children}</h2>,
          h3: ({children}) => <h3 className="text-sm font-bold text-foreground mt-4 mb-2">{children}</h3>,
          p: ({children}) => <p className="mb-4 last:mb-0 last:inline leading-relaxed">{children}</p>,
          table: ({...props}) => <div className="overflow-x-auto my-6 rounded-xl border border-border/60 shadow-sm bg-card/50"><table className="w-full text-xs text-left" {...props} /></div>,
          thead: ({...props}) => <thead className="bg-accent/80 text-foreground font-black uppercase tracking-widest text-[9px]" {...props} />,
          th: ({...props}) => <th className="px-3 py-2" {...props} />,
          td: ({...props}) => <td className="px-3 py-2 border-t border-border/40" {...props} />,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <div className="relative group my-4" onClick={(e) => e.stopPropagation()}>
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                  <div className="px-2 py-1 bg-accent rounded text-[8px] font-black uppercase tracking-widest text-muted-foreground border border-border">
                    {match[1]}
                  </div>
                  <CopyButton content={String(children).replace(/\n$/, '')} />
                </div>
                <pre className="bg-muted text-foreground rounded-xl p-4 overflow-x-auto text-xs scroll-smooth custom-scrollbar border border-border shadow-lg">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono text-[0.9em] font-bold border border-primary/20" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
