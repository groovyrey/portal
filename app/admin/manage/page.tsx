'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, GraduationCap, Loader2, ShieldAlert, ShieldCheck, User, UserSearch, X } from 'lucide-react';
import { useStudentQuery } from '@/lib/hooks';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { BADGE_LIST } from '@/lib/badges';
import { Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function AdminManagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('id');

  const { data: currentUser, isLoading: isUserLoading } = useStudentQuery();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadStudent = useCallback(async (id: string) => {
    setLoadingStudent(true);
    try {
      const params = new URLSearchParams({ search: id });
      const response = await fetch(`/api/admin/students?${params.toString()}`);
      const data = (await response.json()) as { success: boolean; students?: Student[]; error?: string };
      const match = data.success
        ? (data.students || []).find((s) => s.id === id)
        : undefined;
      setSelectedStudent(match || null);
      if (!match) toast.error('Student not found');
    } catch {
      toast.error('Network error occurred');
      setSelectedStudent(null);
    } finally {
      setLoadingStudent(false);
    }
  }, []);

  useEffect(() => {
    if (studentId) {
      loadStudent(studentId);
    } else {
      setSelectedStudent(null);
    }
  }, [studentId, loadStudent]);

  const clearSelection = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('id');
    router.replace(`/admin/manage${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const toggleBadge = async (badgeId: string) => {
    if (!selectedStudent) return;

    const currentBadges = selectedStudent.badges || [];
    const newBadges = currentBadges.includes(badgeId)
      ? currentBadges.filter((id) => id !== badgeId)
      : [...currentBadges, badgeId];

    setUpdatingId(badgeId);

    try {
      const response = await fetch(`/api/admin/students/${selectedStudent.id}/badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badges: newBadges }),
      });

      const data = (await response.json()) as { success: boolean; error?: string };
      if (!data.success) {
        toast.error(data.error || 'Update failed');
        return;
      }

      setSelectedStudent((prev) => (prev ? { ...prev, badges: newBadges } : prev));
      toast.success('Badges updated');
    } catch {
      toast.error('Network error');
    } finally {
      setUpdatingId(null);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex-1 h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!currentUser || !currentUser.badges?.includes('staff')) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full text-center">
          <div className="bg-destructive/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-destructive mb-4">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-sm text-muted-foreground mt-2">
            You do not have permission to manage users.
          </p>
          <Button asChild variant="outline" className="w-full mt-6">
            <a href="/">Return Home</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 lg:pb-0">
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/admin"
                className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Back to Admin"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold tracking-tight truncate">
                  {selectedStudent ? 'Manage Student' : 'User Management'}
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedStudent ? selectedStudent.name : 'Assign academic badges and roles'}
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-xs text-muted-foreground">
              Signed in as <span className="font-semibold text-foreground">{currentUser.name}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          {!studentId && !selectedStudent ? (
            <div className="py-16 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <UserSearch className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight">No student selected</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Head to the Users tab in the Admin panel and click Manage on a student to edit their access here.
              </p>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/admin?tab=manage">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go to Users
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold tracking-tight truncate">{selectedStudent?.name || 'Loading…'}</h2>
                    <button
                      onClick={clearSelection}
                      className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      aria-label="Close student management"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">{selectedStudent?.id}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    {selectedStudent && (
                      <>
                        <Badge variant="outline" className="gap-1 bg-primary/5 text-primary border-primary/20">
                          <GraduationCap className="h-3 w-3" />
                          {selectedStudent.course || 'No course'}
                        </Badge>
                        {selectedStudent.yearLevel && (
                          <Badge variant="secondary" className="text-[10px]">
                            Year {selectedStudent.yearLevel}
                          </Badge>
                        )}
                        {selectedStudent.semester && (
                          <Badge variant="secondary" className="text-[10px]">
                            {selectedStudent.semester}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {loadingStudent ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Academic Status</Label>
                  <div className="grid gap-2">
                    {BADGE_LIST.map((badge) => {
                      const isActive = selectedStudent?.badges?.includes(badge.id);
                      const isUpdating = updatingId === badge.id;

                      return (
                        <button
                          key={badge.id}
                          onClick={() => toggleBadge(badge.id)}
                          disabled={!!updatingId || !selectedStudent}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                            isActive ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/50"
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
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
