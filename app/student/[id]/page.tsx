'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Student, CommunityPost } from '@/types';
import {
  GraduationCap,
  IdCard,
  Loader2,
  Lock,
  MessageSquare,
  Trash2,
  BrainCircuit,
  Circle,
  XCircle,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import PostCard from '@/components/community/PostCard';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useStudent } from '@/lib/hooks';
import { useRealtime } from '@/components/shared/RealtimeProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Skeleton from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import BadgeDisplay from '@/components/shared/BadgeDisplay';

function ProfileContent() {
  const queryClient = useQueryClient();
  const { student: currentUserData, isLoading: isUserLoading } = useStudent();
  const { onlineMembers } = useRealtime();
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;

  const memberStatus = profileId ? onlineMembers.get(profileId) : null;
  const isOnline = !!memberStatus;
  const isStudying = !!memberStatus?.isStudying;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

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

  const handleReport = async (postId: string) => {
    if (!currentUserData) return;
    const reportToast = toast.loading('Reporting...');
    try {
      const res = await fetch('/api/community/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.decision === 'REJECTED') {
          toast.success('Post removed.', { id: reportToast });
          queryClient.invalidateQueries({ queryKey: ['user-posts', profileId] });
        } else {
          toast.info('Report received.', { id: reportToast });
        }
      }
    } catch {
      toast.error('Error occurred', { id: reportToast });
    }
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
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  );

  if (isPrivateProfile) return (
    <div className="max-w-2xl mx-auto py-20 px-4">
      <Card className="text-center p-12">
        <CardContent className="space-y-4">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-muted-foreground" />
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

  const showAcademic = !isPublicView || (student.settings?.showAcademicInfo ?? true);
  const canShowStudentId = !isPublicView || (student.settings?.showStudentId ?? false);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-10">
      <Card className="overflow-hidden">
        <div className="h-32 bg-muted/50" />
        <div className="px-6 pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-12 sm:-mt-16">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-xl">
              <AvatarImage 
                src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${student.id || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffeb99`}
              />
              <AvatarFallback>{student.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left pt-2 space-y-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">{student.name}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  {canShowStudentId && (
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      ID: {student.id}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                    <span className={cn("h-1.5 w-1.5 rounded-full", isOnline ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                    {isOnline ? 'Online' : 'Offline'}
                  </div>
                  {isStudying && (
                    <Badge variant="default" className="bg-primary animate-pulse text-[8px] h-4">
                      Studying
                    </Badge>
                  )}
                </div>
              </div>

              {showAcademic && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <Badge variant="outline" className="gap-1.5 py-1">
                    <GraduationCap className="h-3 w-3 text-primary" />
                    {student.course}
                  </Badge>
                  <Badge variant="outline" className="py-1">
                    Year {student.yearLevel} • Sem {student.semester}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {student.badges && student.badges.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h4 className="text-[10px] uppercase font-bold text-muted-foreground mb-4">Earned Badges</h4>
              <div className="p-4 rounded-md bg-muted/30 border border-dashed">
                <BadgeDisplay
                  badgeIds={student.badges}
                  size="lg"
                  showName={true}
                />
              </div>
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
                onReport={handleReport}
                onDelete={setPostToDelete}
                isProfileView={true}
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
