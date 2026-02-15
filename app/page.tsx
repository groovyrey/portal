'use client';

import { useState, useEffect } from 'react';
import { LoginResponse, Student } from '../types';
import LoginForm from '../components/LoginForm';
import DashboardHeader from '../components/DashboardHeader';
import FinancialSummary from '../components/FinancialSummary';
import ScheduleTable from '../components/ScheduleTable';
import PersonalInfo from '../components/PersonalInfo';
import GradesList from '../components/GradesList';
import Link from 'next/link';

export default function Home() {
  const [student, setStudent] = useState<Student | null>(null);
  const [password, setPassword] = useState<string>(''); // Store password for authenticated requests
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [debugLog, setDebugLog] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedStudent = localStorage.getItem('student_data');
    const savedPassword = localStorage.getItem('student_pass');
    const savedDebug = localStorage.getItem('debug_log');
    if (savedStudent && savedPassword) {
      try {
        setStudent(JSON.parse(savedStudent));
        setPassword(savedPassword);
        if (savedDebug) setDebugLog(savedDebug);
      } catch (e) {
        console.error('Failed to parse saved student data');
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (isInitialized) {
      if (student) {
        localStorage.setItem('student_data', JSON.stringify(student));
        localStorage.setItem('student_pass', password);
        if (debugLog) localStorage.setItem('debug_log', debugLog);
      } else {
        localStorage.removeItem('student_data');
        localStorage.removeItem('student_pass');
        localStorage.removeItem('debug_log');
      }
    }
  }, [student, password, debugLog, isInitialized]);

  const handleLogin = async (userId: string, pass: string) => {
    setLoading(true);
    setError(undefined);
    setDebugLog(null);

    try {
      const response = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password: pass }),
      });

      const result: LoginResponse = await response.json();

      if (result.success && result.data) {
        // Set localStorage immediately so the Navbar can see it
        localStorage.setItem('student_data', JSON.stringify(result.data));
        localStorage.setItem('student_pass', pass);
        if (result.debugLog) localStorage.setItem('debug_log', result.debugLog);
        
        setStudent(result.data);
        setPassword(pass);
        if (result.debugLog) setDebugLog(result.debugLog);
        window.dispatchEvent(new Event('local-storage-update'));
        window.dispatchEvent(new Event('storage')); // Trigger standard storage event for good measure
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setStudent(null);
    setPassword('');
    setError(undefined);
    setDebugLog(null);
    localStorage.removeItem('student_data');
    localStorage.removeItem('student_pass');
    localStorage.removeItem('debug_log');
    window.dispatchEvent(new Event('local-storage-update'));
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return <LoginForm onLogin={handleLogin} loading={loading} error={error} />;
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

        {debugLog && (
          <div className="mt-12 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <h3 className="text-white font-black uppercase text-xs tracking-widest">Portal Scraper Diagnostic</h3>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(debugLog);
                  alert('Diagnostic log copied to clipboard!');
                }}
                className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-all border border-white/5 uppercase tracking-tighter"
              >
                Copy Log
              </button>
            </div>
            <textarea 
              readOnly 
              value={debugLog}
              className="w-full h-48 bg-slate-950 text-green-500 font-mono text-[10px] p-4 rounded-xl border border-slate-800 focus:outline-none resize-none"
            />
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Student Portal App. All rights reserved.</p>
      </footer>
    </div>
  );
}
