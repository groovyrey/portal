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
import { useStudent } from '@/lib/hooks';

function ProfileContent() {
  const queryClient = useQueryClient();
  const { student: currentUserData, isLoading: isUserLoading } = useStudent();
  const params = useParams();
  const router = useRouter();
  const profileId = deobfuscateId(params.id as string);
  
  const [student, setStudent] = useState<Student | null>(() => {
    // Immediate initialization if viewing own profile
    if (currentUserData && profileId === currentUserData.id) {
      return currentUserData;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // ... (rest of the states)
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
            // Fallback to Firestore
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
        // Viewing own profile
        if (currentUserData) {
          setStudent(currentUserData);
          setLoading(false);
        } else if (!isUserLoading) {
          // If no local data and user hook is finished, try to fetch from /me
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
    
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [profileId, currentUserData, isUserLoading]);

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
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/40 border border-slate-100">
        {/* Banner - increased height */}
        <div className={`h-40 sm:h-56 bg-gradient-to-br ${getGradient(student.id)} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Profile Header Area */}
        <div className="px-8 sm:px-12 pb-12 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Avatar - overlapping the banner more significantly */}
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
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  {student.parsedName 
                    ? `${student.parsedName.firstName} ${student.parsedName.lastName}`
                    : student.name}
                </h1>
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                  {showAcademic && (
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100/50">
                      {student.course}
                    </span>
                  )}
                  {(!isPublicView || (student.settings?.showStudentId)) && (
                    <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100/50">
                      ID: {student.id}
                    </span>
                  )}
                </div>
              </div>

              {showAcademic && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-6 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Level</span>
                    <span className="text-sm font-bold text-slate-700">{student.yearLevel}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-100 self-end hidden sm:block" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Semester</span>
                    <span className="text-sm font-bold text-slate-700">{student.semester}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Posts Section */}
          <div className="mt-16 space-y-8">
            <div className="flex items-center gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 whitespace-nowrap">Activity</h3>
              <div className="h-px w-full bg-slate-50" />
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
