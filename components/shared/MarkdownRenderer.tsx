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
import { 
  Zap,
} from 'lucide-react';

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
      <div className="lg:col-span-3 prose prose-sm md:prose-base dark:prose-invert max-w-none 
        prose-headings:font-black prose-headings:tracking-tight prose-headings:uppercase prose-headings:italic
        prose-h1:text-4xl prose-h1:mb-8 prose-h1:text-foreground
        prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:flex prose-h2:items-center prose-h2:gap-3
        prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-foreground
        prose-p:text-muted-foreground prose-p:font-medium prose-p:leading-relaxed
        prose-li:text-muted-foreground prose-li:font-medium
        prose-strong:text-foreground prose-strong:font-bold
        prose-code:text-primary prose-code:font-mono prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-card prose-pre:border prose-pre:border-border prose-pre:rounded-xl
        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-accent/20 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
        prose-table:w-full prose-table:text-left prose-table:border-collapse
        prose-thead:bg-accent/50 prose-thead:text-foreground
        prose-th:p-3 prose-th:text-xs prose-th:uppercase prose-th:tracking-wider
        prose-td:p-3 prose-td:border-t prose-td:border-border/50
        prose-img:rounded-2xl prose-img:shadow-lg prose-img:border prose-img:border-border/50
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      ">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeHighlight, rehypeKatex, rehypeRaw]}
          components={{
            h1: ({node, ...props}) => {
              const text = props.children?.toString() || '';
              const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return <h1 id={id} {...props} />;
            },
            h2: ({node, ...props}) => {
              const text = props.children?.toString() || '';
              const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return (
                <h2 id={id} {...props}>
                  <span className="h-6 w-1 bg-primary rounded-full inline-block mr-2" />
                  {props.children}
                </h2>
              );
            },
            h3: ({node, ...props}) => {
              const text = props.children?.toString() || '';
              const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return <h3 id={id} {...props} />;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
