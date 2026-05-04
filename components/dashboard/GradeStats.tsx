import { SubjectGrade } from '@/types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, TrendingUp, Award, AlertCircle, BookOpen, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* GWA Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground"
              onClick={toggleGwa}
            >
              {showGwa ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{showGwa ? gwa : '***'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Grade Average
            </p>
          </CardContent>
        </Card>

        {/* Units Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{totalUnits.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total units
            </p>
          </CardContent>
        </Card>

        {/* Best Grade */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-primary">{bestGrade}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Best grade
            </p>
          </CardContent>
        </Card>

        {/* Lowest Grade */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{passRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Subjects passed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Trend Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Grades over time</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGwa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="semester" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    dy={10}
                  />
                  <YAxis 
                    domain={isPercentageScale ? [70, 100] : [1, 5]} 
                    reversed={!isPercentageScale}
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gwa" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorGwa)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Breakdown</CardTitle>
            <CardDescription>Grades count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="grade" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--accent)', opacity: 0.4 }}
                    contentStyle={{ 
                      backgroundColor: 'var(--card)',
                      borderRadius: 'var(--radius)', 
                      border: '1px solid var(--border)', 
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
