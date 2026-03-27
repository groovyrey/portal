'use client';

import React, { useMemo, useState } from 'react';
import { Check, Loader2, Search, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { BADGE_LIST } from '@/lib/badges';
import BadgeDisplay from '@/components/shared/BadgeDisplay';
import Modal from '@/components/ui/Modal';
import { Student } from '@/types';

const PAGE_SIZE = 10;

export default function ManageTab() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return students.slice(start, start + PAGE_SIZE);
  }, [students, currentPage]);

  const fetchStudents = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setStudents([]);
      setHasSearched(false);
      setCurrentPage(1);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setCurrentPage(1);

    try {
      const response = await fetch(`/api/admin/students?search=${encodeURIComponent(trimmed)}`);
      const data = (await response.json()) as { success: boolean; students?: Student[]; error?: string };

      if (!data.success) {
        toast.error(data.error || 'Failed to fetch students');
        return;
      }

      setStudents(data.students || []);
    } catch {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchStudents(searchTerm);
  };

  const toggleBadge = async (studentId: string, badgeId: string) => {
    const student = students.find((item) => item.id === studentId);
    if (!student) return;

    const currentBadges = student.badges || [];
    const newBadges = currentBadges.includes(badgeId)
      ? currentBadges.filter((id) => id !== badgeId)
      : [...currentBadges, badgeId];

    setUpdatingId(studentId);

    try {
      const response = await fetch(`/api/admin/students/${studentId}/badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badges: newBadges }),
      });

      const data = (await response.json()) as { success: boolean; error?: string };
      if (!data.success) {
        toast.error(data.error || 'Update failed');
        return;
      }

      setStudents((prev) => prev.map((item) => (item.id === studentId ? { ...item, badges: newBadges } : item)));
      setSelectedStudent((prev) => (prev && prev.id === studentId ? { ...prev, badges: newBadges } : prev));
      toast.success('Badges updated');
    } catch {
      toast.error('Network error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/10">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by student name or ID"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-foreground text-background text-sm font-semibold disabled:opacity-60 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/5 border-b border-border">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-4">Student ID</th>
                <th className="px-4 py-4">Name</th>
                <th className="px-4 py-4">Program</th>
                <th className="px-4 py-4">Year/Sem</th>
                <th className="px-4 py-4">Badges</th>
                <th className="px-4 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Loading students...</span>
                  </td>
                </tr>
              )}

              {!loading && !hasSearched && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                    <p className="text-sm font-medium">Enter a search term to find students.</p>
                  </td>
                </tr>
              )}

              {!loading && hasSearched && students.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                    <p className="text-sm font-medium">No students found matching "{searchTerm}"</p>
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-4 text-xs font-mono text-muted-foreground">{student.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-foreground">{student.name}</td>
                    <td className="px-4 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{student.course}</td>
                    <td className="px-4 py-4 text-xs font-medium">
                      {student.yearLevel || 'N/A'} • {student.semester || 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      <BadgeDisplay badgeIds={student.badges} size="sm" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="px-4 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted/30 transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && students.length > 0 && (
          <div className="p-4 border-t border-border bg-muted/5 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground font-medium">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, students.length)} of {students.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold disabled:opacity-40 hover:bg-muted/30 transition-colors"
              >
                Prev
              </button>
              <span className="text-xs font-semibold text-muted-foreground px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold disabled:opacity-40 hover:bg-muted/30 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title={
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Manage Student Access</span>
          </div>
        }
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold">{selectedStudent?.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{selectedStudent?.id}</p>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Available Badges</p>
            <div className="space-y-2">
              {BADGE_LIST.map((badge) => {
                const active = selectedStudent?.badges?.includes(badge.id) || false;
                const isUpdating = updatingId === selectedStudent?.id;

                return (
                  <button
                    key={badge.id}
                    onClick={() => selectedStudent && toggleBadge(selectedStudent.id, badge.id)}
                    disabled={isUpdating}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border text-left transition-all ${
                      active ? 'border-primary/30 bg-primary/5' : 'border-border hover:bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-md ${active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-tight">{badge.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{badge.description}</p>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                      active ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 animate-spin text-primary-foreground" />
                      ) : active ? (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setSelectedStudent(null)}
            className="w-full px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold active:scale-[0.98] transition-all"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
