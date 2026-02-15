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

interface GradesListProps {
  reports: Student['availableReports'];
}

export default function GradesList({ reports }: GradesListProps) {
  const [selectedSem, setSelectedSem] = useState<string | null>(null);
  const [grades, setGrades] = useState<SubjectGrade[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (!reports) return null;

  const fetchGrades = async (href: string, title: string) => {
    setLoading(true);
    setSelectedSem(title);
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
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-inner">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Academic Records</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Report Card Selection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {reports.map((report, idx) => {
            const isActive = selectedSem === report.text;
            return (
              <button
                key={idx}
                onClick={() => fetchGrades(report.href, report.text)}
                className={`group flex items-center justify-between p-4 rounded-2xl text-xs font-black transition-all border outline-none ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200 scale-[1.02]'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-sm'}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="uppercase tracking-widest">{report.text.replace('Grades of ', '')}</span>
                </div>
                <ChevronRight className={`h-4 w-4 transition-all ${isActive ? 'translate-x-1 opacity-100' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {selectedSem && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">{selectedSem}</h4>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Detailed Subject Breakdown</p>
            </div>
            {loading && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <div className="relative mb-4">
                <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Grades...</p>
            </div>
          ) : grades ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">Code</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Subject Description</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-x border-slate-100/50">Grade</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {grades.map((sub, sIdx) => {
                    const isPassed = sub.remarks.toLowerCase().includes('pass') || parseFloat(sub.grade) <= 3.0;
                    return (
                      <tr key={sIdx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5 whitespace-nowrap border-r border-slate-100/50">
                          <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-600 transition-colors font-mono">{sub.code}</span>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{sub.description}</p>
                        </td>
                        <td className="px-8 py-5 text-center border-x border-slate-100/50">
                          <span className={`text-xs font-black px-3 py-1.5 rounded-xl transition-all ${
                            isPassed 
                              ? 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-700 group-hover:bg-rose-100'
                          }`}>
                            {sub.grade}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                              isPassed ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {sub.remarks}
                            </span>
                            {isPassed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-rose-500" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <div className="bg-slate-50 h-16 w-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-slate-200" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">No records found for this period</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
