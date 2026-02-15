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
    const ts = timeStr.toUpperCase().split(/\d/)[0].trim(); // Get only the prefix (days)
    const found: string[] = [];

    if (ts.includes('MWF')) {
      found.push('Monday', 'Wednesday', 'Friday');
    } else if (ts.includes('TTH')) {
      found.push('Tuesday', 'Thursday');
    } else {
      if (ts.includes('M')) found.push('Monday');
      if (ts.includes('W')) found.push('Wednesday');
      if (ts.includes('F')) found.push('Friday');
      if (ts.includes('TH')) {
          found.push('Thursday');
      } else if (ts.includes('T')) {
          // If it has T but not TH
          found.push('Tuesday');
      }
      if (ts.includes('S')) {
          if (ts.includes('SUN')) found.push('Sunday');
          else found.push('Saturday');
      }
    }
    
    return found.length > 0 ? Array.from(new Set(found)) : null;
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-50 bg-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Class Schedule</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Simple View</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50/30">
              <th className="p-4 border-b border-r border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Subject</th>
              <th className="p-4 border-b border-r border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Section</th>
              <th className="p-4 border-b border-r border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Units</th>
              <th className="p-4 border-b border-r border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Time</th>
              <th className="p-4 border-b border-r border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Room</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((item, index) => (
              <tr key={index} className="h-16">
                <td className="p-4 border-b border-r border-slate-100 text-left">
                  <div className="text-[10px] font-bold text-slate-700">{item.subject}</div>
                </td>
                <td className="p-4 border-b border-r border-slate-100 text-left">
                  <div className="text-[10px] font-medium text-slate-600">{item.section}</div>
                </td>
                <td className="p-4 border-b border-r border-slate-100 text-left">
                  <div className="text-[10px] font-medium text-slate-600">{item.units}</div>
                </td>
                <td className="p-4 border-b border-r border-slate-100 text-left">
                  <div className="text-[10px] font-medium text-slate-600">{item.time}</div>
                </td>
                <td className="p-4 border-b border-r border-slate-100 text-left">
                  <div className="text-[10px] font-medium text-slate-600">{item.room}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
