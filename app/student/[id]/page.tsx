'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Student, CommunityPost } from '@/types';
import {
  BadgeCheck,
  GraduationCap,
  IdCard,
  Layers,
  Loader2,
  Lock,
  MessageSquare,
  Trash2,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import PostCard from '@/components/community/PostCard';
import ReportModal from '@/components/community/ReportModal';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useStudent } from '@/lib/hooks';
import { useRealtime } from '@/components/shared/RealtimeProvider';
import StudentAvatar from '@/components/shared/StudentAvatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Skeleton from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import BadgeDisplay from '@/components/shared/BadgeDisplay';

function ProfileInfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function ProfileContent() {
  const queryClient = useQueryClient();
  const { student: currentUserData, isLoading: isUserLoading } = useStudent();
  const { onlineMembers } = useRealtime();
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;

  const memberStatus = profileId ? onlineMembers.get(profileId) : null;
  const isOnline = !!memberStatus;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [reportingPost, setReportingPost] = useState<CommunityPost | null>(null);

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['user-posts', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const res = await fetch(`/api/community?userId=${profileId}`);
      const data = await res.json();
      return data.success ? data.posts : [];
    },
    enabled: !!profileId,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) {
        setLoading(false);
        return;
      }

      const currentUserId = currentUserData?.id;
      const viewingOthers = !!(profileId && profileId !== currentUserId);
      setIsPublicView(viewingOthers);

      if (viewingOthers) {
        setLoading(true);
        setIsPrivateProfile(false);

        try {
          const res = await fetch(`/api/student/profile?id=${profileId}`);
          const result = await res.json();

          if (res.status === 403) {
            setIsPrivateProfile(true);
            setStudent(null);
          } else if (result.success) {
            setStudent(result.data);
          } else {
            setStudent(null);
          }
        } catch (err) {
          setStudent(null);
        } finally {
          setLoading(false);
        }
      } else {
        setIsPrivateProfile(false);
        if (currentUserData) {
          setStudent(currentUserData);
          setLoading(false);
        } else if (!isUserLoading) {
          setLoading(true);
          try {
            const res = await fetch('/api/student/me');
            const result = await res.json();
            if (result.success) {
              setStudent(result.data);
            }
          } catch (e) {
          } finally {
            setLoading(false);
          }
        }
      }
    };

    fetchProfile();
  }, [profileId, currentUserData, isUserLoading]);

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!currentUserData) return;
    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action: isLiked ? 'unlike' : 'like' }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ['user-posts', profileId] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    } catch {
      toast.error('Reaction failed');
    }
  };

  const handleVote = async (postId: string, optionIndex: number) => {
    if (!currentUserData) return;
    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action: 'vote', optionIndex }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ['user-posts', profileId] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    } catch {
      toast.error('Vote failed');
    }
  };

  const handleReport = (postId: string) => {
    const post = posts.find((p: CommunityPost) => p.id === postId);
    if (post) setReportingPost(post);
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    const deleteToast = toast.loading('Deleting...');
    try {
      const res = await fetch('/api/community', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: postToDelete })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Post deleted', { id: deleteToast });
        queryClient.invalidateQueries({ queryKey: ['user-posts', profileId] });
      }
    } catch {
      toast.error('Error occurred', { id: deleteToast });
    } finally {
      setPostToDelete(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    </div>
  );

  if (isPrivateProfile) return (
    <div className="max-w-2xl mx-auto py-20 px-4">
      <Card className="text-center p-12">
        <CardContent className="space-y-4">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Private Profile</CardTitle>
          <CardDescription>
            This student has chosen to keep their profile hidden.
          </CardDescription>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/community">Return to Community</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  if (!student) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <XCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-bold">Student not found</h2>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/community">Return to Community</Link>
      </Button>
    </div>
  );

  const isStaff = student.badges?.includes('staff');

  const showAcademic = !isPublicView || (student.settings?.showAcademicInfo ?? true);
  const canShowStudentId = !isPublicView || (student.settings?.showStudentId ?? false);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <Card className="overflow-hidden shadow-sm">
        {/* Cover */}
        <div className="relative h-36 sm:h-44 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent overflow-hidden">
          <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-primary/15 blur-2xl" />
          <div className="absolute -bottom-16 left-1/4 h-36 w-36 rounded-full bg-violet-500/15 blur-2xl" />
        </div>

        <div className="px-5 sm:px-8 pb-6 sm:pb-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-14 sm:-mt-16">
            <div className="relative shrink-0">
              <StudentAvatar
                name={student.name}
                photoUrl={student.profilePhotoUrl}
                className="h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-background shadow-xl"
                fallbackClassName="bg-primary/10 text-primary text-3xl sm:text-4xl font-bold"
              />
              <span
                className={cn(
                  "absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full ring-2 ring-background",
                  isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
                )}
              />
            </div>

            <div className="flex-1 pt-2 sm:pb-1 text-center sm:text-left min-w-0">
              <h1 className={cn("text-2xl sm:text-3xl font-bold tracking-tight", isStaff && 'staff-gradient-text')}>{student.name}</h1>
              {canShowStudentId && (
                <p className="mt-1.5 text-xs font-mono text-muted-foreground">{student.id}</p>
              )}
            </div>
          </div>

          {/* Key info */}
          <Separator className="my-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            {showAcademic && student.course && (
              <ProfileInfoItem icon={<GraduationCap className="h-4 w-4" />} label="Course" value={student.course} />
            )}
            {showAcademic && student.yearLevel && (
              <ProfileInfoItem
                icon={<Layers className="h-4 w-4" />}
                label="Year Level"
                value={`Year ${student.yearLevel}${student.semester ? ` • Sem ${student.semester}` : ''}`}
              />
            )}
            {canShowStudentId && (
              <ProfileInfoItem icon={<IdCard className="h-4 w-4" />} label="Student ID" value={student.id} />
            )}
          </div>

          {/* Badges */}
          {student.badges && student.badges.length > 0 && (
            <div className="mt-8 rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <BadgeCheck className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Badges &amp; Achievements</h4>
              </div>
              <BadgeDisplay
                badgeIds={student.badges}
                size="lg"
                showName={true}
              />
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Activity Feed</h3>
        </div>

        {loadingPosts ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-dashed bg-muted/10">
            <CardContent className="p-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">No recent activity.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {posts.map((post: CommunityPost) => (
              <PostCard
                key={post.id}
                post={post}
                student={currentUserData}
                onLike={handleLike}
                onVote={handleVote}
                onOpen={(p) => router.push(`/post/${p.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="items-center text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle>Delete post?</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col pt-4">
            <Button variant="destructive" onClick={handleDeletePost} className="w-full">Delete</Button>
            <Button variant="ghost" onClick={() => setPostToDelete(null)} className="w-full">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReportModal 
        isOpen={!!reportingPost}
        onClose={() => setReportingPost(null)}
        targetType="post"
        targetId={reportingPost?.id || ''}
        content={reportingPost?.content || ''}
        authorName={reportingPost?.userName || ''}
        onReportSuccess={(decision) => {
          if (decision === 'REJECTED') {
            queryClient.invalidateQueries({ queryKey: ['user-posts', profileId] });
          }
        }}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
