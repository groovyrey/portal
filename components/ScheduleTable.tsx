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
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
        <p className="text-slate-400 text-sm">No classes found.</p>
      </div>
    );
  }

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
    const dayAbbr = timeStr.substring(0, 3).toUpperCase();
    const map: Record<string, string> = {
      'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday', 'THU': 'Thursday',
      'FRI': 'Friday', 'SAT': 'Saturday', 'SUN': 'Sunday'
    };
    return map[dayAbbr] ? [map[dayAbbr]] : null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px] table-fixed">
          <thead>
            <tr>
              <th className="w-16 py-3 bg-slate-50/50 border-b border-slate-100"></th>
              {DAYS.map(day => (
                <th key={day} className="py-3 px-2 bg-slate-50/50 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{day}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const cellSpans: number[] = Array(DAYS.length).fill(0);
              return HOURS.map((hourStr, hIdx) => {
                const currentHour = 7 + hIdx;

                return (
                  <tr key={hourStr}>
                    <td className="py-3 border-b border-slate-50 text-center">
                      <span className="text-[9px] font-bold text-slate-300 tabular-nums">{hourStr.split(' ')[0]}</span>
                    </td>
                    {DAYS.map((day, dayIdx) => {
                      if (cellSpans[dayIdx] > 0) {
                        cellSpans[dayIdx]--;
                        return null;
                      }

                      const classToRender = schedule.find(item => {
                        const days = getDays(item.time);
                        const range = parseTimeRange(item.time);
                        return days?.includes(day) && Math.floor(range?.start || 0) === currentHour;
                      });

                      if (classToRender) {
                        const range = parseTimeRange(classToRender.time);
                        const duration = range ? Math.ceil(range.end) - Math.floor(range.start) : 1;
                        if (duration > 1) cellSpans[dayIdx] = duration - 1;

                        return (
                          <td
                            key={day}
                            rowSpan={duration}
                            className="p-1 border-b border-slate-50 align-top"
                          >
                            <div className="h-full rounded-xl p-2.5 bg-slate-900 text-white flex flex-col transition-all hover:ring-2 hover:ring-blue-500 cursor-default">
                              <div className="text-[8px] font-medium opacity-60 mb-0.5 truncate">
                                {classToRender.time.split(/\s+/).slice(1).join(' ')}
                              </div>
                              <div className="text-[10px] font-bold leading-tight line-clamp-2 mb-1">
                                {classToRender.subject}
                              </div>
                              <div className="mt-auto flex justify-between items-center opacity-60 text-[8px] font-bold">
                                <span>{classToRender.room}</span>
                                <span>{classToRender.units}U</span>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      return <td key={day} className="p-0.5 border-b border-slate-50"></td>;
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
