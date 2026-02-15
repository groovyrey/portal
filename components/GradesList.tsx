import { useState } from 'react';
import { Student, SubjectGrade } from '../types';

interface GradesListProps {
  reports: Student['availableReports'];
}

export default function GradesList({ reports }: GradesListProps) {
  const [selectedSem, setSelectedSem] = useState<string | null>(null);
  const [grades, setGrades] = useState<SubjectGrade[] | null>(null);
  const [debugSnippet, setDebugSnippet] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!reports) return null;

  const fetchGrades = async (href: string, title: string) => {
    setLoading(true);
    setSelectedSem(title);
    setGrades(null);
    setDebugSnippet(null);
    
    try {
      const response = await fetch('/api/student/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ href }), // Credentials handled by session cookie
      });
      const result = await response.json();
      if (result.success) {
        setGrades(result.subjects);
        setDebugSnippet(result.raw_snippet);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Academic Report Cards
      </h3>

      <div className="flex flex-col gap-2 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {reports.map((report, idx) => {
          const isActive = selectedSem === report.text;
          return (
            <button
              key={idx}
              onClick={() => fetchGrades(report.href, report.text)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? 'bg-green-600 text-white shadow-md border-green-500'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>{report.text.replace('Grades of ', '')}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isActive ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          );
        })}
      </div>

      {selectedSem && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{selectedSem}</h4>
            <div className="h-px flex-1 bg-slate-100"></div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-12 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
              <p className="text-sm font-medium">Fetching grades from portal...</p>
            </div>
          ) : grades ? (
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Section</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Grade</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {grades.map((sub, sIdx) => {
                    const isPassed = sub.remarks.toLowerCase().includes('pass') || parseFloat(sub.grade) <= 3.0;
                    return (
                      <tr key={sIdx} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-[10px] font-black text-slate-500 group-hover:text-blue-600 transition-colors">{sub.code}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-700 leading-tight">{sub.description}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                            isPassed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {sub.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isPassed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${
                              isPassed ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {sub.remarks}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p>Unable to retrieve grades for this semester.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
