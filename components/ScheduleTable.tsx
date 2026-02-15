import { ScheduleItem } from '../types';

interface ScheduleTableProps {
  schedule: ScheduleItem[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_MAP: { [key: string]: string } = {
  'M': 'Monday',
  'T': 'Tuesday',
  'W': 'Wednesday',
  'TH': 'Thursday',
  'F': 'Friday',
  'S': 'Saturday',
  'MON': 'Monday',
  'TUE': 'Tuesday',
  'WED': 'Wednesday',
  'THU': 'Thursday',
  'FRI': 'Friday',
  'SAT': 'Saturday',
};

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

  // Parse schedule into a map for the week view
  const weekSchedule: { [day: string]: any[] } = {};
  DAYS.forEach(day => weekSchedule[day] = []);

  schedule.forEach(item => {
    const timeStr = item.time.toUpperCase();
    
    // Try to find days
    const foundDays: string[] = [];
    
    // Check for common patterns like "MWF", "TTH", "M/W/F"
    if (timeStr.includes('TTH')) {
      foundDays.push('Tuesday', 'Thursday');
    } else if (timeStr.includes('MWF')) {
      foundDays.push('Monday', 'Wednesday', 'Friday');
    } else {
      // Individual day detection
      Object.keys(DAY_MAP).forEach(key => {
        // Use regex to avoid partial matches (e.g., 'T' in 'TTH')
        const regex = new RegExp(`\\b${key}\\b|${key}(?=[^A-Z]|$)`);
        if (regex.test(timeStr)) {
          if (!foundDays.includes(DAY_MAP[key])) {
             // Avoid adding T if TTH was already handled or similar
             if (!(key === 'T' && (timeStr.includes('TH') || timeStr.includes('TUE'))) &&
                 !(key === 'TH' && timeStr.includes('THU'))) {
                foundDays.push(DAY_MAP[key]);
             }
          }
        }
      });
      
      // Fallback for compact formats like "MTWHF"
      if (foundDays.length === 0) {
        if (timeStr.includes('M')) foundDays.push('Monday');
        if (timeStr.includes('T') && !timeStr.includes('TH')) foundDays.push('Tuesday');
        if (timeStr.includes('W')) foundDays.push('Wednesday');
        if (timeStr.includes('TH')) foundDays.push('Thursday');
        if (timeStr.includes('F')) foundDays.push('Friday');
        if (timeStr.includes('S')) foundDays.push('Saturday');
      }
    }

    foundDays.forEach(day => {
      weekSchedule[day].push(item);
    });
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 bg-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Weekly Schedule</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Class Time & Locations</p>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-2xl">
            <span className="text-blue-600 text-xs font-black uppercase tracking-tighter">{schedule.length} Subjects</span>
          </div>
        </div>

        {/* Desktop Weekly Grid */}
        <div className="hidden lg:block overflow-x-auto">
          <div className="min-w-[800px] p-6">
            <div className="grid grid-cols-6 gap-4">
              {DAYS.map(day => (
                <div key={day} className="space-y-4">
                  <div className="text-center py-2 border-b-2 border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day.substring(0, 3)}</span>
                  </div>
                  <div className="space-y-3 min-h-[400px]">
                    {weekSchedule[day].length > 0 ? (
                      weekSchedule[day].sort((a, b) => a.time.localeCompare(b.time)).map((item, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                          <div className="text-[10px] font-black text-blue-600 uppercase tracking-tighter mb-1">{item.time.split(' ').slice(-1)[0] === item.time ? item.time : item.time.split(/^[A-Z/ ]+/i)[1] || item.time}</div>
                          <div className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-700">{item.subject}</div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100">{item.room}</span>
                            <span className="text-[9px] font-mono text-slate-300">{item.units}U</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full border-2 border-dashed border-slate-50 rounded-2xl flex items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">No Class</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile List View */}
        <div className="lg:hidden divide-y divide-slate-50">
          {DAYS.map(day => weekSchedule[day].length > 0 && (
            <div key={day} className="p-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                {day}
              </h3>
              <div className="space-y-4">
                {weekSchedule[day].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-20 shrink-0">
                      <div className="text-[10px] font-black text-blue-600 uppercase tabular-nums">
                         {item.time.split(/^[A-Z/ ]+/i)[1] || item.time}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800 leading-snug">{item.subject}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-slate-400">{item.room}</span>
                        <span className="text-[10px] font-mono text-slate-300">{item.units} Units</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
