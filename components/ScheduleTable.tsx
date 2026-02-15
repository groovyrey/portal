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
    const found = new Set<string>();

    const dayCodeMap: { [key: string]: string } = {
      'M': 'Monday',
      'T': 'Tuesday',
      'W': 'Wednesday',
      'R': 'Thursday', // 'R' is often used for Thursday in schedules
      'TH': 'Thursday',
      'F': 'Friday',
      'S': 'Saturday',
      'U': 'Sunday', // 'U' is sometimes used for Sunday
      'SU': 'Sunday',
      'SUN': 'Sunday',
    };

    // Prioritize checking for known multi-day codes or longer codes first
    // This helps avoid 'T' matching for 'TH' or 'TTH'
    if (ts.includes('MWF')) {
      found.add('Monday');
      found.add('Wednesday');
      found.add('Friday');
    }
    if (ts.includes('TTH')) {
      found.add('Tuesday');
      found.add('Thursday');
    }
    if (ts.includes('SUN')) {
      found.add('Sunday');
    }

    // Now check for individual day codes, ensuring they haven't been added by multi-day codes
    // Or if the time string only contains individual codes (e.g., "MTH")
    if (ts.includes('M') && !found.has('Monday')) found.add('Monday');
    if (ts.includes('W') && !found.has('Wednesday')) found.add('Wednesday');
    if (ts.includes('F') && !found.has('Friday')) found.add('Friday');
    
    // Handle 'TH' and 'T' carefully to avoid 'T' being matched for Thursday
    if (ts.includes('TH') && !found.has('Thursday')) {
      found.add('Thursday');
    } else if (ts.includes('T') && !found.has('Tuesday') && !found.has('Thursday')) { 
      // Only add Tuesday if 'TTH' and 'TH' were not found, and Tuesday isn't already added
      found.add('Tuesday');
    }

    // Handle 'R' as an alternative for Thursday
    if (ts.includes('R') && !found.has('Thursday')) {
      found.add('Thursday');
    }

    // Handle 'S' for Saturday, if 'SUN' or 'SU' was not found for Sunday
    if (ts.includes('S') && !found.has('Saturday') && !found.has('Sunday')) {
      found.add('Saturday');
    }
    // Handle 'U' or 'SU' for Sunday if 'SUN' wasn't matched
    if (ts.includes('U') && !found.has('Sunday')) {
      // Check for 'SU' specifically to avoid 'U' from other contexts
      if (ts.includes('SU')) {
        found.add('Sunday');
      }
    }


    return found.size > 0 ? Array.from(found) : null;
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
            {/* Initialize cellSpans outside the HOURS.map to persist state across rows */}
            {(() => {
              const cellSpans: number[] = Array(DAYS.length).fill(0);
              return HOURS.map((hourStr, hIdx) => {
                const currentHour = 7 + hIdx; // Assuming 7 AM is the start hour for the table

                return (
                  <tr key={hourStr}>
                    <td className="p-4 border-b border-r border-slate-100 text-center align-middle bg-slate-50/10">
                      <span className="text-[10px] font-black text-blue-600/70 uppercase tabular-nums">{hourStr}</span>
                    </td>
                    {DAYS.map((day, dayIdx) => {
                      // If the current cell is part of a rowspan from a previous hour, skip rendering
                      if (cellSpans[dayIdx] > 0) {
                        cellSpans[dayIdx]--;
                        return null; // Skip rendering this td, it's covered by a rowspan
                      }

                      // Find classes that start at this specific hour and day
                      const startingClasses = schedule.filter(item => {
                        const days = getDays(item.time);
                        const range = parseTimeRange(item.time);
                        if (!days || !range) return false;

                        const matchesDay = days.includes(day);
                        const startsAtCurrentHour = Math.floor(range.start) === currentHour;

                        return matchesDay && startsAtCurrentHour;
                      });

                      // For simplicity, let's assume one class per slot. If multiple, it will only render the first.
                      const classToRender = startingClasses[0];

                      if (classToRender) {
                        const range = parseTimeRange(classToRender.time);
                        const durationInHours = range ? Math.ceil(range.end) - Math.floor(range.start) : 1;

                        // Update cellSpans for this day
                        if (durationInHours > 1) {
                          cellSpans[dayIdx] = durationInHours - 1; // Mark subsequent cells as spanned
                        }

                        return (
                          <td
                            key={day}
                            rowSpan={durationInHours > 0 ? durationInHours : 1}
                            className="p-1 border-b border-r border-slate-100 align-top relative"
                          >
                            <div
                              className={`rounded-2xl p-4 border shadow-sm transition-all hover:shadow-md cursor-default z-10 relative h-full flex flex-col
                                ${dayIdx % 2 === 0 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}
                            >
                              <div className="text-[9px] font-black uppercase tracking-tighter mb-1 opacity-60">
                                {classToRender.time.split(/\s+/) .slice(1).join(' ')}
                              </div>
                              <div className="text-[10px] font-black leading-tight mb-2 line-clamp-2 uppercase">{classToRender.subject}</div>
                              <div className="mt-auto space-y-1">
                                <div className="text-[8px] font-bold uppercase truncate">{classToRender.room}</div>
                                <div className="flex justify-between items-center text-[8px] font-black">
                                  <span className="opacity-40">{classToRender.section}</span>
                                  <span className="bg-white/40 px-1.5 py-0.5 rounded border border-current/5">{classToRender.units}U</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        );
                      } else {
                        // Render an empty cell if no class starts here and it's not spanned
                        return (
                          <td key={day} className="p-1 border-b border-r border-slate-100 align-top relative">
                            {/* Empty cell */}
                          </td>
                        );
                      }
                    })}
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
