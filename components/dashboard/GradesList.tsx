import { Student } from '@/types';
import { FileText, ChevronRight, BookOpenCheck } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface GradesListProps {
  reports: Student['availableReports'];
}

export default function GradesList({ reports }: GradesListProps) {
  if (!reports) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <BookOpenCheck className="h-5 w-5 text-muted-foreground" />
        <div>
          <CardTitle>Reports</CardTitle>
          <CardDescription>Select a semester to view detailed grades</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className="group flex items-center justify-between p-4 rounded-md border border-border bg-background hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-sm font-medium truncate">{report.text.replace('Grades of ', '')}</span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
