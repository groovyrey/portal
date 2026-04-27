import { SubjectGrade } from '@/types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, TrendingUp, Award, AlertCircle, BookOpen, Zap } from 'lucide-react';

type ExtendedGrade = SubjectGrade & { semester?: string };

interface GradeStatsProps {
  allGrades: ExtendedGrade[];
}

export default function GradeStats({ allGrades }: GradeStatsProps) {
  const [showGwa, setShowGwa] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hide_gwa');
    if (saved === 'false') setShowGwa(true);
  }, []);

  const toggleGwa = () => {
    const newValue = !showGwa;
    setShowGwa(newValue);
    localStorage.setItem('hide_gwa', (!newValue).toString());
  };

  if (!allGrades || allGrades.length === 0) return null;

  // Filter out non-numeric grades
  const numericGrades = allGrades
    .map(g => ({ ...g, val: parseFloat(g.grade) }))
    .filter(g => !isNaN(g.val) && g.val > 0);

  // Detect Scale
  const isPercentageScale = numericGrades.some(g => g.val > 5.0);

  // Overall GWA (Weighted by Units)
  let totalWeightedGrades = 0;
  let totalGwaUnits = 0;

  numericGrades.forEach(g => {
    const u = parseFloat(g.units || '0');
    if (!isNaN(u) && u > 0) {
      totalWeightedGrades += (g.val * u);
      totalGwaUnits += u;
    }
  });

  const gwa = totalGwaUnits > 0 
    ? (totalWeightedGrades / totalGwaUnits).toFixed(2)
    : (numericGrades.length > 0 
        ? (numericGrades.reduce((a, b) => a + b.val, 0) / numericGrades.length).toFixed(2)
        : 'N/A');

  // Pass Rate
  const totalPassed = allGrades.filter(g => {
    const gLower = g.remarks.toLowerCase();
    const val = parseFloat(g.grade);
    if (gLower.includes('pass')) return true;
    if (gLower.includes('fail')) return false;
    if (isNaN(val)) return false;
    
    return isPercentageScale ? val >= 75 : val <= 3.0;
  }).length;
  const passRate = ((totalPassed / allGrades.length) * 100).toFixed(0);

  // Normalize grade to a 0-100 scale for comparison
  const getSemanticScore = (val: number) => {
    if (val <= 0) return 0;
    if (val <= 5.0) {
      return 100 - (val - 1.0) * 12.5;
    }
    return val;
  };

  // Highest & Lowest (Normalized comparison)
  const sortedBySemantic = [...numericGrades].sort((a, b) => getSemanticScore(b.val) - getSemanticScore(a.val));
  const bestGrade = sortedBySemantic.length > 0 ? sortedBySemantic[0].val.toFixed(2) : 'N/A';
  const lowestGrade = sortedBySemantic.length > 0 ? sortedBySemantic[sortedBySemantic.length - 1].val.toFixed(2) : 'N/A';

  // Total Units
  const totalUnits = allGrades.reduce((acc, curr) => {
    const u = parseFloat(curr.units || '0');
    const gLower = curr.remarks.toLowerCase();
    const val = parseFloat(curr.grade);
    let isPassed = false;
    if (gLower.includes('pass')) isPassed = true;
    else if (gLower.includes('fail')) isPassed = false;
    else if (!isNaN(val)) isPassed = getSemanticScore(val) >= 75;

    return acc + (isPassed && !isNaN(u) ? u : 0);
  }, 0);


  // Grade Distribution Data
  const gradeCounts: { [key: string]: number } = {};
  numericGrades.forEach(g => {
    const label = g.val.toFixed(2);
    gradeCounts[label] = (gradeCounts[label] || 0) + 1;
  });
  const distData = Object.entries(gradeCounts)
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => parseFloat(a.grade) - parseFloat(b.grade));

  // Semester Trend Data
  const semesterGroups: { [key: string]: number[] } = {};
  const semesterOrder: string[] = [];
  allGrades.forEach(g => {
    if (g.semester && !semesterGroups[g.semester]) {
      semesterGroups[g.semester] = [];
      semesterOrder.push(g.semester);
    }
    if (g.semester) {
      const val = parseFloat(g.grade);
      if (!isNaN(val) && val > 0) {
        semesterGroups[g.semester].push(val);
      }
    }
  });

  const trendData = [...semesterOrder].reverse().map(sem => {
    const grades = semesterGroups[sem];
    const avg = grades.length > 0 
      ? grades.reduce((a, b) => a + b, 0) / grades.length 
      : 0;
    
    let shortName = sem.replace('First Semester', '1st').replace('Second Semester', '2nd').replace('Summer', 'Sum');
    shortName = shortName.replace(/20(\d{2})-20(\d{2})/, '$1-$2'); 
    
    return {
      semester: shortName,
      fullSemester: sem,
      gwa: parseFloat(avg.toFixed(2))
    };
  }).filter(d => d.gwa > 0);

  const gwaNum = parseFloat(gwa as string);
  const gwaPercent = !isNaN(gwaNum) 
    ? (isPercentageScale 
        ? (gwaNum / 100) * 100 
        : Math.min(((5 - gwaNum) / 4) * 100, 100))
    : 0;

  return (
    <div className="space-y-6 mb-8 animate-fade-in">
      <div className={`grid grid-cols-2 ${totalUnits > 0 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
        {/* GWA Card */}
        <div className="surface-neutral p-4 rounded-xl border border-border/50 flex flex-col justify-between shadow-sm relative group overflow-hidden ring-1 ring-black/5">
          <div className="absolute -top-2 -right-2 p-3 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
            <Award className="w-16 h-16" />
          </div>
          <div>
             <div className="flex justify-between items-start">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">GWA Score</span>
              <button 
                onClick={toggleGwa}
                className="p-1 rounded bg-muted/50 text-muted-foreground hover:text-foreground transition-all active:scale-95 relative z-10"
              >
                {showGwa ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
              </button>
             </div>
             <p className="text-2xl font-black text-foreground mt-2 tracking-tight tabular-nums">
               {showGwa ? gwa : '***'}
             </p>
          </div>
          <div className="h-1.5 w-full bg-primary/5 mt-3 rounded-full overflow-hidden">
             <div className="h-full bg-primary" style={{ width: `${gwaPercent}%` }}></div>
          </div>
        </div>

        {/* Units Card */}
        {totalUnits > 0 && (
          <div className="surface-neutral p-4 rounded-xl border border-border/50 flex flex-col justify-between shadow-sm relative overflow-hidden ring-1 ring-black/5">
            <div className="absolute -top-2 -right-2 p-3 opacity-5 pointer-events-none">
              <BookOpen className="w-16 h-16" />
            </div>
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Units Earned</span>
            <p className="text-2xl font-black text-foreground mt-2 tracking-tight tabular-nums">{totalUnits.toFixed(1)}</p>
            <div className="mt-3 flex items-center gap-1.5">
              <Zap className="h-2.5 w-2.5 text-primary" />
              <span className="text-[8px] font-black text-muted-foreground uppercase">Academic Progress</span>
            </div>
          </div>
        )}

        {/* Best Grade */}
        <div className="surface-neutral p-4 rounded-xl border border-border/50 flex flex-col justify-between shadow-sm relative overflow-hidden ring-1 ring-black/5">
           <div className="absolute -top-2 -right-2 p-3 opacity-5 pointer-events-none">
            <TrendingUp className="w-16 h-16" />
          </div>
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Peak Grade</span>
          <p className="text-2xl font-black text-emerald-500 mt-2 tracking-tight tabular-nums">{bestGrade}</p>
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-3">Highest Recorded</p>
        </div>

        {/* Lowest Grade */}
        <div className="surface-neutral p-4 rounded-xl border border-border/50 flex flex-col justify-between shadow-sm relative overflow-hidden ring-1 ring-black/5">
           <div className="absolute -top-2 -right-2 p-3 opacity-5 pointer-events-none">
            <AlertCircle className="w-16 h-16" />
          </div>
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Floor Grade</span>
          <p className="text-2xl font-black text-orange-500 mt-2 tracking-tight tabular-nums">{lowestGrade}</p>
           <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-3">Area of Focus</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="surface-neutral relative overflow-hidden p-6 rounded-xl border border-border/50 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-sm font-black text-foreground uppercase tracking-tight">Academic Momentum</h4>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">GWA Semester Timeline</p>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGwa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis 
                  dataKey="semester" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 800, fill: 'var(--muted-foreground)' }}
                  dy={10}
                />
                <YAxis 
                  domain={isPercentageScale ? [70, 100] : [1, 5]} 
                  reversed={!isPercentageScale}
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 800, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase'
                  }}
                  itemStyle={{ color: 'var(--primary)' }}
                  formatter={(value: any) => [value, 'GWA']}
                />
                <Area 
                  type="monotone" 
                  dataKey="gwa" 
                  stroke="var(--primary)" 
                  fillOpacity={1} 
                  fill="url(#colorGwa)" 
                  strokeWidth={3}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="surface-neutral relative overflow-hidden p-6 rounded-xl border border-border/50 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-sm font-black text-foreground uppercase tracking-tight">Subject Distribution</h4>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Performance Frequency</p>
            </div>
             <div className="px-2 py-1 rounded bg-muted/50 text-[9px] font-black text-primary uppercase tracking-widest border border-border/50">
               Passed: {passRate}%
             </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis 
                  dataKey="grade" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 800, fill: 'var(--muted-foreground)' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 800, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--accent)', opacity: 0.2 }}
                  contentStyle={{ 
                    backgroundColor: 'var(--card)',
                    borderRadius: '8px', 
                    border: '1px solid var(--border)', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase'
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]} barSize={24}>
                  {distData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="var(--primary)" fillOpacity={0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
