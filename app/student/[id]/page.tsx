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
  BrainCircuit
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import PostCard from '@/components/community/PostCard';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useStudent } from '@/lib/hooks';
import { useRealtime } from '@/components/shared/RealtimeProvider';
import Skeleton from '@/components/ui/Skeleton';
import BadgeDisplay from '@/components/shared/BadgeDisplay';
import Modal from '@/components/ui/Modal';
import Image from 'next/image';

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

  const [student, setStudent] = useState<Student | null>(() => {
    if (currentUserData && profileId === currentUserData.id) {
      return currentUserData;
    }
    return null;
  });
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
          console.error('Failed to fetch public profile', err);
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
            console.error('Failed to fetch own profile', e);
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
      toast.error('Failed to update reaction');
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
      toast.error('Failed to cast vote');
    }
  };

  const handleReport = async (postId: string) => {
    if (!currentUserData) return;

    const toastId = toast.loading('Reporting post to Aegis...');

    try {
      const res = await fetch('/api/community/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.decision === 'REJECTED') {
          toast.success('Post removed: Aegis confirmed community guideline violations.', { id: toastId });
          queryClient.invalidateQueries({ queryKey: ['user-posts', profileId] });
          queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        } else {
          toast.success('Report processed: Aegis determined this post follows community guidelines.', { id: toastId });
        }
      } else {
        toast.error(data.error || 'Failed to report post', { id: toastId });
      }
    } catch {
      toast.error('Network error while reporting', { id: toastId });
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    const deleteToast = toast.loading('Deleting post...');
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
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      } else {
        toast.error(data.error || 'Failed to delete post', { id: deleteToast });
      }
    } catch {
      toast.error('Failed to delete post', { id: deleteToast });
    } finally {
      setPostToDelete(null);
    }
  };

  const openPostModal = (post: CommunityPost) => {
    router.push(`/post/${post.id}`);
  };

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
    </div>
  );

  if (isPrivateProfile) return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm">
        <div className="h-16 w-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
          <Lock className="h-8 w-8 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">This Profile is Private</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          The student has chosen to keep their profile information private.
        </p>
      </div>
    </div>
  );

  if (!student) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
      <IdCard className="h-12 w-12 text-slate-200 mb-4" />
      <h2 className="text-xl font-bold text-foreground">Profile Not Found</h2>
    </div>
  );

  const showAcademic = !isPublicView || (student.settings?.showAcademicInfo ?? true);
  const canShowStudentId = !isPublicView || (student.settings?.showStudentId ?? false);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
        <div className="h-32 sm:h-40 bg-accent relative overflow-hidden" />

        <div className="px-6 sm:px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="shrink-0 -mt-12 sm:-mt-16 relative z-10">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-secondary/50 border-4 border-card shadow-xl flex items-center justify-center">
                <Image 
                  src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${student.id || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffeb99`}
                  alt={`${student.name}'s avatar`}

                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-3 pt-2">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{student.name || '?'}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  {canShowStudentId && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 shadow-sm">
                      <span className="text-[8px] font-black uppercase tracking-[0.15em] text-blue-500 dark:text-blue-400/80">ID</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                        {student.id || '?'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/80 dark:text-muted-foreground">
                    <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    {isOnline ? 'Online' : 'Offline'}
                  </div>
                  {isStudying && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary animate-pulse">
                      <BrainCircuit className="h-3 w-3" />
                      Studying
                    </div>
                  )}
                </div>
              </div>

              {showAcademic && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <div className="flex items-center gap-1.5 bg-accent/80 dark:bg-accent/40 px-3 py-1.5 rounded-xl border border-border/50">
                    <GraduationCap className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                    <span className="text-xs font-bold text-foreground/80 dark:text-foreground/90 tracking-tight">{student.course || '?'}</span>
                  </div>
                  <div className="bg-accent/80 dark:bg-accent/40 px-3 py-1.5 rounded-xl text-xs font-bold text-foreground/80 dark:text-foreground/90 tracking-tight border border-border/50">
                    Year {student.yearLevel || '?'} • Sem {student.semester || '?'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {student.badges && student.badges.length > 0 && (
            <div className="mt-10 pt-8 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <IdCard className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/50 dark:text-foreground/60">Academic Badges</h3>
              </div>
              <div className="bg-accent p-5 rounded-2xl border border-border">
                <BadgeDisplay
                  badgeIds={student.badges}
                  size="lg"
                  showName={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <MessageSquare className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/50 dark:text-foreground/60">Activity Feed</h3>
          </div>
        </div>

        {loadingPosts ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1.5 flex-1"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-2.5 w-16" /></div>
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">No activity recorded</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post: CommunityPost) => (
              <PostCard
                key={post.id}
                post={post}
                student={currentUserData}
                onLike={handleLike}
                onVote={handleVote}
                onOpen={openPostModal}
                onReport={handleReport}
                onDelete={setPostToDelete}
                isProfileView={true}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        maxWidth="max-w-xs"
        className="p-8 text-center"
      >
        <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Trash2 className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Delete Post?</h3>
        <p className="text-xs text-muted-foreground font-bold leading-relaxed mb-8">This action cannot be undone. Are you sure you want to remove this post?</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleDeletePost}
            className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-red-500/10 active:scale-95"
          >
            Delete Post
          </button>
          <button
            onClick={() => setPostToDelete(null)}
            className="w-full py-3.5 bg-accent hover:bg-accent/80 text-muted-foreground text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
