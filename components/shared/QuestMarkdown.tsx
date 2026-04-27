'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface QuestMarkdownProps {
  content: string;
  className?: string;
}

export default function QuestMarkdown({ content, className = "" }: QuestMarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        className="prose prose-slate dark:prose-invert max-w-none prose-p:my-0 prose-p:leading-normal"
        components={{
          p: ({children}) => <span className="inline-block">{children}</span>,
          code: ({node, inline, className, children, ...props}: any) => {
            return (
              <code className={`${className} bg-primary/10 text-primary rounded px-1 font-mono text-[0.9em]`} {...props}>
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
