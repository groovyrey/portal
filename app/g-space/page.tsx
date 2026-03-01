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
  FileText,
  StickyNote,
  Plus,
  Trash2,
  X,
  Check,
  Library,
  Youtube,
  Search,
  PlayCircle,
  Book
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduleItem, Financials } from '@/types';
import Skeleton from '@/components/ui/Skeleton';
import { auth, googleProvider, db } from '@/lib/db';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import Image from 'next/image';

// --- Types ---
interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  updated: string;
}

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

interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail: string;
    };
    previewLink: string;
    publishedDate?: string;
  };
}

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    channelTitle: string;
    publishTime: string;
  };
  contentDetails?: {
    duration: string;
    caption?: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
  };
  topicDetails?: {
    topicCategories?: string[];
  };
}

// --- Helper Functions ---

function formatDuration(iso: string | undefined): string {
  if (!iso) return '';
  const match = iso.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '';
  const h = match[1]?.replace('H', '') || 0;
  const m = match[2]?.replace('M', '') || 0;
  const s = match[3]?.replace('S', '') || 0;
  return `${h ? h + ':' : ''}${m.toString().padStart(h ? 2 : 1, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatViews(count: string | undefined): string {
  if (!count) return '';
  const n = parseInt(count);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M views';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K views';
  return n + ' views';
}

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
  const [activeTab, setActiveTab] = useState<'sync' | 'notes' | 'library' | 'media'>('sync');
  const [view, setView] = useState<'calendar' | 'agenda'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLinking, setIsLinking] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [classroomCourses, setClassroomCourses] = useState<ClassroomCourse[]>([]);
  const [classroomAssignments, setClassroomAssignments] = useState<ClassroomAssignment[]>([]);
  
  // Notes State
  const [googleTasks, setGoogleTasks] = useState<GoogleTask[]>([]);
  const [taskListId, setTaskListId] = useState<string | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', notes: '' });
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Library & Media State
  const [bookQuery, setBookQuery] = useState('');
  const [books, setBooks] = useState<GoogleBook[]>([]);
  const [videoQuery, setVideoQuery] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [openVideos, setOpenVideos] = useState<YouTubeVideo[]>([]);
  const [activeMediaSubTab, setActiveMediaSubTab] = useState<'search' | string>('search');
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [videoSummaries, setVideoSummaries] = useState<Record<string, string>>({});

  const [isViewingTimestamps, setIsViewingTimestamps] = useState<string | null>(null);

  const seekToTimestamp = (videoId: string, timeStr: string) => {
    const iframe = document.getElementById(`yt-player-${videoId}`) as HTMLIFrameElement;
    if (!iframe || !iframe.contentWindow) {
      console.error('Iframe not found for', videoId);
      return;
    }

    // Convert time string (e.g., "1:23" or "1:23:45") to seconds
    const parts = timeStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    }

    // Use postMessage to communicate with the YouTube IFrame API
    iframe.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'seekTo',
      args: [seconds, true]
    }), '*');
    
    // Also try to play if paused
    iframe.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'playVideo',
      args: []
    }), '*');
  };

  const summarizeVideo = async (video: YouTubeVideo) => {
    if (videoSummaries[video.id.videoId]) return;
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/ai/youtube/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id.videoId,
          title: video.snippet.title,
          description: video.snippet.description
        })
      });
      if (response.ok) {
        const data = await response.json();
        setVideoSummaries(prev => ({ ...prev, [video.id.videoId]: data.summary }));
        toast.success('Summary generated successfully!');
      } else {
        toast.error('Failed to generate summary');
      }
    } catch (error) {
      toast.error('An error occurred during summarization');
    } finally {
      setIsSummarizing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Summary copied to clipboard');
  };

  const saveSummaryToTasks = (video: YouTubeVideo) => {
    const summary = videoSummaries[video.id.videoId];
    if (!summary) return;
    
    setNewNote({
      title: `Summary: ${video.snippet.title}`,
      notes: `Source: https://www.youtube.com/watch?v=${video.id.videoId}\n\n${summary}`
    });
    setIsAddingNote(true);
    setActiveTab('notes');
  };

  const timestamps = useMemo(() => {
    return openVideos.reduce((acc, video) => {
      const desc = video.snippet.description;
      const lines = desc.split('\n');
      const timestampRegex = /(\d{1,2}:\d{2}(?::\d{2})?)/;
      const results: { time: string, label: string }[] = [];

      lines.forEach(line => {
        const match = line.match(timestampRegex);
        if (match) {
          const time = match[0];
          const label = line.replace(time, '').trim().replace(/^[-–—]\s*/, '').substring(0, 50);
          results.push({ time, label: label || 'Jump to' });
        }
      });
      acc[video.id.videoId] = results;
      return acc;
    }, {} as Record<string, { time: string, label: string }[]>);
  }, [openVideos]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handleVideoClick = async (video: YouTubeVideo) => {
    // Check if we already have this video open
    const alreadyOpen = openVideos.find(v => v.id.videoId === video.id.videoId);
    
    if (!alreadyOpen) {
      // If not already open, we'll fetch full details to get the complete description
      // (The search API only returns a snippet)
      try {
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,topicDetails&id=${video.id.videoId}&key=${apiKey}`);
        if (response.ok) {
          const data = await response.json();
          if (data.items?.[0]) {
            const fullVideo = {
              ...video,
              snippet: data.items[0].snippet,
              contentDetails: data.items[0].contentDetails,
              statistics: data.items[0].statistics,
              topicDetails: data.items[0].topicDetails
            };
            setOpenVideos(prev => [...prev, fullVideo]);
          } else {
            setOpenVideos(prev => [...prev, video]);
          }
        } else {
          setOpenVideos(prev => [...prev, video]);
        }
      } catch (e) {
        setOpenVideos(prev => [...prev, video]);
      }
    }
    setActiveMediaSubTab(video.id.videoId);
  };

  const handleCloseVideoTab = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    setOpenVideos(prev => prev.filter(v => v.id.videoId !== videoId));
    if (activeMediaSubTab === videoId) {
      setActiveMediaSubTab('search');
    }
  };

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
      // Force consent prompt to ensure new scopes are granted
      googleProvider.setCustomParameters({ prompt: 'select_account consent' });
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
      setGoogleTasks([]);
      setTaskListId(null);
      setBooks([]);
      setVideos([]);
      
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
        fetchClassroomData(token),
        fetchGoogleTasks(token)
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
      } else {
        if (response.status === 403) {
          console.error('Calendar API disabled or access denied');
        }
      }
    } catch (error) {
      console.error('Calendar Fetch Error:', error);
    }
  };

  const fetchGoogleTasks = async (token: string) => {
    try {
      const listResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!listResponse.ok) {
        if (listResponse.status === 403 || listResponse.status === 401) {
          toast.error('Google Tasks access denied. Please re-link your account to grant permission.');
        }
        return;
      }

      const listsData = await listResponse.json();
      const defaultList = listsData.items?.find((l: any) => l.title === 'My Tasks' || l.id === '@default') || listsData.items?.[0];
      
      if (!defaultList) {
        setGoogleTasks([]);
        return;
      }

      setTaskListId(defaultList.id);

      const response = await fetch(`https://www.googleapis.com/tasks/v1/lists/${defaultList.id}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setGoogleTasks(data.items || []);
      }
    } catch (error) {
      console.error('Tasks Fetch Error:', error);
    }
  };

  const fetchBooks = async (query: string) => {
    if (!query.trim()) return;
    setIsFetching(true);
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`);
      if (response.ok) {
        const data = await response.json();
        setBooks(data.items || []);
      } else {
        toast.error('Failed to fetch books');
      }
    } catch (error) {
      toast.error('Network error fetching books');
    } finally {
      setIsFetching(false);
    }
  };

  const fetchVideos = async (query: string) => {
    if (!query.trim()) return;
    setIsFetching(true);
    try {
      const response = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const data = await response.json();
        setVideos(data.items || []);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to fetch videos');
      }
    } catch (error) {
      toast.error('Network error fetching videos');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddNote = async () => {
    if (!googleAccessToken) {
      toast.error('Google account not linked.');
      return;
    }

    let currentTaskListId = taskListId;

    // Try to fetch task list if missing
    if (!currentTaskListId) {
      setIsFetching(true);
      try {
        const listResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
          headers: { 'Authorization': `Bearer ${googleAccessToken}` }
        });
        if (listResponse.ok) {
          const listsData = await listResponse.json();
          const defaultList = listsData.items?.find((l: any) => l.title === 'My Tasks' || l.id === '@default') || listsData.items?.[0];
          if (defaultList) {
            currentTaskListId = defaultList.id;
            setTaskListId(defaultList.id);
          }
        }
      } catch (e) {
        console.error('Failed to fetch list ID during save', e);
      }
    }
    
    if (!currentTaskListId) {
      toast.error('Could not find a Google Tasks list. Please ensure you have at least one list in Google Tasks.');
      setIsFetching(false);
      return;
    }
    
    if (!newNote.title.trim()) {
      toast.error('Please enter a title for your note');
      setIsFetching(false);
      return;
    }
    
    setIsFetching(true);
    try {
      const response = await fetch(`https://www.googleapis.com/tasks/v1/lists/${currentTaskListId}/tasks`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newNote.title,
          notes: newNote.notes
        })
      });

      if (response.ok) {
        toast.success('Note added to Google Tasks');
        setNewNote({ title: '', notes: '' });
        setIsAddingNote(false);
        fetchGoogleTasks(googleAccessToken);
      } else {
        const err = await response.json();
        if (response.status === 403) {
          toast.error('Access denied. Please re-link your Google account with Tasks permission.');
        } else {
          toast.error(`Failed to add note: ${err.error?.message || response.statusText}`);
        }
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleDeleteNote = async (taskId: string) => {
    if (!googleAccessToken || !taskListId) return;

    try {
      const response = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${googleAccessToken}` }
      });

      if (response.ok) {
        toast.success('Note deleted');
        setGoogleTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleToggleTaskStatus = async (task: GoogleTask) => {
    if (!googleAccessToken || !taskListId) return;

    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    
    try {
      const response = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setGoogleTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const fetchClassroomData = async (token: string) => {
    try {
      const coursesResponse = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!coursesResponse.ok) return;
      const coursesData = await coursesResponse.json();
      
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

      const allAssignments: ClassroomAssignment[] = [];
      await Promise.all(courses.map(async (course: any) => {
        try {
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
        } catch (e) {
          console.error(`Error fetching coursework for course ${course.id}:`, e);
        }
      }));

      allAssignments.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        const dateA = new Date(a.dueDate.year, a.dueDate.month - 1, a.dueDate.day).getTime();
        const dateB = new Date(b.dueDate.year, b.dueDate.month - 1, b.dueDate.day).getTime();
        return dateA - dateB;
      });

      setClassroomAssignments(allAssignments);
    } catch (error: any) {
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
          <Skeleton className="h-12 w-64 rounded-lg" />
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  if (!linkedEmail) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-6 py-12">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -ml-64 -mb-64 animate-pulse" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl w-full relative z-10"
        >
          <div className="text-center mb-16">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="h-20 w-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20 rotate-3"
            >
              <GraduationCap className="h-10 w-10 text-primary-foreground" />
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-foreground">
              Unlock your <span className="text-primary">G-Space</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
              Elevate your academic journey by seamlessly syncing your Google Workspace with the LCC Hub. One login, infinite possibilities.
            </p>
          </div>

          {/* Engaging Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: RefreshCw, title: 'Classroom Sync', desc: 'Real-time access to assignments and courses.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: StickyNote, title: 'AI Study Notes', desc: 'Sync your study sessions with Google Tasks.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { icon: Library, title: 'Global Library', desc: 'Millions of academic books at your fingertips.', color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { icon: PlayCircle, title: 'Smart Media', desc: 'Analyze YouTube lectures with Gemma AI.', color: 'text-rose-500', bg: 'bg-rose-500/10' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 flex flex-col items-center text-center group hover:border-primary/30 hover:bg-card transition-all"
              >
                <div className={`h-12 w-12 shrink-0 rounded-xl ${feature.bg} flex items-center justify-center ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest mb-2 text-foreground">{feature.title}</h3>
                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="max-w-sm mx-auto space-y-6 text-center">
            <button 
              onClick={handleGoogleVerify}
              disabled={isLinking}
              className="w-full flex items-center justify-center gap-4 py-5 bg-foreground text-background rounded-2xl text-sm font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-2xl"
            >
              {isLinking ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.27l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {isLinking ? 'Verifying...' : 'Link Google Account'}
            </button>
            
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
              Secure OAuth 2.0 Encryption • Student ID: {student.id}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20 lg:pb-0">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Navigation - Professional Style */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">G-Space</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Workspace Sync</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            {[
              { id: 'sync', name: 'Dashboard', icon: RefreshCw, desc: 'Sync & Classroom' },
              { id: 'notes', name: 'Notes', icon: StickyNote, desc: 'Google Tasks' },
              { id: 'library', name: 'Library', icon: Library, desc: 'Google Books' },
              { id: 'media', name: 'Media', icon: PlayCircle, desc: 'YouTube Learning' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                  activeTab === item.id 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-primary-foreground' : 'text-primary'}`} />
                <div className="text-left">
                  <p className="text-xs font-bold leading-none">{item.name}</p>
                  <p className={`text-[9px] mt-1 ${activeTab === item.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{item.desc}</p>
                </div>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border/50 bg-muted/20">
            <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Linked Account</p>
                <p className="text-xs font-bold truncate text-foreground">{linkedEmail}</p>
              </div>
              <button 
                onClick={handleSignOut}
                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Bar for Mobile/Header */}
          <header className="lg:hidden h-16 border-b border-border flex items-center justify-between px-4 bg-card">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm">G-Space</span>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={handleSignOut} className="p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/10 rounded-full transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Mobile Tab Switcher */}
          <div className="lg:hidden flex items-center gap-1 bg-muted/30 p-2 border-b border-border overflow-x-auto no-scrollbar">
            {[
              { id: 'sync', name: 'Sync', icon: RefreshCw },
              { id: 'notes', name: 'Notes', icon: StickyNote },
              { id: 'library', name: 'Library', icon: Library },
              { id: 'media', name: 'Media', icon: PlayCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.name}
              </button>
            ))}
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'sync' && (
                <motion.div 
                  key="sync-hub"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.01 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight mb-1">Mission Control</h2>
                      <p className="text-muted-foreground text-sm font-medium">Monitoring classroom updates and upcoming schedules.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => fetchAllData(googleAccessToken!)}
                        disabled={isFetching}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        {isFetching ? 'Syncing...' : 'Sync Workspace'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Classroom Overview */}
                    <div className="lg:col-span-1 space-y-6">
                      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            Active Courses
                          </h3>
                          <span className="text-xs font-black bg-primary/10 text-primary px-3 py-1 rounded-full">
                            {classroomCourses.length}
                          </span>
                        </div>
                        
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                          {isFetching && classroomCourses.length === 0 ? (
                            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                          ) : classroomCourses.length === 0 ? (
                            <div className="text-center py-10 bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
                              <BookOpen className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                              <p className="text-xs font-bold text-muted-foreground">No active courses found</p>
                            </div>
                          ) : (
                            classroomCourses.map((course) => (
                              <a 
                                key={course.id} 
                                href={course.alternateLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group block p-4 rounded-2xl border border-border bg-background hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
                              >
                                <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">{course.name}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{course.section || 'General'}</p>
                                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-all group-hover:translate-x-0.5" />
                                </div>
                              </a>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Schedule & Agenda */}
                    <div className="lg:col-span-2">
                      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="px-6 py-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-muted/10">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl ring-1 ring-border/50">
                              <button 
                                onClick={() => setView('calendar')}
                                className={`p-2 rounded-lg transition-all ${view === 'calendar' ? 'bg-background text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'}`}
                              >
                                <CalendarDays className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => setView('agenda')}
                                className={`p-2 rounded-lg transition-all ${view === 'agenda' ? 'bg-background text-primary shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'}`}
                              >
                                <ListTodo className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="min-w-[120px]">
                              <h2 className="text-lg font-black">{monthName}</h2>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{year}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button onClick={handlePrevMonth} className="p-2.5 hover:bg-muted rounded-xl transition-all border border-border/50 bg-background shadow-sm hover:scale-105 active:scale-95">
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all">Today</button>
                            <button onClick={handleNextMonth} className="p-2.5 hover:bg-muted rounded-xl transition-all border border-border/50 bg-background shadow-sm hover:scale-105 active:scale-95">
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar min-h-[500px]">
                          <AnimatePresence mode="wait">
                            {view === 'calendar' ? (
                              <motion.div 
                                key="calendar"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                              >
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="text-center py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                      {d}
                                    </div>
                                  ))}
                                </div>
                                <div className="grid grid-cols-7 gap-3">
                                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                    <div key={`pad-${i}`} className="aspect-square rounded-2xl bg-muted/5 border border-transparent" />
                                  ))}
                                  {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const dayNum = i + 1;
                                    const date = new Date(year, month, dayNum);
                                    const isToday = date.toDateString() === new Date().toDateString();
                                    const dayEvents = events.filter(e => e.date.getDate() === dayNum);
                                    const dayAssignments = classroomAssignments.filter(a => a.dueDate && a.dueDate.day === dayNum && a.dueDate.month === month + 1 && a.dueDate.year === year);
                                    
                                    return (
                                      <div 
                                        key={dayNum} 
                                        className={`aspect-square rounded-2xl border p-2 flex flex-col items-center justify-start transition-all relative group cursor-default ${
                                          isToday 
                                            ? 'bg-primary/5 border-primary shadow-inner' 
                                            : 'bg-background border-border/50 hover:border-primary/30 hover:shadow-md'
                                        }`}
                                      >
                                        <span className={`text-xs font-black ${isToday ? 'text-primary scale-110' : 'text-foreground/80'}`}>
                                          {dayNum}
                                        </span>
                                        <div className="flex flex-wrap justify-center gap-1 mt-auto pb-1">
                                          {dayEvents.map(e => (
                                            <div key={e.id} className={`h-1.5 w-1.5 rounded-full ${e.type === 'class' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                                          ))}
                                          {dayAssignments.length > 0 && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div 
                                key="agenda"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                              >
                                {[...events, ...classroomAssignments.map(a => ({
                                  id: a.id,
                                  title: a.title,
                                  type: 'assignment' as const,
                                  date: a.dueDate ? new Date(a.dueDate.year, a.dueDate.month - 1, a.dueDate.day) : new Date(),
                                  course: a.courseName,
                                  link: a.alternateLink
                                }))].sort((a, b) => a.date.getTime() - b.date.getTime()).map((item: any) => (
                                  <div 
                                    key={item.id} 
                                    className="p-5 rounded-2xl border border-border bg-background hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 flex items-center gap-6 group transition-all"
                                  >
                                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-muted/50 border border-border/50 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                      <span className="text-[9px] font-black uppercase tracking-widest">{item.date.toLocaleString('default', { weekday: 'short' })}</span>
                                      <span className="text-base font-black leading-none">{item.date.getDate()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      {item.course && <p className="text-[10px] font-black text-primary mb-1 uppercase tracking-widest">{item.course}</p>}
                                      <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{item.title}</h4>
                                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-medium">
                                        {item.startTime && <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{item.startTime}</div>}
                                        {item.amount && <div className="text-rose-500 font-black">PHP {item.amount}</div>}
                                      </div>
                                    </div>
                                    {item.link ? (
                                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-muted/50 border border-border/50 hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all shadow-sm">
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    ) : (
                                      <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] ${
                                        item.type === 'class' ? 'bg-blue-500/10 text-blue-600' : 'bg-rose-500/10 text-rose-600'
                                      }`}>
                                        {item.type}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div 
                  key="notes-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight mb-1">Knowledge Base</h2>
                      <p className="text-sm text-muted-foreground font-medium">Syncing {googleTasks.length} tasks from Google Account.</p>
                    </div>
                    <button 
                      onClick={() => setIsAddingNote(true)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <Plus className="h-5 w-5" />
                      Add Task
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isFetching && googleTasks.length === 0 ? (
                      Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)
                    ) : googleTasks.length === 0 ? (
                      <div className="col-span-full py-24 text-center bg-muted/10 border-2 border-dashed border-border/50 rounded-2xl">
                        <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <StickyNote className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-base font-black mb-2 uppercase tracking-widest">No Active Tasks</h3>
                        <p className="text-xs text-muted-foreground font-medium">Your productivity queue is clear. Time to learn something new!</p>
                      </div>
                    ) : (
                      googleTasks.map((task) => {
                        const isExpanded = expandedTaskId === task.id;
                        return (
                          <motion.div 
                            key={task.id}
                            onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                            className={`group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer relative flex flex-col h-fit ${task.status === 'completed' ? 'opacity-60 grayscale-[0.5]' : ''} ${isExpanded ? 'ring-2 ring-primary/20 shadow-xl' : ''}`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleToggleTaskStatus(task); }}
                                className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                  task.status === 'completed' 
                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                    : 'border-border group-hover:border-primary group-hover:bg-primary/5'
                                }`}
                              >
                                {task.status === 'completed' && <Check className="h-4 w-4 stroke-[3]" />}
                              </button>
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteNote(task.id); }}
                                  className={`p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all ${isExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none'}`}
                                  title="Archive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            <h4 className={`text-sm font-black mb-2 leading-relaxed ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''} ${isExpanded ? '' : 'line-clamp-2'}`}>
                              {task.title}
                            </h4>
                            
                            {task.notes && (
                              <p className={`text-[11px] text-muted-foreground leading-relaxed font-medium ${isExpanded ? 'whitespace-pre-wrap mt-2' : 'line-clamp-3'}`}>
                                {task.notes}
                              </p>
                            )}
                            
                            <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                <Clock className="h-3.5 w-3.5" />
                                {new Date(task.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </div>
                              {task.status === 'completed' && (
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full font-black uppercase tracking-widest">Done</span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'library' && (
                <motion.div 
                  key="library-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight mb-1">Global Library</h2>
                      <p className="text-sm text-muted-foreground font-medium">Direct access to millions of academic publications.</p>
                    </div>
                    <div className="relative w-full max-w-sm">
                      <input 
                        type="text" 
                        placeholder="Title, author, or ISBN..."
                        value={bookQuery}
                        onChange={(e) => setBookQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchBooks(bookQuery)}
                        className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                      />
                      <Search className="h-5 w-5 text-muted-foreground absolute left-4 top-3.5" />
                      <button 
                        onClick={() => fetchBooks(bookQuery)}
                        className="absolute right-2 top-2 p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {books.length > 0 ? (
                      books.map((book) => (
                        <div 
                          key={book.id}
                          onClick={() => setActiveBookId(book.id)}
                          className="group bg-card border border-border rounded-2xl p-4 flex flex-col gap-4 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer hover:-translate-y-1"
                        >
                          <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden relative shadow-md group-hover:shadow-xl transition-all border border-border/50">
                            {book.volumeInfo.imageLinks?.thumbnail ? (
                              <img 
                                src={book.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:')} 
                                alt={book.volumeInfo.title}
                                className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full bg-accent/30 text-muted-foreground">
                                <Book className="h-10 w-10 opacity-20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                               <button className="px-4 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-lg">Preview</button>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                              {book.volumeInfo.title}
                            </h4>
                            <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-wider truncate">
                              {book.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-24 text-center bg-muted/10 border-2 border-dashed border-border/50 rounded-2xl">
                        <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Library className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-base font-black mb-2 uppercase tracking-widest">Library Empty</h3>
                        <p className="text-xs text-muted-foreground font-medium">Enter a search query to browse our massive index of books.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'media' && (
                <motion.div 
                  key="media-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight mb-1">Academy Media</h2>
                      <p className="text-sm text-muted-foreground font-medium">Enhanced learning via AI-powered video analysis.</p>
                    </div>
                    <div className="relative w-full max-w-sm">
                      <input 
                        type="text" 
                        placeholder="Search educational content..."
                        value={videoQuery}
                        onChange={(e) => setVideoQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchVideos(videoQuery)}
                        className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                      />
                      <Search className="h-5 w-5 text-muted-foreground absolute left-4 top-3.5" />
                    </div>
                  </div>

                  {/* Media Navigation Tabs */}
                  <div className="flex items-center gap-1 bg-muted/30 p-1.5 rounded-2xl w-fit max-w-full overflow-x-auto no-scrollbar ring-1 ring-border/50 shadow-inner">
                    <button
                      onClick={() => setActiveMediaSubTab('search')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                        activeMediaSubTab === 'search' 
                          ? 'bg-background text-primary shadow-md ring-1 ring-border/50' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Search className="h-4 w-4" />
                      Global Search
                    </button>
                    {openVideos.map((video) => (
                      <button
                        key={video.id.videoId}
                        onClick={() => setActiveMediaSubTab(video.id.videoId)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap group relative ${
                          activeMediaSubTab === video.id.videoId 
                            ? 'bg-background text-primary shadow-md ring-1 ring-border/50' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Youtube className="h-4 w-4 text-[#ff0000]" />
                        <span className="max-w-[140px] truncate">{video.snippet.title}</span>
                        <X 
                          className="h-4 w-4 hover:bg-rose-500 hover:text-white rounded-md transition-all ml-1 p-0.5" 
                          onClick={(e) => handleCloseVideoTab(e, video.id.videoId)}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Search View */}
                  <div className={activeMediaSubTab === 'search' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'hidden'}>
                    {videos.length > 0 ? (
                      videos.map((video) => (
                        <div 
                          key={video.id.videoId}
                          onClick={() => handleVideoClick(video)}
                          className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all flex flex-col cursor-pointer"
                        >
                          <div className="aspect-video bg-black relative">
                            <img 
                              src={video.snippet.thumbnails.medium.url} 
                              alt={video.snippet.title}
                              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                              <PlayCircle className="h-12 w-12 text-white drop-shadow-lg" />
                            </div>
                            {video.contentDetails?.duration && (
                              <div className="absolute bottom-3 right-3 bg-black/90 text-white text-[10px] font-black px-2 py-1 rounded-lg backdrop-blur-md">
                                {formatDuration(video.contentDetails.duration)}
                              </div>
                            )}
                          </div>
                          <div className="p-5 flex-1 flex flex-col">
                            <h4 className="text-sm font-black leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                              {video.snippet.title}
                            </h4>
                            
                            <div className="flex items-center gap-2 mt-3">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate max-w-[120px]">
                                {video.snippet.channelTitle}
                              </p>
                              {video.statistics?.viewCount && (
                                <>
                                  <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                  <p className="text-[10px] font-bold text-muted-foreground">
                                    {formatViews(video.statistics.viewCount)}
                                  </p>
                                </>
                              )}
                            </div>

                            {video.topicDetails?.topicCategories && video.topicDetails.topicCategories.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-1.5">
                                {video.topicDetails.topicCategories.slice(0, 2).map((cat, i) => {
                                  const label = cat.split('/').pop()?.replace(/_/g, ' ');
                                  return (
                                    <span key={i} className="text-[9px] bg-primary/5 text-primary px-2.5 py-1 rounded-lg font-black uppercase tracking-widest ring-1 ring-primary/10">
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-24 text-center bg-muted/10 border-2 border-dashed border-border/50 rounded-2xl">
                        <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Youtube className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-base font-black mb-2 uppercase tracking-widest">Media Discovery</h3>
                        <p className="text-xs text-muted-foreground font-medium">Explore educational videos. They will appear here once searched.</p>
                      </div>
                    )}
                  </div>

                  {/* Player View */}
                  {openVideos.map((video) => (
                    <div 
                      key={video.id.videoId} 
                      className={activeMediaSubTab === video.id.videoId ? 'grid grid-cols-1 lg:grid-cols-12 gap-8' : 'hidden'}
                    >
                      <div className="lg:col-span-8 space-y-6">
                        <div className="flex flex-col gap-4">
                          <div className="min-w-0">
                            <h3 className="text-xl font-black leading-tight">{video.snippet.title}</h3>
                            <div className="flex flex-wrap items-center gap-4 mt-3">
                              <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                <p className="text-xs font-black uppercase tracking-widest">{video.snippet.channelTitle}</p>
                              </div>
                              {video.statistics?.viewCount && (
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                  <Search className="h-3.5 w-3.5" />
                                  {formatViews(video.statistics.viewCount)}
                                </div>
                              )}
                              {video.contentDetails?.duration && (
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatDuration(video.contentDetails.duration)}
                                </div>
                              )}
                            </div>
                            {video.topicDetails?.topicCategories && video.topicDetails.topicCategories.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {video.topicDetails.topicCategories.map((cat, i) => {
                                  const label = cat.split('/').pop()?.replace(/_/g, ' ');
                                  return (
                                    <span key={i} className="text-[9px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black uppercase tracking-[0.1em] border border-primary/20 shadow-sm">
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-card ring-1 ring-border/50 ring-offset-4 ring-offset-background">
                          <iframe 
                            id={`yt-player-${video.id.videoId}`}
                            src={`https://www.youtube.com/embed/${video.id.videoId}?enablejsapi=1`}
                            title={video.snippet.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        </div>
                      </div>

                      <div className="lg:col-span-4 space-y-6">
                        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl flex flex-col h-full max-h-[800px] relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                          
                          <div className="flex items-center justify-between mb-8 shrink-0">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                                <DatabaseZap className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-black uppercase tracking-[0.2em]">Gemma AI</h4>
                                <p className="text-[9px] font-bold text-muted-foreground">Expert Summarizer</p>
                              </div>
                            </div>
                            {videoSummaries[video.id.videoId] && (
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => copyToClipboard(videoSummaries[video.id.videoId])}
                                  className="p-2.5 hover:bg-muted rounded-xl transition-all border border-border/50 shadow-sm"
                                  title="Copy"
                                >
                                  <ClipboardList className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => saveSummaryToTasks(video)}
                                  className="p-2.5 hover:bg-muted rounded-xl transition-all border border-border/50 shadow-sm"
                                  title="Sync to Tasks"
                                >
                                  <FileText className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-8">
                            {videoSummaries[video.id.videoId] ? (
                              <textarea
                                readOnly
                                value={videoSummaries[video.id.videoId]}
                                className="w-full h-80 bg-muted/30 border border-border/50 rounded-2xl p-6 text-xs leading-relaxed font-medium text-foreground/80 focus:outline-none resize-none custom-scrollbar shadow-inner"
                              />
                            ) : (
                              <div className="space-y-6">
                                <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10">
                                  <p className="text-xs font-bold text-primary leading-relaxed">
                                    Analyze this educational video with our Gemma 3 model. Get instant takeaways and study notes.
                                  </p>
                                </div>
                                
                                {timestamps[video.id.videoId]?.length > 0 && (
                                  <div className="pt-6 border-t border-border/50">
                                    <div className="flex items-center justify-between mb-4">
                                      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Key Moments</h5>
                                      {timestamps[video.id.videoId].length > 5 && (
                                        <button 
                                          onClick={() => setIsViewingTimestamps(video.id.videoId)}
                                          className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                                        >
                                          Expand All
                                        </button>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      {timestamps[video.id.videoId].slice(0, 6).map((ts, i) => (
                                        <button 
                                          key={i} 
                                          onClick={() => seekToTimestamp(video.id.videoId, ts.time)}
                                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all text-left group/ts border border-transparent hover:border-border/50"
                                        >
                                          <span className="font-black text-[10px] text-primary bg-primary/10 px-2 py-1 rounded-lg group-hover/ts:bg-primary group-hover/ts:text-white transition-all shadow-sm">{ts.time}</span>
                                          <span className="text-[11px] font-bold text-muted-foreground truncate group-hover/ts:text-foreground transition-colors">{ts.label}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0">
                            <button 
                              onClick={() => summarizeVideo(video)}
                              disabled={isSummarizing || !!videoSummaries[video.id.videoId]}
                              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSummarizing ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <DatabaseZap className="h-4 w-4" />
                              )}
                              {videoSummaries[video.id.videoId] ? 'Summary Ready' : 'Process with AI'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Book Reader Modal */}
      <Modal
        isOpen={!!activeBookId}
        onClose={() => setActiveBookId(null)}
        title={<h3 className="text-lg font-bold">Book Preview</h3>}
        maxWidth="max-w-4xl"
      >
        <div className="h-[70vh] flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-end bg-muted/10">
            <a 
              href={`https://books.google.com/books?id=${activeBookId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Google Books
            </a>
          </div>
          <div className="flex-1 bg-background relative">
            {activeBookId && (
              <iframe 
                src={`https://books.google.com/books?id=${activeBookId}&newbks=1&printsec=frontcover&pg=1&output=embed`}
                title="Google Books Preview"
                className="w-full h-full border-0"
              />
            )}
          </div>
        </div>
      </Modal>

      {/* Create Note Modal */}
      <Modal 
        isOpen={isAddingNote} 
        onClose={() => setIsAddingNote(false)}
        title={<h3 className="text-lg font-bold">Create New Note</h3>}
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground ml-1">Title</label>
            <input 
              type="text"
              placeholder="What's on your mind?"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary focus:bg-background transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground ml-1">Content (Optional)</label>
            <textarea 
              placeholder="Add details, links, or sub-tasks..."
              rows={5}
              value={newNote.notes}
              onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })}
              className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary focus:bg-background transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setIsAddingNote(false)}
              className="flex-1 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-all"
            >
              Discard
            </button>
            <button 
              onClick={handleAddNote}
              disabled={!newNote.title.trim() || isFetching}
              className="flex-[2] py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow-sm hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
            >
              {isFetching ? 'Syncing...' : 'Save Note'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Timestamps Full View Modal */}
      <Modal
        isOpen={!!isViewingTimestamps}
        onClose={() => setIsViewingTimestamps(null)}
        title={<h3 className="text-lg font-bold">All Timestamps</h3>}
        maxWidth="max-w-lg"
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar max-h-[60vh]">
          {isViewingTimestamps && timestamps[isViewingTimestamps]?.map((ts, i) => (
            <button 
              key={i} 
              onClick={() => {
                seekToTimestamp(isViewingTimestamps!, ts.time);
                setIsViewingTimestamps(null);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
            >
              <span className="font-bold text-xs text-primary bg-primary/10 px-2 py-1 rounded-md group-hover:bg-primary group-hover:text-white transition-colors">{ts.time}</span>
              <span className="text-sm font-medium text-foreground truncate">{ts.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
