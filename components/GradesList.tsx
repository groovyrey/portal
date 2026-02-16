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
            const isActive = selectedSem === report.text;
            return (
              <button
                key={idx}
                onClick={() => fetchGrades(report.href, report.text)}
                className={`flex items-center justify-between p-4 rounded-xl text-xs font-bold transition-all border outline-none ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="uppercase tracking-wider">{report.text.replace('Grades of ', '')}</span>
                </div>
                <ChevronRight className={`h-4 w-4 transition-all ${isActive ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {selectedSem && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="px-8 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{selectedSem}</h4>
            </div>
            {loading && <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="animate-spin h-8 w-8 border-2 border-slate-200 border-t-blue-600 rounded-full mb-4"></div>
              <p className="text-[10px] font-bold uppercase tracking-widest">Loading Grades...</p>
            </div>
          ) : grades ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100">Section</th>
                    <th className="px-8 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</th>
                    <th className="px-8 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-x border-slate-100">Grade</th>
                    <th className="px-8 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grades.map((sub, sIdx) => {
                    const isPassed = sub.remarks.toLowerCase().includes('pass') || parseFloat(sub.grade) <= 3.0;
                    return (
                      <tr key={sIdx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4 whitespace-nowrap border-r border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500 font-mono">{sub.code}</span>
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-xs font-semibold text-slate-700 uppercase leading-tight">{sub.description}</p>
                        </td>
                        <td className="px-8 py-4 text-center border-x border-slate-100">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                            isPassed 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {sub.grade}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${
                              isPassed ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {sub.remarks}
                            </span>
                            {isPassed ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-rose-500" />
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
            <div className="text-center py-16 text-slate-400">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No records found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
