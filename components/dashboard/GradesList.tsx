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
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <BookOpenCheck size={140} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 border border-blue-500">
                <BookOpenCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Scholastic Registry</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">Official Academic Records</p>
              </div>
            </div>
  
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report, idx) => {
                const isActive = selectedSem === report.text && isDrawerOpen;
                return (
                  <button
                    key={idx}
                    onClick={() => handleOpenReport(report.href, report.text)}
                    className={`group flex items-center justify-between p-5 rounded-2xl text-xs font-black transition-all border outline-none ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-400 group-hover:text-blue-600 group-hover:scale-110 shadow-sm'}`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="uppercase tracking-widest text-left leading-tight">{report.text.replace('Grades of ', '')}</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-all duration-300 ${isActive ? 'translate-x-1 opacity-100' : 'opacity-30 group-hover:opacity-100 group-hover:translate-x-1'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
  
        <Drawer
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          title={selectedSem ? selectedSem.replace('Grades of ', '') : "Grades"}
        >
          <div className="space-y-8">
            {loading ? (
              <div className="space-y-6">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-5 border border-slate-100 rounded-2xl flex justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-10 w-14 rounded-xl" />
                    </div>
                  ))}
                </div>
              </div>
            ) : grades ? (
              <div className="space-y-6">
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl shadow-slate-200/50">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Semester Statistics
                    </div>
                    <span className="bg-slate-800 px-2 py-1 rounded text-white">{grades.length} Subjects</span>
                  </div>
                </div>
  
                <div className="space-y-3">
                  {grades.map((sub, sIdx) => {
                    const isPassed = sub.remarks.toLowerCase().includes('pass') || (parseFloat(sub.grade) <= 3.0 && parseFloat(sub.grade) > 0);
                    return (
                      <div key={sIdx} className="group p-5 bg-white border border-slate-100 rounded-2xl transition-all hover:border-blue-200 hover:shadow-md hover:shadow-slate-100">
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 uppercase leading-snug mb-1 group-hover:text-blue-600 transition-colors">{sub.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 font-mono tracking-widest bg-slate-50 px-1.5 py-0.5 rounded uppercase">{sub.code}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-lg font-black px-4 py-2 rounded-xl shadow-sm border ${
                              isPassed
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {sub.grade}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              isPassed ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {sub.remarks}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Recorded</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No records synchronized</p>
              </div>
            )}
          </div>
        </Drawer>
      </div>
    );
  }
