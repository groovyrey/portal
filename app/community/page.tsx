'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { Send, User, MessageSquare, Loader2, PenLine, Eye, MoreVertical, Trash2, Heart, X } from 'lucide-react';
import { CommunityPost, Student, CommunityComment } from '@/types';
import Link from 'next/link';

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [reactors, setReactors] = useState<{id: string, name: string}[] | null>(null);
  const [loadingReactors, setLoadingReactors] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [comments, setComments] = useState<{[key: string]: CommunityComment[]} >({});
  const [loadingComments, setLoadingComments] = useState<{[key: string]: boolean}>({});
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    const savedStudent = localStorage.getItem('student_data');
    if (savedStudent) setStudent(JSON.parse(savedStudent));
    fetchPosts();

    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/community');
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch (err) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
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

  const fetchComments = async (postId: string) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/community/comments?postId=${postId}`);
      const data = await res.json();
      if (data.success) {
        setComments(prev => ({ ...prev, [postId]: data.comments }));
      }
    } catch (err) {
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleComment = async (postId: string) => {
    if (!newComment.trim() || commenting) return;

    setCommenting(true);
    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content: newComment,
          userName: student?.name || 'Anonymous'
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewComment('');
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment]
        }));
        
        const updatePost = (p: CommunityPost) => 
          p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p;
        
        setPosts(prev => prev.map(updatePost));
        if (selectedPost?.id === postId) {
            setSelectedPost(prev => prev ? updatePost(prev) : null);
        }
        
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

  const openPostModal = (post: CommunityPost) => {
    setSelectedPost(post);
    if (!comments[post.id]) {
      fetchComments(post.id);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!student) return;

    // Optimistic Update
    setPosts(prev => prev.map(p => {
        if (p.id === postId) {
            const newLikes = isLiked 
                ? (p.likes || []).filter(id => id !== student.id)
                : [...(p.likes || []), student.id];
            return { ...p, likes: newLikes };
        }
        return p;
    }));

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
    } catch (err) {
      // Revert on error
      fetchPosts();
      toast.error('Failed to update reaction');
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
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        toast.error(data.error || 'Failed to delete', { id: deleteToast });
      }
    } catch (err) {
      toast.error('Network error', { id: deleteToast });
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || posting) return;

    setPosting(true);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          userName: student?.name || 'Anonymous' 
        }),
      });

      const data = await res.json();
      if (data.success) {
        setContent('');
        setView('edit');
        toast.success('Post shared!');
        fetchPosts();
      } else {
        toast.error(data.error || 'Failed to post');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              Community
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Connect and share with fellow students.</p>
          </div>
        </header>

        {/* Create Post */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <form onSubmit={handlePost} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setView('edit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === 'edit' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setView('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === 'preview' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Preview
                </button>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Markdown Supported</span>
            </div>

            {view === 'edit' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all resize-none"
              />
            ) : (
              <div className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-xl prose prose-slate prose-sm max-w-none">
                {content.trim() ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                ) : (
                  <p className="text-slate-400 italic">Nothing to preview...</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-slate-500">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold">{student?.name || 'Anonymous'}</span>
              </div>
              <button
                type="submit"
                disabled={!content.trim() || posting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Share
              </button>
            </div>
          </form>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-400">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-semibold text-xs uppercase tracking-wider">No posts yet</p>
            </div>
          ) : (
            posts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => openPostModal(post)}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-200 transition-all cursor-pointer group relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                      {post.userName.charAt(0)}
                    </div>
                    <div>
                      <Link 
                        href={`/profile?id=${post.userId}`} 
                        onClick={(e) => e.stopPropagation()}
                        className="block"
                      >
                          <h4 className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">{post.userName}</h4>
                      </Link>
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeMenu === post.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                        {student?.id === post.userId ? (
                          <button 
                            onClick={() => {
                              setPostToDelete(post.id);
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Post
                          </button>
                        ) : (
                          <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase">No actions</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="prose prose-slate max-w-none prose-sm font-medium text-slate-700 leading-relaxed mb-4 line-clamp-3">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleLike(post.id, (post.likes || []).includes(student?.id || ''));
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
                            ${(post.likes || []).includes(student?.id || '') 
                                ? 'bg-red-50 text-red-600' 
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Heart 
                            className={`h-3.5 w-3.5 ${ (post.likes || []).includes(student?.id || '') ? 'fill-current' : ''}`} 
                        />
                        <span 
                            onClick={(e) => {
                                e.stopPropagation();
                                if ((post.likes || []).length > 0) fetchReactors(post.id);
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider hover:underline"
                        >
                            {(post.likes || []).length}
                        </span>
                    </button>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                            {post.commentCount || 0}
                        </span>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-slate-200">
                  {selectedPost.userName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedPost.userName}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {new Date(selectedPost.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="prose prose-slate max-w-none prose-sm font-medium text-slate-700 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedPost.content}</ReactMarkdown>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Discussion</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                    {selectedPost.commentCount || 0}
                  </span>
                </div>

                <div className="space-y-4">
                  {loadingComments[selectedPost.id] ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    </div>
                  ) : (comments[selectedPost.id] || []).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No comments yet</p>
                    </div>
                  ) : (
                    (comments[selectedPost.id] || []).map(comment => (
                      <div key={comment.id} className="flex gap-3 group">
                        <div className="h-7 w-7 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px] shrink-0 mt-1">
                          {comment.userName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-900">{comment.userName}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl rounded-tl-none border border-slate-100">
                            {comment.content}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50/50 border-t border-slate-100 shrink-0">
              <div className="flex gap-2 items-center bg-white p-1.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-600/10 focus-within:border-blue-600 transition-all shadow-sm">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment(selectedPost.id)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent border-none px-3 text-xs font-medium focus:outline-none py-2"
                />
                <button
                  disabled={!newComment.trim() || commenting}
                  onClick={() => handleComment(selectedPost.id)}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white p-2 rounded-lg transition-all shadow-md shadow-blue-600/10 active:scale-95"
                >
                  {commenting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reactors Modal */}
      {reactors && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setReactors(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Hearts</h3>
              <button onClick={() => setReactors(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {loadingReactors ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                </div>
              ) : (
                reactors.map(user => (
                  <Link 
                    key={user.id} 
                    href={`/profile?id=${user.id}`}
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
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPostToDelete(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 p-6 text-center"
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
          </div>
        </div>
      )}
    </div>
  );
}
