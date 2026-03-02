'use client';

import { useState, useEffect } from 'react';
import { useStudentQuery } from '@/lib/hooks';
import { 
  GraduationCap, 
  RefreshCw, 
  StickyNote, 
  LogOut
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Skeleton from '@/components/ui/Skeleton';
import { auth, googleProvider, db } from '@/lib/db';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';

// Shared Types
import { 
  GoogleTask, 
  ClassroomCourse, 
  ClassroomAssignment 
} from '@/types/g-space';

// Components
import SyncTab from '@/components/g-space/SyncTab';
import NotesTab from '@/components/g-space/NotesTab';

export default function GSpacePage() {
  const { data: student, isLoading } = useStudentQuery();
  const [activeTab, setActiveTab] = useState<'sync' | 'notes'>('sync');
  
  // Auth & Sync State
  const [isLinking, setIsLinking] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  
  // Data State
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [classroomCourses, setClassroomCourses] = useState<ClassroomCourse[]>([]);
  const [classroomAssignments, setClassroomAssignments] = useState<ClassroomAssignment[]>([]);
  const [googleTasks, setGoogleTasks] = useState<GoogleTask[]>([]);
  const [taskListId, setTaskListId] = useState<string | null>(null);
  
  // UI State
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', notes: '' });

  // Load Integration Data
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

  // --- API Actions ---

  const handleGoogleVerify = async () => {
    if (!student?.id) {
      toast.error('Student session not found.');
      return;
    }

    setIsLinking(true);
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account consent' });
      const result = await signInWithPopup(auth, googleProvider);
      const googleEmail = result.user.email;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (googleEmail && token) {
        setLinkedEmail(googleEmail);
        setGoogleAccessToken(token);
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
      await deleteDoc(doc(db, 'students', student.id, 'integrations', 'google'));
      setLinkedEmail(null);
      setGoogleAccessToken(null);
      setGoogleEvents([]);
      setClassroomCourses([]);
      setClassroomAssignments([]);
      setGoogleTasks([]);
      setTaskListId(null);
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

      if (!listResponse.ok) return;

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
        } catch (e) {}
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
              ownerName: course.ownerName,
              title: cw.title,
              description: cw.description,
              dueDate: cw.dueDate,
              dueTime: cw.dueTime,
              alternateLink: cw.alternateLink,
              state: cw.state
            }));
            allAssignments.push(...assignments);
          }
        } catch (e) {}
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

  const handleAddNote = async () => {
    if (!googleAccessToken || !taskListId || !newNote.title.trim()) return;
    setIsFetching(true);
    try {
      const response = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newNote.title, notes: newNote.notes })
      });

      if (response.ok) {
        toast.success('Note added');
        setNewNote({ title: '', notes: '' });
        setIsAddingNote(false);
        fetchGoogleTasks(googleAccessToken);
      }
    } catch (error) {
      toast.error('Error adding note');
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

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20 lg:pb-0">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Navigation */}
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
                <p className="text-xs font-bold truncate text-foreground">{linkedEmail || 'Not Linked'}</p>
              </div>
              {linkedEmail && (
                <button onClick={handleSignOut} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="lg:hidden h-16 border-b border-border flex items-center justify-between px-4 bg-card">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm">G-Space</span>
            </div>
            {linkedEmail && (
              <button onClick={handleSignOut} className="p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/10 rounded-full transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </header>

          <div className="lg:hidden flex items-center gap-1 bg-muted/30 p-2 border-b border-border overflow-x-auto no-scrollbar">
            {[
              { id: 'sync', name: 'Sync', icon: RefreshCw },
              { id: 'notes', name: 'Notes', icon: StickyNote },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'sync' && (
                <SyncTab 
                  student={student}
                  linkedEmail={linkedEmail}
                  isLinking={isLinking}
                  isFetching={isFetching}
                  googleAccessToken={googleAccessToken}
                  classroomCourses={classroomCourses}
                  classroomAssignments={classroomAssignments}
                  handleGoogleVerify={handleGoogleVerify}
                  fetchAllData={fetchAllData}
                />
              )}
              {activeTab === 'notes' && (
                <NotesTab 
                  linkedEmail={linkedEmail}
                  isLinking={isLinking}
                  isFetching={isFetching}
                  googleTasks={googleTasks}
                  handleGoogleVerify={handleGoogleVerify}
                  setIsAddingNote={setIsAddingNote}
                  handleToggleTaskStatus={handleToggleTaskStatus}
                  handleDeleteNote={handleDeleteNote}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isAddingNote} 
        onClose={() => setIsAddingNote(false)}
        title={<h3 className="text-lg font-bold">Create New Note</h3>}
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <input type="text" placeholder="Title" value={newNote.title} onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary focus:bg-background transition-all" />
          <textarea placeholder="Notes" rows={5} value={newNote.notes} onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })} className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary focus:bg-background transition-all resize-none" />
          <div className="flex gap-3">
            <button onClick={() => setIsAddingNote(false)} className="flex-1 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-all">Discard</button>
            <button onClick={handleAddNote} disabled={!newNote.title.trim() || isFetching} className="flex-[2] py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow-sm hover:opacity-90 disabled:opacity-50 transition-all active:scale-95">
              {isFetching ? 'Syncing...' : 'Save Note'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
