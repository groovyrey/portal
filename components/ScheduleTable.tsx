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
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No schedule available</p>
      </div>
    );
  }

  // Parse time range like "07:00 AM-10:00 AM"
  const parseTimeRange = (timeStr: string) => {
    const timePart = timeStr.match(/(\d+:\d+\s*(?:AM|PM))\s*-\s*(\d+:\d+\s*(?:AM|PM))/i);
    if (!timePart) return null;

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

    const start = parseTime(timePart[1]);
    const end = parseTime(timePart[2]);
    return (start !== null && end !== null) ? { start, end } : null;
  };

  const getDays = (timeStr: string) => {
    // Extract the first three letters (day abbreviation)
    const dayAbbr = timeStr.substring(0, 3).toUpperCase();
    const found: string[] = [];

    switch (dayAbbr) {
      case 'MON':
        found.push('Monday');
        break;
      case 'TUE':
        found.push('Tuesday');
        break;
      case 'WED':
        found.push('Wednesday');
        break;
      case 'THU':
        found.push('Thursday');
        break;
      case 'FRI':
        found.push('Friday');
        break;
      case 'SAT':
        found.push('Saturday');
        break;
      case 'SUN':
        found.push('Sunday');
        break;
    }
    
    return found.length > 0 ? found : null;
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-50 bg-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Class Timetable</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Full Weekly View</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[1000px] table-fixed">
          <thead>
            <tr className="bg-slate-50/30">
              <th className="p-4 border-b border-r border-slate-100 w-24 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Time</th>
              {DAYS.map(day => (
                <th key={day} className="p-4 border-b border-r border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hourStr, hIdx) => {
              const currentHour = 7 + hIdx;
              return (
                <tr key={hourStr} className="h-28">
                  <td className="p-4 border-b border-r border-slate-100 text-center align-middle bg-slate-50/10">
                    <span className="text-[10px] font-black text-blue-600/70 uppercase tabular-nums">{hourStr}</span>
                  </td>
                  {DAYS.map(day => {
                    // Find classes that belong to this day and fall into this specific hour slot
                    const activeClasses = schedule.filter(item => {
                      const days = getDays(item.time);
                      const range = parseTimeRange(item.time);
                      if (!days || !range) return false;
                      
                      const matchesDay = days.includes(day);
                      // A class "occupies" this hour slot if it starts at or before this hour, and ends after it.
                      const occupiesSlot = currentHour >= Math.floor(range.start) && currentHour < Math.ceil(range.end);
                      
                      return matchesDay && occupiesSlot;
                    });

                    return (
                      <td key={day} className="p-1 border-b border-r border-slate-100 align-top relative">
                        {activeClasses.map((item, idx) => {
                          const range = parseTimeRange(item.time);
                          const isStartHour = range && Math.floor(range.start) === currentHour;
                          
                          // To avoid chaos, only render the card on the starting hour
                          if (!isStartHour) return null;

                          return (
                            <div 
                              key={idx} 
                              className={`rounded-2xl p-4 border shadow-sm transition-all hover:shadow-md cursor-default z-10 relative h-full flex flex-col
                                ${idx % 2 === 0 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}
                            >
                              <div className="text-[9px] font-black uppercase tracking-tighter mb-1 opacity-60">
                                {item.time.split(/\s+/) .slice(1).join(' ')}
                              </div>
                              <div className="text-[10px] font-black leading-tight mb-2 line-clamp-2 uppercase">{item.subject}</div>
                              <div className="mt-auto space-y-1">
                                <div className="text-[8px] font-bold uppercase truncate">{item.room}</div>
                                <div className="flex justify-between items-center text-[8px] font-black">
                                  <span className="opacity-40">{item.section}</span>
                                  <span className="bg-white/40 px-1.5 py-0.5 rounded border border-current/5">{item.units}U</span>
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
