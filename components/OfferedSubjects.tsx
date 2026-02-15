import { ProspectusSubject } from '../types';

interface OfferedSubjectsProps {
  subjects: ProspectusSubject[];
}

export default function OfferedSubjects({ subjects }: OfferedSubjectsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.991 7.991 0 0112 4c1.236 0 2.383.279 3.406.776a1 1 0 01.594.898v8.292a1 1 0 01-1.406.913A7.942 7.942 0 0012 14c-1.108 0-2.152.226-3.097.632L9 4.804zM8 4.804A7.991 7.991 0 005 4c-1.236 0-2.383.279-3.406.776a1 1 0 00-.594.898v8.292a1 1 0 001.406.913A7.942 7.942 0 015 14c1.108 0 2.152.226 3.097.632L8 4.804z" />
          </svg>
          Currently Offered Subjects
        </h3>
        <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-md border border-blue-100 uppercase tracking-tighter">
          {subjects.length} Subjects
        </span>
      </div>

      <div className="overflow-x-auto -mx-6 sm:mx-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Units</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Pre-requisite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {subjects.map((sub, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-[10px] font-black text-slate-500 group-hover:text-blue-600 transition-colors">{sub.code}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-slate-700 leading-tight">{sub.description}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {sub.units}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-[10px] font-bold text-slate-400 italic">
                    {sub.preReq || 'None'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
