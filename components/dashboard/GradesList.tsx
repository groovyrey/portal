import { useState, useEffect } from 'react';
import { Student, SubjectGrade } from '@/types';
import { 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  BookOpenCheck
} from 'lucide-react';
import Drawer from '@/components/layout/Drawer';
import Skeleton from '@/components/ui/Skeleton';
import { useQuery } from '@tanstack/react-query';

interface GradesListProps {
  reports: Student['availableReports'];
}

export default function GradesList({ reports }: GradesListProps) {
  const [selectedHref, setSelectedHref] = useState<string | null>(null);
  const [selectedSem, setSelectedSem] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: grades, isLoading: loading } = useQuery({
    queryKey: ['grades', selectedHref],
    queryFn: async () => {
      if (!selectedHref) return null;
      const response = await fetch('/api/student/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          href: selectedHref,
          reportName: selectedSem // Pass the report name (e.g., "Grades of...")
        }), 
      });
      const result = await response.json();
      return result.success ? (result.subjects as SubjectGrade[]) : null;
    },
    enabled: !!selectedHref,
  });

  const handleOpenReport = (href: string, title: string) => {
    setSelectedHref(href);
    setSelectedSem(title);
    setIsDrawerOpen(true);
  };

  // Reset selected state after drawer closes (with animation delay)
  useEffect(() => {
    if (!isDrawerOpen) {
      const timer = setTimeout(() => {
        setSelectedSem(null);
        setSelectedHref(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isDrawerOpen]);

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  if (!reports) return null;

    return (
      <div className="space-y-6">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
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
            {reports.map((report, idx) => {
              const isActive = selectedSem === report.text && isDrawerOpen;
              return (
                <button
                  key={idx}
                  onClick={() => handleOpenReport(report.href, report.text)}
                  className={`group flex items-center justify-between p-4 rounded-xl text-[13px] font-bold transition-all border outline-none ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-accent text-muted-foreground hover:bg-accent/80 border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    <span className="truncate">{report.text.replace('Grades of ', '')}</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 ${isActive ? 'opacity-100' : 'opacity-30 group-hover:opacity-100'}`} />
                </button>
              );
            })}
          </div>
        </div>
  
        <Drawer
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          title={selectedSem ? selectedSem.replace('Grades of ', '') : "Grades"}
        >
          <div className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 border border-border rounded-xl flex justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-8 w-12 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            ) : grades ? (
              <div className="space-y-6">
                <div className="bg-secondary p-4 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Semester Summary</span>
                    <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded shadow-sm">{grades.length} Subjects</span>
                  </div>
                </div>
  
                <div className="space-y-2">
                  {grades.map((sub, sIdx) => {
                    const isPassed = sub.remarks.toLowerCase().includes('pass') || (parseFloat(sub.grade) <= 3.0 && parseFloat(sub.grade) > 0);
                    return (
                      <div key={sIdx} className="p-4 bg-card border border-border rounded-xl hover:border-muted-foreground transition-all">
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground uppercase leading-snug truncate">{sub.description}</p>
                            <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase">{sub.code}</span>
                          </div>
                          <div className={`text-base font-bold px-3 py-1 rounded-lg border ${
                            isPassed
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/50'
                          }`}>
                            {sub.grade}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                              isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {sub.remarks}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-accent rounded-xl border border-dashed border-border">
                <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">No records available</p>
              </div>
            )}
          </div>
        </Drawer>
      </div>
    );
  }
