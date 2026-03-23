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
import { CopyButton } from '@/components/shared/CopyButton';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Extract headers for the table of contents
  const headers = content.match(/^#{1,3}\s+(.+)$/gm)?.map(h => {
    const level = h.match(/^#+/)?.[0].length || 0;
    const text = h.replace(/^#+\s+/, '');
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return { level, text, id };
  }) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:block space-y-8 sticky top-10 h-fit lg:col-span-1">
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contents</h4>
          <nav className="flex flex-col gap-1">
            {headers.filter(h => h.level <= 2).map((header, i) => (
              <a 
                key={i} 
                href={`#${header.id}`} 
                className={`
                  text-sm font-bold transition-colors py-1 truncate
                  ${header.level === 1 ? 'text-primary mt-2' : 'text-muted-foreground hover:text-foreground pl-2'}
                `}
              >
                {header.text}
              </a>
            ))}
          </nav>
        </div>
        <div className="p-4 bg-accent/30 rounded-2xl border border-border/50">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Pro Tip</h4>
          <p className="text-[10px] text-muted-foreground font-bold leading-relaxed uppercase tracking-tight">
            Use the "Ask Assistant" feature for any question about your school records. It's the fastest way to get data.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:col-span-3">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeHighlight, rehypeKatex, rehypeRaw]}
          className="prose prose-slate dark:prose-invert max-w-none leading-relaxed text-muted-foreground font-medium break-words"
          components={{
            p: ({children}) => <p className="mb-5 last:mb-0 leading-relaxed">{children}</p>,
            table: ({...props}) => <div className="overflow-x-auto my-8 rounded-xl border border-border/60 shadow-sm bg-card/50"><table className="w-full text-sm text-left" {...props} /></div>,
            thead: ({...props}) => <thead className="bg-accent/80 text-foreground font-bold uppercase tracking-tight text-xs" {...props} />,
            th: ({...props}) => <th className="px-4 py-3" {...props} />,
            td: ({...props}) => <td className="px-4 py-3 border-t border-border/40" {...props} />,
            code: ({className, children, ...props}) => {
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <div className="relative group my-6">
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                    <div className="px-2 py-1 bg-accent rounded text-[9px] font-bold uppercase tracking-tight text-muted-foreground border border-border">
                      {match[1]}
                    </div>
                    <CopyButton content={String(children).replace(/\n$/, '')} />
                  </div>
                  <pre className="bg-muted text-foreground rounded-xl p-5 overflow-x-auto text-sm scroll-smooth custom-scrollbar border border-border shadow-xl">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              ) : (
                <code className="bg-primary/10 text-primary rounded-md px-1.5 py-0.5 font-mono text-[0.9em] font-bold border border-primary/20" {...props}>
                  {children}
                </code>
              );
            },
            a: ({...props}) => <a className="text-primary font-bold hover:opacity-80 transition-all underline decoration-primary/30 underline-offset-4" {...props} />,
            img: ({...props}) => <img className="rounded-2xl border border-border shadow-lg my-8 max-w-full h-auto" {...props} />,
            ul: ({...props}) => <ul className="list-disc list-outside ml-6 my-5 space-y-2.5" {...props} />,
            ol: ({...props}) => <ol className="list-decimal list-outside ml-6 my-5 space-y-2.5" {...props} />,
            h1: ({node, ...props}) => {
              const text = props.children?.toString() || '';
              const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return <h1 id={id} className="text-3xl font-bold text-foreground mt-12 mb-6 pb-4 border-b border-border/60 uppercase tracking-tight" {...props} />;
            },
            h2: ({node, ...props}) => {
              const text = props.children?.toString() || '';
              const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return <h2 id={id} className="text-2xl font-bold text-foreground mt-10 mb-5 tracking-tight flex items-center gap-3" {...props} />;
            },
            h3: ({node, ...props}) => {
              const text = props.children?.toString() || '';
              const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return <h3 id={id} className="text-xl font-bold text-foreground mt-8 mb-4" {...props} />;
            },
            blockquote: ({...props}) => <blockquote className="border-l-4 border-primary/50 pl-5 py-3 my-8 text-muted-foreground italic bg-primary/5 rounded-r-2xl font-medium" {...props} />,
            iframe: ({...props}) => <iframe className="max-w-full rounded-xl border border-border shadow-sm my-4" {...props} />,
            video: ({...props}) => <video className="max-w-full rounded-xl border border-border shadow-sm my-4" controls {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
