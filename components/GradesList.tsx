import { useState } from 'react';
import { Student, SubjectGrade } from '../types';

interface GradesListProps {
  reports: Student['availableReports'];
  userId: string;
  password: string;
}

export default function GradesList({ reports, userId, password }: GradesListProps) {
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
        body: JSON.stringify({ href, userId, password }),
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

      <div className="flex flex-wrap gap-2 mb-8">
        {reports.map((report, idx) => (
          <button
            key={idx}
            onClick={() => fetchGrades(report.href, report.text)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedSem === report.text
                ? 'bg-green-600 text-white shadow-md scale-105'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {report.text.replace('Grades of ', '')}
          </button>
        ))}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {grades.map((sub, sIdx) => {
                const isPassed = sub.remarks.toLowerCase().includes('pass') || parseFloat(sub.grade) <= 3.0;
                return (
                  <div key={sIdx} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-green-200 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-green-600 transition-colors uppercase">{sub.code}</span>
                      <span className={`text-sm font-black px-2 py-0.5 rounded-lg ${
                        isPassed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {sub.grade}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 leading-tight mb-3 h-8 line-clamp-2">{sub.description}</p>
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-50">
                      <div className={`w-1.5 h-1.5 rounded-full ${isPassed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${
                        isPassed ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {sub.remarks}
                      </span>
                    </div>
                  </div>
                );
              })}
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
