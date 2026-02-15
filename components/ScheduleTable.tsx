import { ScheduleItem } from '../types';

interface ScheduleTableProps {
  schedule: ScheduleItem[];
}

export default function ScheduleTable({ schedule }: ScheduleTableProps) {
  if (!schedule || schedule.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-slate-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-slate-500 font-medium">No schedule available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          Class Schedule
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
              <th className="px-6 py-3 border-b border-slate-200">Subject</th>
              <th className="px-6 py-3 border-b border-slate-200">Time</th>
              <th className="px-6 py-3 border-b border-slate-200">Room</th>
              <th className="px-6 py-3 border-b border-slate-200 text-right hidden lg:table-cell">Units</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schedule.map((item, index) => (
              <tr 
                key={index} 
                className="hover:bg-blue-50 transition-colors duration-150 group"
              >
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800 text-sm">{item.subject}</div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">{item.section}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-slate-600 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item.time}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                    {item.room}
                  </span>
                </td>
                <td className="px-6 py-4 text-right hidden lg:table-cell text-sm text-slate-500 font-mono">
                  {item.units}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
