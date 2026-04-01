import { Student } from '@/types';
import { FileText, ChevronRight, BookOpenCheck } from 'lucide-react';
import Link from 'next/link';

interface GradesListProps {
  reports: Student['availableReports'];
}

export default function GradesList({ reports }: GradesListProps) {
  if (!reports) return null;

  return (
    <div className="space-y-6">
      <div className="surface-violet relative overflow-hidden rounded-2xl border border-border/80 p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <BookOpenCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground leading-none">Scholastic Registry</h3>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Academic Records</p>
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
              className="group flex items-center justify-between p-4 rounded-xl text-[13px] font-bold transition-all border outline-none bg-accent text-muted-foreground hover:bg-accent/80 border-border hover:border-muted-foreground/30"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="break-words text-left">{report.text.replace('Grades of ', '')}</span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 opacity-30 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
