'use client';

import { useState, useEffect } from 'react';
import { LoginResponse, Student } from '../types';
import LoginForm from '../components/LoginForm';
import DashboardHeader from '../components/DashboardHeader';
import ScheduleTable from '../components/ScheduleTable';
import PersonalInfo from '../components/PersonalInfo';
import { toast } from 'sonner';
import Skeleton from '../components/Skeleton';
import LoginProgressModal from '../components/LoginProgressModal';

export default function Home() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);

  // ... rest of state and effects ...

  // Initial session check
  useEffect(() => {
    const checkSession = async () => {
      // Optimistic UI: Load from cache if available
      const savedStudent = localStorage.getItem('student_data');
      if (savedStudent) {
        try {
          setStudent(JSON.parse(savedStudent));
        } catch (e) { /* ignore */ }
      }

      try {
        const res = await fetch('/api/student/me');
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setStudent(result.data);
            localStorage.setItem('student_data', JSON.stringify(result.data));
            // Trigger login event
            window.dispatchEvent(new Event('local-storage-update'));
          }
        } else {
          // Session invalid/expired
          if (savedStudent) {
            setStudent(null);
            localStorage.removeItem('student_data');
            window.dispatchEvent(new Event('local-storage-update'));
            toast.error('Session expired. Please log in again.');
          }
        }
      } catch (err) {
        console.error('Session check failed', err);
      } finally {
        setIsInitialized(true);
      }
    };

    checkSession();
  }, []);

  // Update localStorage only for data caching (NO credentials)
  useEffect(() => {
    if (isInitialized) {
      if (student) {
        localStorage.setItem('student_data', JSON.stringify(student));
      } else {
        localStorage.removeItem('student_data');
      }
    }
  }, [student, isInitialized]);

  const handleLogin = async (userId: string, pass: string) => {
    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password: pass }),
      });

      const result: LoginResponse = await response.json();

      if (result.success && result.data) {
        // Clear any old credentials if they exist
        localStorage.removeItem('student_pass'); 
        
        setStudent(result.data);
        toast.success(`Welcome, ${result.data.name}!`);
        
        // Cache data only
        localStorage.setItem('student_data', JSON.stringify(result.data));
        window.dispatchEvent(new Event('local-storage-update'));
      } else {
        const msg = result.error || 'Login failed. Please check your credentials.';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
        await fetch('/api/student/logout', { method: 'POST' });
        toast.success('Logged out successfully.');
    } catch (e) {
        console.error('Logout API failed', e);
    }
    
    setStudent(null);
    setError(undefined);
    localStorage.removeItem('student_data');
    localStorage.removeItem('student_pass'); // Ensure this is gone
    window.dispatchEvent(new Event('local-storage-update'));
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-10 circular" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-[400px] w-full" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <>
        <LoginForm onLogin={handleLogin} loading={loading} error={error} />
        <LoginProgressModal isOpen={loading} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <DashboardHeader student={student} onLogout={handleLogout} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {student.schedule && <ScheduleTable schedule={student.schedule} />}
          </div>
          <div className="lg:col-span-1">
            <PersonalInfo student={student} />
          </div>
        </div>
      </main>
    </div>
  );
}
