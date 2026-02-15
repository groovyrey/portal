import { SubjectGrade } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface GradeStatsProps {
  allGrades: SubjectGrade[];
}

export default function GradeStats({ allGrades }: GradeStatsProps) {
  if (!allGrades || allGrades.length === 0) return null;

  // Filter out non-numeric grades for GWA calculation
  const numericGrades = allGrades
    .map(g => parseFloat(g.grade))
    .filter(g => !isNaN(g) && g > 0);

  const gwa = numericGrades.length > 0 
    ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(2)
    : 'N/A';

  const totalPassed = allGrades.filter(g => {
    const gLower = g.remarks.toLowerCase();
    return gLower.includes('pass') || (parseFloat(g.grade) <= 3.0 && parseFloat(g.grade) > 0);
  }).length;

  const passRate = ((totalPassed / allGrades.length) * 100).toFixed(0);

  // Prepare data for Grade Distribution Chart
  const gradeCounts: { [key: string]: number } = {};
  numericGrades.forEach(g => {
    const label = g.toFixed(1);
    gradeCounts[label] = (gradeCounts[label] || 0) + 1;
  });

  const chartData = Object.entries(gradeCounts)
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => parseFloat(a.grade) - parseFloat(b.grade));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-blue-200 transition-all">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">General Weighted Avg</span>
          <p className="text-3xl font-black text-blue-600 tracking-tight">{gwa}</p>
          <div className="mt-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded-full uppercase">Academic Standing</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-green-200 transition-all">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass Rate</span>
          <p className="text-3xl font-black text-green-600 tracking-tight">{passRate}%</p>
          <div className="mt-2 px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold rounded-full uppercase">
            {totalPassed} Passed / {allGrades.length} Total
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-orange-200 transition-all">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completion</span>
          <p className="text-3xl font-black text-orange-600 tracking-tight">{allGrades.length}</p>
          <div className="mt-2 px-2 py-0.5 bg-orange-50 text-orange-600 text-[9px] font-bold rounded-full uppercase">Total Subjects Graded</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          Grade Distribution
        </h4>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="grade" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={30}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
