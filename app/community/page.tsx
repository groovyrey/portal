'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { Send, User, MessageSquare, Loader2, PenLine, Eye, MoreVertical, Trash2, Heart, X } from 'lucide-react';
import { CommunityPost, Student } from '@/types';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

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

  const handleDelete = async (postId: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

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
              <div key={post.id} className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-200 transition-colors relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                      {post.userName.charAt(0)}
                    </div>
                    <div>
                      <Link href={`/profile?id=${post.userId}`} className="block">
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
                              handleDelete(post.id);
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
                
                <div className="prose prose-slate max-w-none prose-sm font-medium text-slate-700 leading-relaxed mb-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                    <button 
                        onClick={() => handleLike(post.id, (post.likes || []).includes(student?.id || ''))}
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
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reactors Modal */}
      <AnimatePresence>
        {reactors && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReactors(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xs bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Hearts</h3>
                <button onClick={() => setReactors(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="max-h-60 overflow-y-auto p-2 space-y-1">
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
