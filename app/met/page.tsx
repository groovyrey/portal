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
          <div className="h-1 w-1 rounded-full bg-primary" />
          <span className="text-xs font-medium text-muted-foreground">Internal Documentation</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Project Methodology
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-2xl leading-relaxed">
          The following document outlines the technical framework, research approach, and execution strategy for the LCC Hub student portal.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 lg:p-8">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
