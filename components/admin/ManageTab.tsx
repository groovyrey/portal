'use client';

import React, { useState } from 'react';
import { Search, Loader2, Settings2, User, ShieldCheck, Check } from 'lucide-react';
import { toast } from 'sonner';
import { BADGE_LIST } from '@/lib/badges';
import BadgeDisplay from '@/components/shared/BadgeDisplay';
import Modal from '@/components/ui/Modal';
import { motion } from 'framer-motion';

interface ManagedStudent {
  id: string;
  name: string;
  course: string;
  badges: string[];
}

export default function ManageTab() {
  const [students, setStudents] = useState<ManagedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ManagedStudent | null>(null);

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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-accent/50">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or student ID..."
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-2 rounded-xl text-sm transition-all shadow-lg shadow-primary/10 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
                    <span className="text-xs font-bold text-muted-foreground uppercase">Searching Registry...</span>
                  </td>
                </tr>
              ) : !hasSearched ? (
                <tr>
                  <td colSpan={2} className="px-6 py-20 text-center">
                    <Search className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Type a name or ID to search students</p>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-muted-foreground font-bold uppercase text-xs">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{student.name}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{student.id} • {student.course}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary/30 hover:text-primary text-muted-foreground font-black py-2 px-4 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95"
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

      {/* User Management Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-foreground uppercase tracking-tight leading-none">Manage User</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
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
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Badge Assignment</h4>
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
                        ? 'bg-primary/5 border-primary/20 text-primary shadow-sm' 
                        : 'bg-card border-border text-muted-foreground hover:border-border hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'}`}>
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-black uppercase tracking-tight">{badge.name}</div>
                        <div className="text-[10px] font-bold opacity-60">{badge.description}</div>
                      </div>
                    </div>
                    
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isActive ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" />
                      ) : isActive ? (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-border">
             <button
              onClick={() => setSelectedStudent(null)}
              className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/10"
            >
              Close Management
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
