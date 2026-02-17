import { useState } from 'react';
import { Student, SubjectGrade } from '../types';
import { 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  BookOpenCheck
} from 'lucide-react';
import Drawer from './Drawer';

interface GradesListProps {
  reports: Student['availableReports'];
}

export default function GradesList({ reports }: GradesListProps) {
  const [selectedSem, setSelectedSem] = useState<string | null>(null);
  const [grades, setGrades] = useState<SubjectGrade[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!reports) return null;

  const fetchGrades = async (href: string, title: string) => {
    setLoading(true);
    setSelectedSem(title);
    setIsDrawerOpen(true);
    setGrades(null);
    
    try {
      const response = await fetch('/api/student/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ href }), 
      });
      const result = await response.json();
      if (result.success) {
        setGrades(result.subjects);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Academic Records</h3>
            <p className="text-slate-500 text-xs font-medium mt-1">Select a semester to view your grades</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {reports.map((report, idx) => {
            const isActive = selectedSem === report.text && isDrawerOpen;
            return (
              <button
                key={idx}
                onClick={() => fetchGrades(report.href, report.text)}
                className={`flex items-center justify-between p-4 rounded-xl text-xs font-bold transition-all border outline-none ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="uppercase tracking-wider text-left">{report.text.replace('Grades of ', '')}</span>
                </div>
                <ChevronRight className={`h-4 w-4 transition-all ${isActive ? 'translate-x-1 opacity-100' : 'opacity-50'}`} />
              </button>
            );
          })}
        </div>
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedSem ? selectedSem.replace('Grades of ', '') : "Grades"}
      >
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Loading Academic Records...</p>
            </div>
          ) : grades ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-700">
                  <span>Subject Breakdown</span>
                  <span>{grades.length} Items</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {grades.map((sub, sIdx) => {
                  const isPassed = sub.remarks.toLowerCase().includes('pass') || parseFloat(sub.grade) <= 3.0;
                  return (
                    <div key={sIdx} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-start gap-4 mb-1">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-900 uppercase leading-tight mb-1">{sub.description}</p>
                          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">{sub.code}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${
                            isPassed 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {sub.grade}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        {isPassed ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-rose-500" />
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isPassed ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {sub.remarks}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No records found</p>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
