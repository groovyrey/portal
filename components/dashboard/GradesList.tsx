import { Student } from '@/types';
import { FileText, ChevronRight, BookOpenCheck } from 'lucide-react';
import Link from 'next/link';

interface GradesListProps {
  reports: Student['availableReports'];
}

export default function GradesList({ reports }: GradesListProps) {
  if (!reports) return null;

  return (
    <div className="space-y-4">
      <div className="surface-neutral relative overflow-hidden rounded-xl border border-border/50 p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center border border-primary/20">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground uppercase tracking-tight leading-none">Scholastic Registry</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">Academic Archives</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((report, idx) => (
            <Link
              key={idx}
              href={{
                pathname: '/grades/report',
                query: {
                  href: report.href,
                  title: report.text,
                },
              }}
              className="group flex items-center justify-between p-4 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border border-border/50 bg-muted/5 text-muted-foreground hover:bg-muted/10 hover:text-foreground hover:border-primary/30"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-primary/40 group-hover:text-primary transition-colors" />
                <span className="truncate">{report.text.replace('Grades of ', '')}</span>
              </div>
              <ChevronRight className="h-3 w-3 shrink-0 opacity-20 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
