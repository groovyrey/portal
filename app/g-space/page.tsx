'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStudentQuery } from '@/lib/hooks';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Clock, 
  CreditCard, 
  CalendarDays,
  ListTodo,
  Mail,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LogOut,
  DatabaseZap,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduleItem, Financials } from '@/types';
import Skeleton from '@/components/ui/Skeleton';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { auth, googleProvider, db } from '@/lib/db';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';

// --- Types ---
interface CalendarEvent {
  id: string;
  title: string;
  type: 'class' | 'payment';
  date: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  amount?: string;
  description?: string;
  color: string;
}

interface ClassroomAssignment {
  id: string;
  courseName: string;
  title: string;
  description?: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours: number;
    minutes: number;
  };
  alternateLink: string;
  state: string;
}

interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  alternateLink: string;
  ownerName?: string;
}

// --- Helper Functions ---

function parsePaymentsToEvents(financials: Financials | undefined, year: number, month: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  if (!financials?.installments) return events;
  financials.installments.forEach((inst, idx) => {
    const dateParts = inst.dueDate.split(/[\/\-]/);
    if (dateParts.length !== 3) return;
    
    let m, d, y;
    if (dateParts[0].length === 4) {
      y = parseInt(dateParts[0]);
      m = parseInt(dateParts[1]) - 1;
      d = parseInt(dateParts[2]);
    } else {
      m = parseInt(dateParts[0]) - 1;
      d = parseInt(dateParts[1]);
      y = parseInt(dateParts[2]);
    }

    if (y === year && m === month) {
      events.push({
        id: `pay-${idx}`,
        title: `Payment: ${inst.description}`,
        type: 'payment',
        date: new Date(y, m, d),
        amount: inst.outstanding,
        color: 'bg-rose-500'
      });
    }
  });
  return events;
}

