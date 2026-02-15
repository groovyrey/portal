'use client';

import { useState, useEffect } from 'react';
import { LoginResponse, Student } from '../types';
import LoginForm from '../components/LoginForm';
import DashboardHeader from '../components/DashboardHeader';
import FinancialSummary from '../components/FinancialSummary';
import ScheduleTable from '../components/ScheduleTable';
import PersonalInfo from '../components/PersonalInfo';
import Prospectus from '../components/Prospectus';
import GradesList from '../components/GradesList';

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
        setStudent(result.data);
        setPassword(pass);
        if (result.debugLog) setDebugLog(result.debugLog);
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
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-lg bg-white/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-1.5 text-white">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">Student Portal</span>
            </div>
            <div className="flex items-center">
               <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                 Connected
               </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <DashboardHeader student={student} onLogout={handleLogout} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {student.financials && <FinancialSummary financials={student.financials} />}
            {student.availableReports && <GradesList reports={student.availableReports} userId={student.id} password={password} />}
            {student.schedule && <ScheduleTable schedule={student.schedule} />}
            {student.prospectus && <Prospectus prospectus={student.prospectus} />}
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
