import { ScheduleItem } from '../types';

interface ScheduleTableProps {
  schedule: ScheduleItem[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
  '7:00 PM', '8:00 PM', '9:00 PM'
];

export default function ScheduleTable({ schedule }: ScheduleTableProps) {
  if (!schedule || schedule.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-slate-100">
        <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No schedule available</p>
      </div>
    );
  }

  // Helper to parse time string like "7:00 AM - 10:00 AM"
  const parseTimeRange = (timeStr: string) => {
    const parts = timeStr.split(/-/).map(s => s.trim());
    if (parts.length < 2) return null;

    const parseTime = (t: string) => {
      const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hour !== 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      return hour + minute / 60;
    };

    const start = parseTime(parts[0]);
    const end = parseTime(parts[1]);
    return (start !== null && end !== null) ? { start, end } : null;
  };

  const getDays = (timeStr: string) => {
    const ts = timeStr.toUpperCase();
    const found: string[] = [];
    if (ts.includes('TTH')) return ['Tuesday', 'Thursday'];
    if (ts.includes('MWF')) return ['Monday', 'Wednesday', 'Friday'];
    
    if (/\bM\b|M(?=[^A-Z])/.test(ts)) found.push('Monday');
    if (/\bT\b|T(?=[^H])/.test(ts)) found.push('Tuesday');
    if (/\bW\b/.test(ts)) found.push('Wednesday');
    if (/\bTH\b/.test(ts)) found.push('Thursday');
    if (/\bF\b/.test(ts)) found.push('Friday');
    if (/\bS\b/.test(ts)) found.push('Saturday');
    if (/\bSUN\b|SUNDAY/.test(ts)) found.push('Sunday');

    return found.length > 0 ? found : null;
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-50 bg-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Class Timetable</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Full Weekly View</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100/50">
          <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest">{schedule.length} Subjects</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[1000px] table-fixed">
          <thead>
            <tr className="bg-slate-50/30">
              <th className="p-4 border-b border-r border-slate-100 w-24 text-[9px] font-black text-slate-400 uppercase tracking-widest">Time</th>
              {DAYS.map(day => (
                <th key={day} className="p-4 border-b border-r border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hourStr, hIdx) => {
              const currentHour = 7 + hIdx; // Starts at 7 AM
              return (
                <tr key={hourStr} className="h-28 group">
                  <td className="p-4 border-b border-r border-slate-100 text-center align-top bg-slate-50/10">
                    <span className="text-[10px] font-black text-blue-600/70 uppercase tabular-nums group-hover:text-blue-600 transition-colors">{hourStr}</span>
                  </td>
                  {DAYS.map(day => {
                    const activeClasses = schedule.filter(item => {
                      const days = getDays(item.time);
                      const range = parseTimeRange(item.time);
                      if (!days || !range) return false;
                      // Logic: Check if the day matches and the current hour falls within the class duration
                      return days.includes(day) && currentHour >= Math.floor(range.start) && currentHour < Math.ceil(range.end);
                    });

                    return (
                      <td key={day} className="p-1.5 border-b border-r border-slate-100 align-top relative hover:bg-slate-50/50 transition-colors">
                        {activeClasses.map((item, idx) => {
                          const range = parseTimeRange(item.time);
                          // Only render the detailed card if it's the START hour of the class
                          const isStart = range && Math.floor(range.start) === currentHour;
                          
                          if (!isStart) {
                            return (
                               <div key={idx} className={`absolute inset-0 m-1 rounded-lg opacity-20 ${idx % 2 === 0 ? 'bg-blue-200' : 'bg-indigo-200'}`}></div>
                            );
                          }

                          return (
                            <div 
                              key={idx} 
                              className={`rounded-2xl p-4 border shadow-sm h-full flex flex-col justify-start transition-all hover:scale-[1.02] hover:shadow-md cursor-default z-10 relative
                                ${idx % 2 === 0 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}
                            >
                              <div className="text-[9px] font-black uppercase tracking-tighter mb-1.5 opacity-60">
                                {item.time.split(/^[A-Z/ ]+/i)[1] || item.time}
                              </div>
                              <div className="text-[11px] font-black leading-tight mb-3 line-clamp-2 uppercase tracking-tight">{item.subject}</div>
                              <div className="mt-auto flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-current opacity-30"></div>
                                    <span className="text-[9px] font-bold uppercase tracking-tight">
                                      {item.room}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[8px] font-black uppercase opacity-40">{item.section}</span>
                                  <span className="text-[8px] font-mono font-black bg-white/40 px-1.5 py-0.5 rounded-lg border border-current/5">{item.units}U</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