function generateICS(schedule: ScheduleItem[]) {
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Student Portal//Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  schedule.forEach((item) => {
    const parts = item.time.split(' ');
    if (parts.length < 2) return;
    const daysStr = parts[0];
    const timeRange = parts.slice(1).join(' ');
    const [startT, endT] = timeRange.split('-');

    const formatTime = (t: string) => {
      if (!t) return "000000";
      const match = t.match(/(\d+):(\d+)(AM|PM)/i);
      if (!match) return "000000";
      let h = parseInt(match[1]);
      const m = match[2];
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return `${h.toString().padStart(2, '0')}${m}00`;
    };

    const rruleDays = daysStr.split('-').map(d => d.substring(0, 2).toUpperCase()).join(',');
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    const dateStr = startOfWeek.toISOString().split('T')[0].replace(/-/g, '');

    ics.push('BEGIN:VEVENT');
    ics.push(`SUMMARY:${item.subject}`);
    ics.push(`DESCRIPTION:${item.description} - Section: ${item.section}`);
    ics.push(`LOCATION:${item.room}`);
    ics.push(`DTSTART;TZID=Asia/Manila:${dateStr}T${formatTime(startT)}`);
    ics.push(`DTEND;TZID=Asia/Manila:${dateStr}T${formatTime(endT)}`);
    ics.push(`RRULE:FREQ=WEEKLY;BYDAY=${rruleDays}`);
    ics.push('END:VEVENT');
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

export default function GSpacePage() {
  const { data: student, isLoading } = useStudentQuery();
  const [view, setView] = useState<'calendar' | 'agenda'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLinking, setIsLinking] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [classroomCourses, setClassroomCourses] = useState<ClassroomCourse[]>([]);
  const [classroomAssignments, setClassroomAssignments] = useState<ClassroomAssignment[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Handle Firestore Persistence
  useEffect(() => {
    if (!student?.id) return;

    const loadSyncData = async () => {
      try {
        const syncDoc = await getDoc(doc(db, 'students', student.id, 'integrations', 'google'));
        if (syncDoc.exists()) {
          const data = syncDoc.data();
          if (data.email && data.accessToken) {
            setLinkedEmail(data.email);
            setGoogleAccessToken(data.accessToken);
            fetchAllData(data.accessToken);
          }
        }
      } catch (error) {
        console.error('Error loading sync data:', error);
      }
    };

    loadSyncData();
  }, [student?.id]);

  const handleGoogleVerify = async () => {
    if (!student?.id) {
      toast.error('Student session not found.');
      return;
    }

    setIsLinking(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleEmail = result.user.email;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (googleEmail && token) {
        setLinkedEmail(googleEmail);
        setGoogleAccessToken(token);

        // Save to Firestore
        await setDoc(doc(db, 'students', student.id, 'integrations', 'google'), {
          email: googleEmail,
          accessToken: token,
          updatedAt: new Date()
        });

        toast.success('Account synced successfully');
        fetchAllData(token);
      }
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsLinking(false);
    }
  };

  const handleSignOut = async () => {
    if (!student?.id) return;

    try {
      // Clear from Firestore
      await deleteDoc(doc(db, 'students', student.id, 'integrations', 'google'));
      
      setLinkedEmail(null);
      setGoogleAccessToken(null);
      setGoogleEvents([]);
      setClassroomCourses([]);
      setClassroomAssignments([]);
      
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Sign out failed');
    }
  };

  const fetchAllData = async (token: string) => {
    setIsFetching(true);
    try {
      await Promise.all([
        fetchGoogleEvents(token),
        fetchClassroomData(token)
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchGoogleEvents = async (token: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGoogleEvents(data.items || []);
      }
    } catch (error) {
      console.error('Calendar Fetch Error:', error);
    }
  };

  const fetchClassroomData = async (token: string) => {
    try {
      // 1. Fetch Courses
      const coursesResponse = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!coursesResponse.ok) return;
      const coursesData = await coursesResponse.json();
      
      // Fetch owners in parallel
      const courses = await Promise.all((coursesData.courses || []).map(async (c: any) => {
        let ownerName = 'Unknown Teacher';
        try {
          const profileRes = await fetch(`https://classroom.googleapis.com/v1/userProfiles/${c.ownerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            ownerName = profileData.name?.fullName || 'Unknown Teacher';
          }
        } catch (e) {
          console.error(`Error fetching owner for course ${c.id}:`, e);
        }

        return {
          id: c.id,
          name: c.name,
          section: c.section,
          descriptionHeading: c.descriptionHeading,
          alternateLink: c.alternateLink,
          ownerName: ownerName
        };
      }));
      
      setClassroomCourses(courses);

      // 2. Fetch CourseWork for each course
      const allAssignments: ClassroomAssignment[] = [];
      await Promise.all(courses.map(async (course: any) => {
        const cwResponse = await fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork?orderBy=dueDate asc&pageSize=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (cwResponse.ok) {
          const cwData = await cwResponse.json();
          const assignments = (cwData.courseWork || []).map((cw: any) => ({
            id: cw.id,
            courseName: course.name,
            title: cw.title,
            description: cw.description,
            dueDate: cw.dueDate,
            dueTime: cw.dueTime,
            alternateLink: cw.alternateLink,
            state: cw.state
          }));
          allAssignments.push(...assignments);
        }
      }));

      // Sort by due date (closest first)
      allAssignments.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        const dateA = new Date(a.dueDate.year, a.dueDate.month - 1, a.dueDate.day).getTime();
        const dateB = new Date(b.dueDate.year, b.dueDate.month - 1, b.dueDate.day).getTime();
        return dateA - dateB;
      });

      setClassroomAssignments(allAssignments);
    } catch (error) {
      console.error('Classroom Fetch Error:', error);
    }
  };

  const events = useMemo(() => {
    if (!student) return [];
    const payEvents = parsePaymentsToEvents(student.financials, year, month);
    return [...payEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [student, year, month]);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const downloadICS = () => {
    if (!student?.schedule) return;
    const content = generateICS(student.schedule);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <Skeleton className="h-[500px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  if (!linkedEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-sm text-center"
        >
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          
          <h1 className="text-xl font-bold mb-2">G-Space Sync</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Connect your Google account to view your Classroom courses and Calendar events.
          </p>

          <button 
            onClick={handleGoogleVerify}
            disabled={isLinking}
            className="w-full flex items-center justify-center gap-3 py-3 bg-foreground text-background rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isLinking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.27l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {isLinking ? 'Connecting...' : 'Continue with Google'}
          </button>
          
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              Portal Account: {student.email}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* G-Space Sub-navigation */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-6">
          {[
            { id: 'sync', name: 'Sync Hub', icon: RefreshCw, active: true },
            { id: 'drive', name: 'Drive', icon: DatabaseZap, active: false, future: true },
            { id: 'meet', name: 'Meet', icon: Mail, active: false, future: true },
            { id: 'docs', name: 'Docs', icon: FileText, active: false, future: true },
          ].map((item) => (
            <button
              key={item.id}
              disabled={item.future}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                item.active 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'bg-card border border-border text-muted-foreground hover:bg-accent'
              } ${item.future ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
              {item.future && <span className="text-[8px] bg-muted px-1 rounded uppercase tracking-tighter ml-1">Soon</span>}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sync Status Card */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Account Synced</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{linkedEmail?.split('@')[0]}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => fetchAllData(googleAccessToken!)}
                  disabled={isFetching}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
                  Sync
                </button>
                <button 
                  onClick={handleSignOut}
                  className="px-3 py-2 bg-accent text-rose-500 rounded-lg text-xs font-medium hover:bg-rose-500/10 transition-all flex items-center gap-2"
                  title="Sign Out"
                >
                  <LogOut className="h-3 w-3" />
                  Exit
                </button>
              </div>
            </div>

            {/* Courses Card */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Courses</h3>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  {classroomCourses.length}
                </span>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                {isFetching ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
                ) : classroomCourses.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-6">No classes found.</p>
                ) : (
                  classroomCourses.map((course) => (
                    <a 
                      key={course.id} 
                      href={course.alternateLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-accent/30 hover:bg-accent/50 hover:border-primary/30 transition-all group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{course.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {course.section && <p className="text-[9px] text-muted-foreground uppercase">{course.section}</p>}
                          {course.ownerName && <span className="text-[9px] text-primary/70 font-medium">by {course.ownerName}</span>}
                        </div>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                    </a>
                  ))
                )}
              </div>
            </div>

            {/* Assignments Card */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Tasks</h3>
                </div>
                <span className="text-[10px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full font-bold">
                  {classroomAssignments.length}
                </span>
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
                {isFetching ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                ) : classroomAssignments.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-8">No tasks found.</p>
                ) : (
                  classroomAssignments.map((assignment) => (
                    <a 
                      key={assignment.id} 
                      href={assignment.alternateLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl border border-border bg-accent/30 hover:bg-accent/50 hover:border-primary/30 transition-all group"
                    >
                      <p className="text-[9px] text-primary font-bold uppercase tracking-wider mb-1">{assignment.courseName}</p>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{assignment.title}</p>
                      {assignment.dueDate && (
                        <div className="flex items-center gap-1.5 mt-2 text-[9px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Due: {assignment.dueDate.month}/{assignment.dueDate.day}</span>
                        </div>
                      )}
                    </a>
                  ))
                )}
              </div>
            </div>

            <button 
              onClick={downloadICS}
              className="w-full flex items-center justify-center gap-2 py-3 bg-card border border-border text-foreground rounded-2xl text-xs font-semibold hover:bg-accent transition-all shadow-sm"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
              Export Schedule (.ics)
            </button>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-accent p-1 rounded-xl">
                    <button 
                      onClick={() => setView('calendar')}
                      className={`p-2 rounded-lg transition-all ${view === 'calendar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <CalendarDays className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setView('agenda')}
                      className={`p-2 rounded-lg transition-all ${view === 'agenda' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <ListTodo className="h-4 w-4" />
                    </button>
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-widest">{monthName} {year}</h2>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-accent rounded-lg transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-accent rounded-lg transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {view === 'calendar' ? (
                    <motion.div 
                      key="calendar"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="grid grid-cols-7 gap-px mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                          <div key={d} className="text-center py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {d}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                          <div key={`pad-${i}`} className="aspect-square rounded-xl bg-accent/20" />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const dayNum = i + 1;
                          const date = new Date(year, month, dayNum);
                          const isToday = date.toDateString() === new Date().toDateString();
                          const dayEvents = events.filter(e => e.date.getDate() === dayNum);
                          
                          return (
                            <div 
                              key={dayNum} 
                              className={`aspect-square rounded-xl border p-2 flex flex-col items-center justify-center gap-1 transition-all ${
                                isToday 
                                  ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10' 
                                  : 'bg-background border-border hover:border-muted-foreground/30'
                              }`}
                            >
                              <span className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-foreground/70'}`}>
                                {dayNum}
                              </span>
                              <div className="flex gap-0.5">
                                {dayEvents.map(e => (
                                  <div key={e.id} className={`h-1 w-1 rounded-full ${e.type === 'class' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="agenda"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      {events.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-xs text-muted-foreground">No events this month.</p>
                        </div>
                      ) : (
                        events.map((event) => (
                          <div key={event.id} className="p-3 rounded-xl border border-border bg-accent/20 flex items-center gap-4 group transition-all">
                            <div className="flex flex-col items-center justify-center w-10 shrink-0">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">{event.date.toLocaleString('default', { weekday: 'short' })}</span>
                              <span className="text-sm font-bold">{event.date.getDate()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{event.title}</h4>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                {event.startTime && <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.startTime}</div>}
                                {event.amount && <div className="text-rose-500 font-medium">PHP {event.amount}</div>}
                              </div>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              event.type === 'class' ? 'bg-blue-500/10 text-blue-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {event.type}
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-6 py-4 px-6 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Classes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Today</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
