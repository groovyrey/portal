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
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200">
                <MessageSquare className="h-7 w-7" />
              </div>
              Community Feed
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Connect and share with fellow LCCians.</p>
          </div>
        </header>

        {/* Create Post */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <form onSubmit={handlePost} className="p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setView('edit')}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'edit' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  <PenLine className="h-3 w-3" /> Write
                </button>
                <button
                  type="button"
                  onClick={() => setView('preview')}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'preview' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  <Eye className="h-3 w-3" /> Preview
                </button>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Markdown Supported</span>
            </div>

            {view === 'edit' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? (Use Markdown for formatting)"
                className="w-full min-h-[150px] p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all resize-none"
              />
            ) : (
              <div className="w-full min-h-[150px] p-6 bg-slate-50 border border-slate-100 rounded-3xl prose prose-slate prose-sm max-w-none overflow-y-auto">
                {content.trim() ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                ) : (
                  <p className="text-slate-400 italic">Nothing to preview...</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold">{student?.name || 'Anonymous'}</span>
              </div>
              <button
                type="submit"
                disabled={!content.trim() || posting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Share Post
              </button>
            </div>
          </form>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-slate-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold uppercase text-xs tracking-widest">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:border-indigo-100 transition-all group animate-in fade-in slide-in-from-bottom-4 relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                      {post.userName.charAt(0)}
                    </div>
                    <div>
                      <Link href={`/profile?id=${post.userId}`} className="block group/name">
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover/name:text-indigo-600 transition-colors">{post.userName}</h4>
                      </Link>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(post.createdAt).toLocaleDateString()} @ {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Options Menu */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)}
                      className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {activeMenu === post.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in zoom-in-95 duration-200">
                        {student?.id === post.userId ? (
                          <button 
                            onClick={() => {
                              handleDelete(post.id);
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Post
                          </button>
                        ) : (
                          <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">No actions available</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="prose prose-slate max-w-none prose-sm font-medium text-slate-700 leading-relaxed mb-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                    <button 
                        onClick={() => handleLike(post.id, (post.likes || []).includes(student?.id || ''))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all active:scale-95 group/pill
                            ${(post.likes || []).includes(student?.id || '') 
                                ? 'bg-red-50 text-red-600' 
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                        <Heart 
                            className={`h-4 w-4 transition-transform group-hover/pill:scale-110 ${ (post.likes || []).includes(student?.id || '') ? 'fill-current' : ''}`} 
                        />
                        <span 
                            onClick={(e) => {
                                e.stopPropagation(); // Prevents the 'like' toggle
                                if ((post.likes || []).length > 0) fetchReactors(post.id);
                            }}
                            className="text-[10px] font-black uppercase tracking-widest hover:underline cursor-pointer"
                        >
                            {(post.likes || []).length} { (post.likes || []).length === 1 ? 'Heart' : 'Hearts'}
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Hearts</h3>
                <button onClick={() => setReactors(null)} className="p-2 rounded-xl hover:bg-white transition-all text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
                {loadingReactors ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                  </div>
                ) : reactors.length === 0 ? (
                  <p className="text-center py-8 text-xs font-bold text-slate-400 uppercase">No reactions found</p>
                ) : (
                  reactors.map(user => (
                    <Link 
                      key={user.id} 
                      href={`/profile?id=${user.id}`}
                      onClick={() => setReactors(null)}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs group-hover:bg-indigo-600 transition-colors">
                        {user.name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-slate-700 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
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
