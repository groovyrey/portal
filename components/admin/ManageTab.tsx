'use client';

import React, { useState, useMemo, memo } from 'react';
import { Search, Loader2, Settings2, User, ShieldCheck, Check, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { BADGE_LIST } from '@/lib/badges';
import BadgeDisplay from '@/components/shared/BadgeDisplay';
import Modal from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '@/types';

// Optimized Row Component
const StudentRow = memo(({ 
  student, 
  onManage 
}: { 
  student: Student; 
  onManage: (s: Student) => void 
}) => (
  <tr className="hover:bg-accent/50 transition-colors group">
    <td className="px-6 py-4 whitespace-nowrap">
      <span className="font-mono text-[10px] font-bold text-muted-foreground bg-accent group-hover:bg-background px-2 py-1 rounded transition-colors">
        {student.id}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className="font-bold text-foreground">{student.name}</span>
    </td>
    <td className="px-6 py-4">
      <span className="text-[10px] font-black text-muted-foreground uppercase truncate block max-w-[200px]">
        {student.course}
      </span>
    </td>
    <td className="px-6 py-4 text-center whitespace-nowrap">
      <span className="text-xs font-black">{student.yearLevel || 'N/A'}</span>
    </td>
    <td className="px-6 py-4 text-center whitespace-nowrap">
      <span className="text-xs font-black">{student.semester || 'N/A'}</span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <BadgeDisplay badgeIds={student.badges} size="sm" />
    </td>
    <td className="px-6 py-4 text-right whitespace-nowrap">
      <button
        onClick={() => onManage(student)}
        className="inline-flex items-center gap-2 bg-transparent border border-border/50 hover:border-primary/30 hover:text-primary text-muted-foreground font-black py-1.5 px-3 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95"
      >
        <Settings2 className="h-3 w-3" />
        Manage
      </button>
    </td>
  </tr>
));

StudentRow.displayName = 'StudentRow';

export default function ManageTab() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchStudents = async (query: string) => {
    if (!query.trim()) {
      setStudents([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setCurrentPage(1);
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
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, badges: newBadges } : s));
        if (selectedStudent?.id === studentId) {
          setSelectedStudent(prev => prev ? { ...prev, badges: newBadges } : null);
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

  // Pagination Logic
  const totalPages = Math.ceil(students.length / pageSize);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return students.slice(start, start + pageSize);
  }, [students, currentPage]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Search Header */}
        <div className="p-4 border-b border-border bg-accent/30">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or student ID..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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

        {/* Custom Data Grid Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-6 py-4 bg-accent/20">Student ID</th>
                <th className="px-6 py-4 bg-accent/20">Name</th>
                <th className="px-6 py-4 bg-accent/20">Program</th>
                <th className="px-6 py-4 bg-accent/20 text-center">Year</th>
                <th className="px-6 py-4 bg-accent/20 text-center">Sem</th>
                <th className="px-6 py-4 bg-accent/20">Badges</th>
                <th className="px-6 py-4 bg-accent/20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.tr 
                    key="loading"
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Accessing Registry...</span>
                    </td>
                  </motion.tr>
                ) : !hasSearched ? (
                  <motion.tr 
                    key="search"
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={7} className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <Search size={48} className="text-muted-foreground" />
                        <p className="text-xs font-black uppercase tracking-[0.3em]">Search Directory</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : students.length === 0 ? (
                  <motion.tr 
                    key="empty"
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={7} className="px-6 py-20 text-center text-muted-foreground font-black uppercase text-[10px] tracking-widest">
                      <Inbox className="h-8 w-8 mx-auto mb-4 opacity-20" />
                      No matches found
                    </td>
                  </motion.tr>
                ) : (
                  paginatedStudents.map((student) => (
                    <StudentRow 
                      key={student.id} 
                      student={student} 
                      onManage={setSelectedStudent} 
                    />
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Optimized Pagination Footer */}
        {students.length > 0 && (
          <div className="p-4 border-t border-border bg-accent/10 flex items-center justify-between">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, students.length)} of {students.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                      currentPage === i + 1 
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110' 
                        : 'hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
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
