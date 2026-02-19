'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Student, CommunityPost, CommunityComment } from '@/types';
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
  X,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { doc, getDoc, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { parseStudentName, deobfuscateId, obfuscateId } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PostCard from '@/components/community/PostCard';
import Drawer from '@/components/layout/Drawer';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';

function ProfileContent() {
  const queryClient = useQueryClient();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);
  const params = useParams();
  const router = useRouter();
  const profileId = deobfuscateId(params.id as string);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Community functionality states
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [reactors, setReactors] = useState<{id: string, name: string}[] | null>(null);
  const [loadingReactors, setLoadingReactors] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{postId: string, commentId: string} | null>(null);
  const [commentsToShow, setCommentsToShow] = useState<{[key: string]: number}>({});
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  // ... (keep the rest of the hooks)

  const handlePointerDown = (postId: string, hasLikes: boolean) => {
    longPressTimer.current = setTimeout(() => {
      if (hasLikes) fetchReactors(postId);
      longPressTimer.current = null;
    }, 500);
  };

  const handlePointerUp = (postId: string, isLiked: boolean) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      handleLike(postId, isLiked);
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
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

  const { data: comments = {}, isLoading: loadingCommentsObj } = useQuery({
    queryKey: ['comments', selectedPost?.id],
    queryFn: async () => {
      if (!selectedPost) return {};
      const res = await fetch(`/api/community/comments?postId=${selectedPost.id}`);
      const data = await res.json();
      return data.success ? { [selectedPost.id]: data.comments as CommunityComment[] } : {};
    },
    enabled: !!selectedPost,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      
      const saved = localStorage.getItem('student_data');
      const currentUser = saved ? JSON.parse(saved) : null;
      const currentUserId = currentUser?.id;

      // Determine if we are viewing someone else's profile
      const viewingOthers = !!(profileId && profileId !== currentUserId);
      setIsPublicView(viewingOthers);

      let targetStudent: Student | null = null;

      if (viewingOthers) {
        try {
          const res = await fetch(`/api/student/profile?id=${profileId}`);
          const result = await res.json();
          if (result.success) {
            setStudent(result.data);
          } else {
            // Fallback to Firestore if not found in PG (for transition period)
            const docRef = doc(db, 'students', profileId!);
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
        }
      } else {
        // Viewing own profile
        if (currentUser) {
          targetStudent = currentUser;
          setStudent(currentUser);
        } else {
          // If no local data, try to fetch from /me
          try {
            const res = await fetch('/api/student/me');
            const result = await res.json();
            if (result.success) {
                targetStudent = result.data;
                setStudent(result.data);
            }
          } catch (e) {
            console.error('Failed to fetch own profile', e);
          }
        }
      }

      setLoading(false);
    };

    fetchProfile();
    
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [profileId]);

  const handleLike = async (postId: string, isLiked: boolean) => {
    const saved = localStorage.getItem('student_data');
    const currentUser = saved ? JSON.parse(saved) : null;
    if (!currentUser) return;

    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            postId, 
            action: isLiked ? 'unlike' : 'like' 
        }),
      });

      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ['user-posts', profileId] });
      if (selectedPost?.id === postId) {
          // Also update selected post if drawer is open
          setSelectedPost(prev => prev ? {
              ...prev,
              likes: isLiked 
                ? (prev.likes || []).filter(id => id !== currentUser.id)
                : [...(prev.likes || []), currentUser.id]
          } : null);
      }
    } catch (err) {
      toast.error('Failed to update reaction');
    }
  };

  const handleVote = async (postId: string, optionIndex: number) => {
    const saved = localStorage.getItem('student_data');
    const currentUser = saved ? JSON.parse(saved) : null;
    if (!currentUser) return;

    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            postId, 
            action: 'vote',
            optionIndex
        }),
      });

      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ['user-posts', profileId] });
      // Update selected post if drawer is open
      if (selectedPost?.id === postId && selectedPost.poll) {
          const newOptions = [...selectedPost.poll.options];
          newOptions[optionIndex].votes.push(currentUser.id);
          setSelectedPost({
              ...selectedPost,
              poll: { ...selectedPost.poll, options: newOptions }
          });
      }
    } catch (err) {
      toast.error('Failed to cast vote');
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    const postId = postToDelete;
    setPostToDelete(null);

    const deleteToast = toast.loading('Deleting post...');
    try {
      const res = await fetch('/api/community', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Post deleted', { id: deleteToast });
        queryClient.invalidateQueries({ queryKey: ['user-posts', profileId] });
      } else {
        toast.error(data.error || 'Failed to delete', { id: deleteToast });
      }
    } catch (err) {
      toast.error('Network error', { id: deleteToast });
    }
  };

  const fetchReactors = async (postId: string) => {
    setLoadingReactors(true);
    setReactors([]);
    try {
        const res = await fetch(`/api/community?postId=${postId}`);
        const data = await res.json();
        if (data.success) setReactors(data.reactors);
    } catch (err) {
        toast.error('Failed to load reactors');
    } finally {
        setLoadingReactors(false);
    }
  };

  const handleComment = async (postId: string) => {
    const saved = localStorage.getItem('student_data');
    const currentUser = saved ? JSON.parse(saved) : null;
    if (!newComment.trim() || commenting || !currentUser) return;

    setCommenting(true);
    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content: newComment,
          userName: currentUser.name || 'Anonymous'
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewComment('');
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        queryClient.invalidateQueries({ queryKey: ['user-posts', profileId] });
        toast.success('Comment added!');
      } else {
        toast.error(data.error || 'Failed to add comment');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setCommenting(false);
    }
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    setCommentToDelete({ postId, commentId });
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    const { postId, commentId } = commentToDelete;
    setCommentToDelete(null);

    const deleteToast = toast.loading('Deleting comment...');
    try {
      const res = await fetch(`/api/community/comments?id=${commentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        queryClient.invalidateQueries({ queryKey: ['user-posts', profileId] });
        toast.success('Comment deleted', { id: deleteToast });
      } else {
        toast.error(data.error || 'Failed to delete comment', { id: deleteToast });
      }
    } catch (err) {
      toast.error('Failed to delete comment', { id: deleteToast });
    }
  };

  const openPostModal = (post: CommunityPost) => {
    setSelectedPost(post);
    setCommentsToShow(prev => ({ ...prev, [post.id]: 5 }));
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

  const gradients = [
    'from-pink-500/20 via-purple-500/20 to-indigo-500/20',
    'from-orange-500/20 via-rose-500/20 to-fuchsia-500/20',
    'from-blue-600/20 via-cyan-500/20 to-teal-500/20',
    'from-emerald-500/20 via-lime-500/20 to-yellow-500/20',
    'from-violet-600/20 via-indigo-500/20 to-blue-500/20',
    'from-amber-500/20 via-orange-600/20 to-red-500/20',
    'from-fuchsia-500/20 via-pink-600/20 to-rose-500/20',
    'from-sky-500/20 via-blue-600/20 to-indigo-600/20',
  ];

  const getGradient = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100">
        {/* Banner */}
        <div className={`h-32 sm:h-48 bg-gradient-to-br ${getGradient(student.id)} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Profile Info Area */}
        <div className="px-6 sm:px-10 pb-10 relative">
          {/* Overlapping Avatar */}
          <div className="relative -mt-12 sm:-mt-16 mb-6">
            <div className="inline-block p-1.5 bg-white rounded-[2rem] shadow-lg">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[1.6rem] overflow-hidden border border-slate-50 bg-slate-50">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=f8fafc&color=334155&size=256&font-size=0.33&bold=true`}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Verified Badge - Floating beside avatar */}
            {!isPublicView && (
              <div className="absolute bottom-2 right-[-12px]">
                <div className="bg-green-500 text-white py-1.5 px-3 rounded-xl shadow-lg shadow-green-200 border-2 border-white flex items-center gap-1.5 transition-transform active:scale-95 cursor-default">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {student.parsedName 
                  ? `${student.parsedName.firstName} ${student.parsedName.lastName}`
                  : student.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {showAcademic && (
                   <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px] uppercase tracking-wider">
                     <GraduationCap className="h-3.5 w-3.5" />
                     {student.course}
                   </div>
                )}
                {(!isPublicView || (student.settings?.showStudentId)) && (
                   <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                     <IdCard className="h-3.5 w-3.5" />
                     {student.id}
                   </div>
                )}
              </div>
            </div>
          </div>

          {showAcademic && (
            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all duration-300">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Academic Level</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <p className="text-lg font-bold text-slate-800 tracking-tight">{student.yearLevel}</p>
                </div>
              </div>
              <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all duration-300">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Current Semester</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  <p className="text-lg font-bold text-slate-800 tracking-tight">{student.semester}</p>
                </div>
              </div>
            </div>
          )}

          {/* User Posts Section */}
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Community Posts</h3>
              <span className="text-[10px] font-bold text-slate-300 uppercase">{posts.length} shared</span>
            </div>

            {loadingPosts ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No posts shared yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post: CommunityPost) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    student={student}
                    onLike={handleLike}
                    onVote={handleVote}
                    onDelete={setPostToDelete}
                    onOpen={openPostModal}
                    onFetchReactors={fetchReactors}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
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

      {/* Post Detail Drawer */}
      <Drawer
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title={selectedPost ? `Post by ${selectedPost.userName}` : "Post Details"}
        side="bottom"
      >
        {selectedPost && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-slate-200">
                {selectedPost.userName.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedPost.userName}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {new Date(selectedPost.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="prose prose-slate max-w-none prose-sm font-medium text-slate-700 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedPost.content}</ReactMarkdown>
            </div>

            {selectedPost.poll && (
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-3">
                <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Community Poll</h5>
                <h4 className="text-sm font-bold text-slate-900 mb-4">{selectedPost.poll.question}</h4>
                <div className="space-y-2">
                  {selectedPost.poll.options.map((option, idx) => {
                    const totalVotes = selectedPost.poll?.options.reduce((acc, curr) => acc + curr.votes.length, 0) || 0;
                    const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
                    const hasVoted = selectedPost.poll?.options.some(opt => opt.votes.includes(student?.id || ''));
                    const isSelected = option.votes.includes(student?.id || '');

                    return (
                      <button
                        key={idx}
                        disabled={hasVoted}
                        onClick={() => handleVote(selectedPost.id, idx)}
                        className={`w-full relative h-10 rounded-xl overflow-hidden border transition-all ${
                          hasVoted 
                            ? isSelected ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-white/50'
                            : 'border-slate-200 bg-white hover:border-blue-600/30'
                        }`}
                      >
                        {hasVoted && (
                          <div 
                            className={`absolute inset-y-0 left-0 transition-all duration-1000 ${isSelected ? 'bg-blue-600/10' : 'bg-slate-100/50'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        )}
                        <div className="absolute inset-0 px-4 flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                            {option.text}
                          </span>
                          {hasVoted && (
                            <span className="text-[10px] font-black text-slate-400">
                              {percentage}%
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {selectedPost.poll.options.reduce((acc, curr) => acc + curr.votes.length, 0)} Total Votes
                  </p>
                  {selectedPost.poll.options.some(opt => opt.votes.includes(student?.id || '')) && (
                    <span className="text-[9px] font-bold text-blue-500 uppercase">Voted</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 py-4 border-y border-slate-50">
                <button 
                    onPointerDown={() => handlePointerDown(selectedPost.id, (selectedPost.likes || []).length > 0)}
                    onPointerUp={() => handlePointerUp(selectedPost.id, (selectedPost.likes || []).includes(student?.id || ''))}
                    onPointerLeave={handlePointerLeave}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
                        ${(selectedPost.likes || []).includes(student?.id || '') 
                            ? 'bg-red-50 text-red-600' 
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                    <Heart 
                        className={`h-3.5 w-3.5 ${ (selectedPost.likes || []).includes(student?.id || '') ? 'fill-current' : ''}`} 
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        {(selectedPost.likes || []).length}
                    </span>
                </button>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        {selectedPost.commentCount || 0}
                    </span>
                </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Discussion</h4>
              </div>

              <div className="space-y-6 pb-20">
                {loadingCommentsObj ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  </div>
                ) : (comments[selectedPost.id] || []).length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Be the first to comment</p>
                  </div>
                ) : (
                  <>
                    {(comments[selectedPost.id] || []).slice(0, commentsToShow[selectedPost.id] || 5).map((comment, idx, arr) => {
                      const isMe = comment.userId === student?.id;
                      return (
                        <div key={comment.id} className={`flex gap-4 group items-start pb-6 ${idx !== arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                            {comment.userName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1 gap-4">
                              <span className={`text-sm font-bold truncate ${isMe ? 'text-blue-600' : 'text-slate-900'}`}>
                                {isMe ? 'You' : comment.userName}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                                {isMe && (
                                  <button 
                                    onClick={() => handleDeleteComment(selectedPost.id, comment.id)}
                                    className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    title="Delete comment"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-slate-600 font-medium leading-relaxed break-words">
                              {comment.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {(comments[selectedPost.id] || []).length > (commentsToShow[selectedPost.id] || 5) && (
                      <button
                        onClick={() => setCommentsToShow(prev => ({ 
                          ...prev, 
                          [selectedPost.id]: (prev[selectedPost.id] || 5) + 5 
                        }))}
                        className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        Load More Comments
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sticky/Fixed Comment Input at the bottom of drawer content area */}
            <div className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 z-[170]">
              <div className="max-w-2xl mx-auto flex gap-3 items-center bg-white p-2 rounded-2xl border border-slate-200 focus-within:ring-4 focus-within:ring-blue-600/5 focus-within:border-blue-600 transition-all shadow-sm">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment(selectedPost.id)}
                  placeholder="Share your thoughts..."
                  className="flex-1 bg-transparent border-none px-4 text-sm font-medium focus:outline-none py-2"
                />
                <button
                  disabled={!newComment.trim() || commenting}
                  onClick={() => handleComment(selectedPost.id)}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Reactors Modal */}
      <Modal 
        isOpen={!!reactors} 
        onClose={() => setReactors(null)}
        maxWidth="max-w-xs"
        title={<h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Hearts</h3>}
      >
        <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {loadingReactors ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            </div>
          ) : (
            reactors?.map(user => (
              <Link 
                key={user.id} 
                href={`/profile/${obfuscateId(user.id)}`}
                onClick={() => setReactors(null)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="h-8 w-8 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-[10px]">
                  {user.name.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {user.name}
                </span>
              </Link>
            ))
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!postToDelete} 
        onClose={() => setPostToDelete(null)}
        maxWidth="max-w-xs"
        className="p-6 text-center"
      >
        <div className="h-12 w-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Delete Post?</h3>
        <p className="text-xs text-slate-500 font-medium mb-6">This action cannot be undone. Are you sure you want to remove this post?</p>
        
        <div className="flex flex-col gap-2">
            <button 
                onClick={handleDelete}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-red-600/10"
            >
                Confirm Delete
            </button>
            <button 
                onClick={() => setPostToDelete(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
            >
                Cancel
            </button>
        </div>
      </Modal>

      {/* Comment Delete Confirmation Modal */}
      <Modal 
        isOpen={!!commentToDelete} 
        onClose={() => setCommentToDelete(null)}
        maxWidth="max-w-xs"
        className="p-6 text-center"
      >
        <div className="h-12 w-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Delete Comment?</h3>
        <p className="text-xs text-slate-500 font-medium mb-6">Are you sure you want to remove this comment?</p>
        
        <div className="flex flex-col gap-2">
            <button 
                onClick={confirmDeleteComment}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-red-600/10"
            >
                Confirm Delete
            </button>
            <button 
                onClick={() => setCommentToDelete(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
