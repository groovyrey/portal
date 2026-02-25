'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Search, Save, Loader2, Check, Settings2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { BADGE_LIST } from '@/lib/badges';
import BadgeDisplay from '@/components/shared/BadgeDisplay';
import Modal from '@/components/ui/Modal';
import { useStudentQuery } from '@/lib/hooks';
import { useRouter } from 'next/navigation';

interface ManagedStudent {
  id: string;
  name: string;
  course: string;
  badges: string[];
}

export default function AdminPage() {
  const [students, setStudents] = useState<ManagedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ManagedStudent | null>(null);

  const { data: currentUser, isLoading: isUserLoading } = useStudentQuery();
  const router = useRouter();

  // Authentication check
  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!currentUser || !currentUser.badges?.includes('staff')) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-6">
          <div className="bg-red-50 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-red-500">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Access Denied</h1>
            <p className="text-sm font-bold text-slate-400">You do not have permission to view this page.</p>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const fetchStudents = async (query: string) => {
    if (!query.trim()) {
      setStudents([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/admin/students?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      } else {
        toast.error(data.error || 'Failed to fetch students');
      }
    } catch (err) {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents(searchTerm);
  };

  const toggleBadge = async (studentId: string, badgeId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const currentBadges = student.badges || [];
    const newBadges = currentBadges.includes(badgeId)
      ? currentBadges.filter(id => id !== badgeId)
      : [...currentBadges, badgeId];

    setUpdatingId(studentId);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badges: newBadges }),
      });

      const data = await res.json();
      if (data.success) {
        const updatedStudents = students.map(s => 
          s.id === studentId ? { ...s, badges: newBadges } : s
        );
        setStudents(updatedStudents);
        
        if (selectedStudent?.id === studentId) {
          setSelectedStudent({ ...selectedStudent, badges: newBadges });
        }
        
        toast.success('Badges updated');
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <main className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Badge Management</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Admin Control Panel</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or student ID..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center">
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                      <span className="text-xs font-bold text-slate-400 uppercase">Searching Registry...</span>
                    </td>
                  </tr>
                ) : !hasSearched ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-20 text-center">
                      <Search className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type a name or ID to search students</p>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-xs">
                      No students found
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{student.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{student.id} • {student.course}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-600 font-black py-2 px-4 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* User Management Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight leading-none">Manage User</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {selectedStudent?.name}
              </p>
            </div>
          </div>
        }
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-8">
          {/* Badge Assignment Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Badge Assignment</h4>
              <BadgeDisplay badgeIds={selectedStudent?.badges} size="sm" />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {BADGE_LIST.map((badge) => {
                const isActive = selectedStudent?.badges?.includes(badge.id);
                const isUpdating = updatingId === selectedStudent?.id;
                
                return (
                  <button
                    key={badge.id}
                    onClick={() => selectedStudent && toggleBadge(selectedStudent.id, badge.id)}
                    disabled={isUpdating}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isActive 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-black uppercase tracking-tight">{badge.name}</div>
                        <div className="text-[10px] font-bold opacity-60">{badge.description}</div>
                      </div>
                    </div>
                    
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isActive ? 'bg-blue-600 border-blue-600' : 'border-slate-200'
                    }`}>
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 text-white animate-spin" />
                      ) : isActive ? (
                        <Check className="h-3 w-3 text-white" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50">
             <button
              onClick={() => setSelectedStudent(null)}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95"
            >
              Close Management
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
