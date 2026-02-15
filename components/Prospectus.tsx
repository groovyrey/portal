import { useState } from 'react';
import { Student } from '../types';

interface ProspectusProps {
  prospectus: Student['prospectus'];
}

export default function Prospectus({ prospectus }: ProspectusProps) {
  const [search, setSearch] = useState('');
  
  if (!prospectus) return null;

  const filteredProspectus = prospectus.map(year => ({
    ...year,
    semesters: year.semesters.map(sem => ({
      ...sem,
      subjects: sem.subjects.filter(sub => 
        sub.code.toLowerCase().includes(search.toLowerCase()) || 
        sub.description.toLowerCase().includes(search.toLowerCase())
      )
    })).filter(sem => sem.subjects.length > 0)
  })).filter(year => year.semesters.length > 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
          Course Prospectus
        </h3>
        
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      <div className="space-y-8">
        {filteredProspectus.length > 0 ? filteredProspectus.map((year, yIdx) => (
          <div key={yIdx} className="border-l-2 border-slate-100 pl-4 ml-2">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">{year.year}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {year.semesters.map((sem, sIdx) => (
                <div key={sIdx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <h5 className="text-[10px] font-black text-indigo-600 mb-4 uppercase tracking-tighter">{sem.semester}</h5>
                  <div className="space-y-3">
                    {sem.subjects.map((sub, subIdx) => (
                      <div key={subIdx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md group">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-[10px] font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{sub.code}</span>
                          <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{sub.units} Units</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium leading-snug">{sub.description}</p>
                        {sub.preReq && sub.preReq !== 'None' && (
                          <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-1.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Pre-req:</span>
                            <span className="text-[9px] font-bold text-slate-500">{sub.preReq}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">No subjects match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

