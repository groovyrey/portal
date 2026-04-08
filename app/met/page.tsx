import fs from 'fs';
import path from 'path';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';

export const metadata = {
  title: 'Project Methodology | LCC Hub',
  description: 'Detailed project methodology and action plan for LCC Hub.',
};

export default function MetPage() {
  const filePath = path.join(process.cwd(), 'public', 'met.md');
  const content = fs.readFileSync(filePath, 'utf8');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Internal Documentation</span>
        </div>
        <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">
          Project Methodology
        </h1>
        <p className="mt-4 text-lg text-muted-foreground font-medium max-w-2xl leading-relaxed">
          The following document outlines the technical framework, research approach, and execution strategy for the LCC Hub student portal.
        </p>
      </div>

      <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-8 lg:p-12 shadow-2xl">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
