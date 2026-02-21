'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Student, CommunityPost } from '@/types';
import { 
  GraduationCap, 
  ShieldCheck,
  IdCard,
  Loader2,
  Lock,
  MessageSquare,
  Heart,
  MoreVertical,
  Trash2,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { doc, getDoc } from 'firebase/firestore';
import { parseStudentName, deobfuscateId, obfuscateId } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PostCard from '@/components/community/PostCard';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useStudent } from '@/lib/hooks';
import Skeleton from '@/components/ui/Skeleton';

function ProfileContent() {
  const queryClient = useQueryClient();
  const { student: currentUserData, isLoading: isUserLoading } = useStudent();
  const params = useParams();
  const router = useRouter();
  const profileId = deobfuscateId(params.id as string);
  
  const [student, setStudent] = useState<Student | null>(() => {
    if (currentUserData && profileId === currentUserData.id) {
      return currentUserData;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);

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
        try {
          const res = await fetch(`/api/student/profile?id=${profileId}`);
          const result = await res.json();
          if (result.success) {
            setStudent(result.data);
          } else {
            const docRef = doc(db, 'students', profileId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setStudent({
                id: profileId,
                name: data.name,
                parsedName: parseStudentName(data.name),
                course: data.course,
                yearLevel: data.year_level,
                semester: data.semester,
                email: data.email,
                settings: data.settings || {
                  notifications: true,
                  isPublic: true,
                  showAcademicInfo: true
                }
              } as any);
            }
          }
        } catch (err) {
          console.error('Failed to fetch public profile', err);
        } finally {
          setLoading(false);
        }
      } else {
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
    } catch (err) {
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
    } catch (err) {
      toast.error('Failed to cast vote');
    }
  };

  const openPostModal = (post: CommunityPost) => {
    router.push(`/post/${post.id}`);
  };

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
    </div>
  );

  if (!student) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
      <IdCard className="h-12 w-12 text-slate-200 mb-4" />
      <h2 className="text-xl font-bold text-slate-900">Profile Not Found</h2>
      <Link href="/" className="mt-4 text-blue-600 font-semibold">Return Home</Link>
    </div>
  );

  if (isPublicView && student.settings && !student.settings.isPublic) return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
          <Lock className="h-8 w-8 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">This Profile is Private</h2>
        <p className="text-slate-500 max-w-sm mx-auto">
          The student has chosen to keep their profile information private.
        </p>
      </div>
    </div>
  );

  const showAcademic = !isPublicView || (student.settings?.showAcademicInfo ?? true);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/40 border border-slate-100">
        <div className="h-40 sm:h-56 bg-slate-50 relative overflow-hidden" />

        <div className="px-8 sm:px-12 pb-12 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="shrink-0 -mt-16 sm:-mt-20 relative z-10">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2.5rem] overflow-hidden bg-white border-4 border-white shadow-2xl">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=f1f5f9&color=64748b&size=256&font-size=0.33&bold=true`}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-4 pt-2">
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{student.name}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                    {student.id}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Verified Student
                  </div>
                </div>
              </div>

              {showAcademic && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600 tracking-tight">{student.course}</span>
                  </div>
                  <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-600 tracking-tight">Year {student.yearLevel} • Sem {student.semester}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 pt-12 border-t border-slate-50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Feed Activity</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Updates</span>
              </div>
            </div>

            {loadingPosts ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <div className="space-y-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
                    </div>
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <MessageSquare className="h-10 w-10 mx-auto mb-4 text-slate-200" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">No Activity Yet</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Join our student community to share posts</p>
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
                    onFetchReactors={() => {}}
                    isProfileView={true}
                  />
                ))}
                <Link 
                  href="/community" 
                  className="block text-center py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-colors"
                >
                  View All in Community
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 text-blue-600 animate-spin" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
