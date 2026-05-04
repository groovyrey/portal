'use client';

import React, { useMemo, useState } from 'react';
import { Check, Loader2, Search, ShieldCheck, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { BADGE_LIST } from '@/lib/badges';
import BadgeDisplay from '@/components/shared/BadgeDisplay';
import { Student } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
        toast.error(data.error || 'Failed to fetch');
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

    setUpdatingId(badgeId);

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
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">User Directory</CardTitle>
          <CardDescription>Search and manage student profiles.</CardDescription>
          <div className="pt-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name or Student ID..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Search
              </Button>
            </form>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 text-left">ID</th>
                  <th className="px-6 py-3 text-left">Student</th>
                  <th className="px-6 py-3 text-left hidden md:table-cell">Details</th>
                  <th className="px-6 py-3 text-left">Badges</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" />
                      <p className="text-xs font-medium">Finding students...</p>
                    </td>
                  </tr>
                ) : !hasSearched ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <p className="text-sm font-medium">Enter a search term to begin.</p>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <p className="text-sm font-medium">No matches found for "{searchTerm}"</p>
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{student.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold truncate max-w-[120px] sm:max-w-none">{student.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase truncate max-w-[120px] sm:max-w-none">{student.course}</p>
                      </td>
                      <td className="px-6 py-4 text-xs hidden md:table-cell">
                        {student.yearLevel} • {student.semester}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          <BadgeDisplay badgeIds={student.badges} size="sm" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedStudent(student)}>
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && students.length > 0 && (
            <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                {students.length} results found
              </p>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <p className="text-xs font-medium text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Access Control</DialogTitle>
            <DialogDescription>Assign academic badges and roles.</DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6 py-2">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-bold">{selectedStudent.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedStudent.id}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Academic Status</Label>
                <div className="grid gap-2">
                  {BADGE_LIST.map((badge) => {
                    const isActive = selectedStudent.badges?.includes(badge.id);
                    const isUpdating = updatingId === badge.id;

                    return (
                      <button
                        key={badge.id}
                        onClick={() => toggleBadge(selectedStudent.id, badge.id)}
                        disabled={!!updatingId}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-md border text-left transition-all",
                          isActive ? "border-primary/50 bg-primary/5" : "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheck className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                          <div>
                            <p className="text-xs font-bold uppercase">{badge.name}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{badge.description}</p>
                          </div>
                        </div>
                        {isUpdating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isActive ? (
                          <Check className="h-3 w-3 text-primary" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedStudent(null)} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
