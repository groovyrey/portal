'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Loader2, 
  Send, 
  Trash2, 
  Flag,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import PostCard from '@/components/community/PostCard';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import { CommunityPost, Student, CommunityComment } from '@/types';
import { obfuscateId, deobfuscateId } from '@/lib/utils';
import { useRealtime } from '@/components/shared/RealtimeProvider';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setActivePostId } = useRealtime();
  const postId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [reportingComment, setReportingComment] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{postId: string, commentId: string} | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [reactors, setReactors] = useState<{id: string, name: string}[] | null>(null);
  const [loadingReactors, setLoadingReactors] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  useEffect(() => {
    const savedStudent = localStorage.getItem('student_data');
    if (savedStudent) setStudent(JSON.parse(savedStudent));
    setActivePostId(postId);
    return () => setActivePostId(null);
  }, [postId, setActivePostId]);

  const { data: post, isLoading: loadingPost, error: postError } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await fetch(`/api/community?postId=${postId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch post');
      return data.post as CommunityPost;
    },
    enabled: !!postId,
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await fetch(`/api/community/comments?postId=${postId}`);
      const data = await res.json();
      return data.success ? data.comments as CommunityComment[] : [];
    },
    enabled: !!postId,
  });

  const handleLike = async (id: string, isLiked: boolean) => {
    if (!student) return;
    const previousPost = queryClient.getQueryData(['post', id]);
    
    // Optimistic update
    queryClient.setQueryData(['post', id], (old: any) => ({
      ...old,
      likes: isLiked 
        ? old.likes.filter((uid: string) => uid !== student.id)
        : [...(old.likes || []), student.id]
    }));

    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id, action: isLiked ? 'unlike' : 'like' })
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      queryClient.setQueryData(['post', id], previousPost);
      toast.error('Failed to update like');
    }
  };

  const handleVote = async (id: string, optionIndex: number) => {
    if (!student) return;
    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id, action: 'vote', optionIndex })
      });
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['post', id] });
        toast.success('Vote recorded!');
      } else {
        toast.error(data.error || 'Failed to vote');
      }
    } catch (e) {
      toast.error('Failed to vote');
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
        router.push('/community');
      } else {
        toast.error(data.error || 'Failed to delete post', { id: deleteToast });
      }
    } catch (e) {
      toast.error('Failed to delete post', { id: deleteToast });
    } finally {
      setPostToDelete(null);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || commenting || !student) return;
    setCommenting(true);
    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: newComment, userName: student.name })
      });
      const data = await res.json();
      if (data.success) {
        setNewComment('');
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        queryClient.invalidateQueries({ queryKey: ['post', postId] });
        toast.success('Comment added!');
      } else {
        toast.error(data.error || 'Failed to add comment');
      }
    } catch (e) {
      toast.error('Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  const handleReportComment = async (cId: string) => {
    if (reportingComment) return;
    setReportingComment(cId);
    const reportToast = toast.loading('Aegis is reviewing this comment...');
    try {
      const res = await fetch('/api/community/comments/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: cId })
      });
      const data = await res.json();
      if (data.success) {
        if (data.decision === 'REJECTED') {
          queryClient.invalidateQueries({ queryKey: ['comments', postId] });
          toast.success('Comment removed. Thank you for keeping the community safe!', { id: reportToast, duration: 5000 });
        } else {
          toast.info('Aegis found this comment follows our guidelines.', { id: reportToast, duration: 5000 });
        }
      } else {
        toast.error(data.error || 'Failed to report comment', { id: reportToast });
      }
    } catch (error) {
      toast.error('Failed to report comment', { id: reportToast });
    } finally {
      setReportingComment(null);
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    const { commentId } = commentToDelete;
    setCommentToDelete(null);
    const deleteToast = toast.loading('Deleting comment...');
    try {
      const res = await fetch(`/api/community/comments?id=${commentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        queryClient.invalidateQueries({ queryKey: ['post', postId] });
        toast.success('Comment deleted', { id: deleteToast });
      } else {
        toast.error(data.error || 'Failed to delete comment', { id: deleteToast });
      }
    } catch (e) {
      toast.error('Failed to delete comment', { id: deleteToast });
    }
  };

  const fetchReactors = async (id: string) => {
    setLoadingReactors(true);
    setReactors([]);
    try {
      const res = await fetch(`/api/community?postId=${id}`);
      const data = await res.json();
      if (data.success) setReactors(data.reactors || []);
    } catch (e) {
      toast.error('Failed to fetch reactors');
    } finally {
      setLoadingReactors(false);
    }
  };

  if (postError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm w-full">
          <div className="h-16 w-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Post Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">This post may have been deleted or the link is invalid.</p>
          <Link 
            href="/community" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 truncate">Post Details</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {loadingPost ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9" variant="circular" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-4 pt-4 border-t border-slate-50">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ) : post && (
          <PostCard 
            post={post}
            student={student}
            onLike={handleLike}
            onVote={handleVote}
            onDelete={setPostToDelete}
            onOpen={() => {}} // Already on post page
            onFetchReactors={fetchReactors}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />
        )}

        {/* Comments Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
              Comments ({comments.length})
            </h3>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {loadingComments ? (
              <div className="p-6 space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 items-start">
                    <Skeleton className="h-9 w-9 shrink-0" variant="circular" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No comments yet</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight">Be the first to share your thoughts</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {comments.map((comment, idx) => {
                  const isMe = student && comment.userId === student.id;
                  return (
                    <div key={comment.id} className="p-6 flex gap-4 items-start group">
                      <Link 
                        href={`/profile/${obfuscateId(comment.userId)}`}
                        className="shrink-0"
                      >
                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                          {comment.userName.charAt(0)}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-4">
                          <Link href={`/profile/${obfuscateId(comment.userId)}`} className="truncate">
                            <span className={`text-sm font-bold truncate hover:text-blue-500 transition-colors ${isMe ? 'text-blue-600' : 'text-slate-900'}`}>
                              {isMe ? 'You' : comment.userName}
                            </span>
                          </Link>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                            {isMe ? (
                              <button 
                                onClick={() => setCommentToDelete({ postId: postId, commentId: comment.id })}
                                className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Delete comment"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleReportComment(comment.id)}
                                disabled={reportingComment === comment.id}
                                className={`p-1 rounded-md transition-colors ${reportingComment === comment.id ? 'text-blue-500 animate-pulse' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'}`}
                                title="Report comment"
                              >
                                <Flag className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Comment Input */}
      <div className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 z-[110]">
        {student ? (
          <div className="max-w-2xl mx-auto flex gap-3 items-center bg-white p-2 rounded-2xl border border-slate-200 focus-within:ring-4 focus-within:ring-blue-600/5 focus-within:border-blue-600 transition-all shadow-sm">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              placeholder="Share your thoughts..."
              className="flex-1 bg-transparent border-none px-4 text-sm font-medium focus:outline-none py-2"
            />
            <button
              disabled={!newComment.trim() || commenting}
              onClick={handleComment}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-500">Log in to join the discussion</p>
            <Link href="/" className="text-xs font-black uppercase tracking-widest text-blue-600 hover:underline">Sign In</Link>
          </div>
        )}
      </div>

      {/* Reactors Modal */}
      <Modal 
        isOpen={!!reactors && reactors.length > 0} 
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

      {/* Delete Post Confirmation */}
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
                onClick={handleDeletePost}
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

      {/* Delete Comment Confirmation */}
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
