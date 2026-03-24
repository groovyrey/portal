import { SubjectGrade } from '@/types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, TrendingUp, Award, AlertCircle, BookOpen } from 'lucide-react';

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
    // If grade is <= 5.0, assume 1.0-5.0 scale (1.0 is highest)
    // Map 1.0 -> 100, 3.0 -> 75, 5.0 -> 50
    if (val <= 5.0) {
      return 100 - (val - 1.0) * 12.5;
    }
    // Else assume percentage scale
    return val;
  };

  // Highest & Lowest (Normalized comparison)
  const sortedBySemantic = [...numericGrades].sort((a, b) => getSemanticScore(b.val) - getSemanticScore(a.val));
  const bestGrade = sortedBySemantic.length > 0 ? sortedBySemantic[0].val.toFixed(2) : 'N/A';
  const lowestGrade = sortedBySemantic.length > 0 ? sortedBySemantic[sortedBySemantic.length - 1].val.toFixed(2) : 'N/A';

  // Total Units
  const totalUnits = allGrades.reduce((acc, curr) => {
    const u = parseFloat(curr.units || '0');
    // Only count if passed
    const gLower = curr.remarks.toLowerCase();
    const val = parseFloat(curr.grade);
    let isPassed = false;
    if (gLower.includes('pass')) isPassed = true;
    else if (gLower.includes('fail')) isPassed = false;
    else if (!isNaN(val)) isPassed = getSemanticScore(val) >= 75; // Use normalized 75 as passing cutoff

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
  // Group by semester
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

  // GWA Bar Percentage Calculation
  const gwaNum = parseFloat(gwa as string);
  const gwaPercent = !isNaN(gwaNum) 
    ? (isPercentageScale 
        ? (gwaNum / 100) * 100 
        : Math.min(((5 - gwaNum) / 4) * 100, 100))
    : 0;

  return (
    <div className="space-y-6 mb-8 animate-fade-in">
      {/* Key Metrics Grid */}
      <div className={`grid grid-cols-2 ${totalUnits > 0 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
        {/* GWA Card */}
        <div className="bg-card p-4 rounded-2xl border border-border flex flex-col justify-between shadow-sm relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
            <Award className="w-12 h-12" />
          </div>
          <div>
             <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">GWA</span>
              <button 
                onClick={toggleGwa}
                className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-95 relative z-10"
              >
                {showGwa ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
             </div>
             <p className="text-2xl font-bold text-foreground mt-2 tracking-tight">
               {showGwa ? gwa : '***'}
             </p>
          </div>
          <div className="h-1 w-full bg-primary/10 mt-3 rounded-full overflow-hidden">
             <div className="h-full bg-primary" style={{ width: `${gwaPercent}%` }}></div>
          </div>
        </div>

        {/* Units Card */}
        {totalUnits > 0 && (
          <div className="bg-card p-4 rounded-2xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
              <BookOpen className="w-12 h-12" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Units Earned</span>
            <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">{totalUnits.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-2">Total credited units</p>
          </div>
        )}

        {/* Best Grade */}
        <div className="bg-card p-4 rounded-2xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
            <TrendingUp className="w-12 h-12" />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Best Grade</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">{bestGrade}</p>
          <p className="text-[10px] text-muted-foreground font-medium mt-2">{isPercentageScale ? 'Highest Score' : 'Highest Record'}</p>
        </div>

        {/* Lowest Grade */}
        <div className="bg-card p-4 rounded-2xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
            <AlertCircle className="w-12 h-12" />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lowest</span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 tracking-tight">{lowestGrade}</p>
           <p className="text-[10px] text-muted-foreground font-medium mt-2">Needs improvement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-bold text-foreground">Performance Trend</h4>
              <p className="text-[11px] text-muted-foreground">GWA per semester</p>
            </div>
            {/* Legend or actions could go here */}
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGwa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="semester" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  dy={10}
                />
                <YAxis 
                  domain={isPercentageScale ? [70, 100] : [1, 5]} 
                  reversed={!isPercentageScale}
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '11px',
                    fontWeight: 600
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
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
           <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-bold text-foreground">Grade Distribution</h4>
              <p className="text-[11px] text-muted-foreground">Frequency of grades</p>
            </div>
             <div className="px-2 py-1 rounded-md bg-accent text-[10px] font-bold text-muted-foreground">
               Pass Rate: {passRate}%
             </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="grade" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--muted-foreground)' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--accent)', opacity: 0.4 }}
                  contentStyle={{ 
                    backgroundColor: 'var(--card)',
                    borderRadius: '12px', 
                    border: '1px solid var(--border)', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--foreground)'
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                  {distData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="var(--primary)" fillOpacity={0.8} />
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
