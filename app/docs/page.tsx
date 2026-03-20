import React from 'react';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Comprehensive guide and manual for the LCC Hub ecosystem.',
};

const DocsPage: React.FC = () => {
  // Read the README.md file
  const filePath = path.join(process.cwd(), 'README.md');
  let content = '';
  
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error('Error reading README.md:', error);
    content = '# Error\nCould not load documentation.';
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-10">

        
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Official Guide</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-foreground uppercase italic">
            LCC Hub Manual
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed font-medium">
            A comprehensive guide to your new intelligent academic ecosystem. This documentation is automatically synchronized with the latest system updates.
          </p>
        </header>

        <MarkdownRenderer content={content} />

        <footer className="mt-40 pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary h-8 w-8 flex items-center justify-center rounded-lg text-white font-black italic">H</div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">
              LCC Hub &copy; {new Date().getFullYear()} • Intelligence Redefined
            </p>
          </div>
          <div className="flex gap-8">
            <Link href="/disclaimer" className="text-[10px] font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em]">Legal & Privacy</Link>
            <Link href="/" className="text-[10px] font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em]">Access Portal</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DocsPage;
