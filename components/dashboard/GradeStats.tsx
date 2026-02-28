import { SubjectGrade } from '@/types';
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
    <div className="space-y-4 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card p-5 rounded-2xl border border-border flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">GWA</span>
          <p className="text-2xl font-bold text-foreground tracking-tight">{gwa}</p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Pass Rate</span>
          <p className="text-2xl font-bold text-foreground tracking-tight">{passRate}%</p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Graded</span>
          <p className="text-2xl font-bold text-foreground tracking-tight">{allGrades.length}</p>
        </div>
      </div>

      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-6">Grade Distribution</h4>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="grade" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '10px',
                  fontWeight: 600
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#0f172a" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
