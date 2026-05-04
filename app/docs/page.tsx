import React from 'react';
import { Zap, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-16 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-lg border border-primary/20">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Official Documentation</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Manual & Guide
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Learn how to make the most of your academic ecosystem.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Link>
          </Button>
        </header>

        <article className="prose prose-slate dark:prose-invert max-w-none">
            <MarkdownRenderer content={content} />
        </article>

        <Separator className="mt-20 mb-8" />
        
        <footer className="flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <p className="font-semibold uppercase tracking-widest text-primary">LCC Hub</p>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <Link href="/disclaimer" className="hover:text-primary transition-colors font-medium">Privacy Policy</Link>
            <Link href="/" className="hover:text-primary transition-colors font-medium">Student Portal</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DocsPage;
