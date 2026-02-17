'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { Send, User, MessageSquare, Loader2, PenLine, Eye, MoreVertical, Trash2, Heart, X, Plus, BarChart2 } from 'lucide-react';
import { CommunityPost, Student, CommunityComment } from '@/types';
import Link from 'next/link';
import Drawer from '@/components/Drawer';

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postsToShow, setPostsToShow] = useState(5);
  const [content, setContent] = useState('');
  const [showPollEditor, setShowPollEditor] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [reactors, setReactors] = useState<{id: string, name: string}[] | null>(null);
  const [loadingReactors, setLoadingReactors] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{postId: string, commentId: string} | null>(null);
  const [comments, setComments] = useState<{[key: string]: CommunityComment[]} >({});
  const [commentsToShow, setCommentsToShow] = useState<{[key: string]: number}>({});
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
        setComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
        }));
        // Update post comment count locally
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) } : p
        ));
        if (selectedPost?.id === postId) {
            setSelectedPost(prev => prev ? { ...prev, commentCount: Math.max(0, (prev.commentCount || 0) - 1) } : null);
        }
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
    if ((!content.trim() && !pollQuestion.trim()) || posting) return;

    setPosting(true);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          userName: student?.name || 'Anonymous',
          poll: showPollEditor && pollQuestion.trim() ? {
            question: pollQuestion,
            options: pollOptions.filter(opt => opt.trim() !== '')
          } : null
        }),
      });

      const data = await res.json();
      if (data.success) {
        setContent('');
        setPollQuestion('');
        setPollOptions(['', '']);
        setShowPollEditor(false);
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

  const handleVote = async (postId: string, optionIndex: number) => {
    if (!student) return;

    const updatePost = (p: CommunityPost) => {
        if (p.id === postId && p.poll) {
            const hasVoted = p.poll.options.some(opt => opt.votes.includes(student.id));
            if (hasVoted) return p;

            const newOptions = [...p.poll.options];
            newOptions[optionIndex] = {
              ...newOptions[optionIndex],
              votes: [...newOptions[optionIndex].votes, student.id]
            };
            return { ...p, poll: { ...p.poll, options: newOptions } };
        }
        return p;
    };

    // Optimistic Update
    setPosts(prev => prev.map(updatePost));
    if (selectedPost?.id === postId) {
        setSelectedPost(prev => prev ? updatePost(prev) : null);
    }

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
    } catch (err) {
      fetchPosts();
      toast.error('Failed to cast vote');
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

            {showPollEditor && (
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Create Poll</span>
                  <button type="button" onClick={() => setShowPollEditor(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Poll Question"
                  className="w-full bg-white border border-blue-100 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                />
                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...pollOptions];
                          newOpts[idx] = e.target.value;
                          setPollOptions(newOpts);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 bg-white border border-blue-100 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          className="p-2 text-slate-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline pt-1"
                    >
                      <Plus className="h-3 w-3" /> Add Option
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold">{student?.name || 'Anonymous'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPollEditor(!showPollEditor)}
                  className={`p-2 rounded-lg transition-colors ${showPollEditor ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                  title="Add Poll"
                >
                  <BarChart2 className="h-5 w-5" />
                </button>
              </div>
              <button
                type="submit"
                disabled={(!content.trim() && !pollQuestion.trim()) || posting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
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
            <>
              {posts.slice(0, postsToShow).map((post) => (
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

                  {post.poll && (
                    <div className="mb-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-3" onClick={(e) => e.stopPropagation()}>
                      <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Community Poll</h5>
                      <h4 className="text-sm font-bold text-slate-900 mb-4">{post.poll.question}</h4>
                      <div className="space-y-2">
                        {post.poll.options.map((option, idx) => {
                          const totalVotes = post.poll?.options.reduce((acc, curr) => acc + curr.votes.length, 0) || 0;
                          const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
                          const hasVoted = post.poll?.options.some(opt => opt.votes.includes(student?.id || ''));
                          const isSelected = option.votes.includes(student?.id || '');

                          return (
                            <button
                              key={idx}
                              disabled={hasVoted}
                              onClick={() => handleVote(post.id, idx)}
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
                          {post.poll.options.reduce((acc, curr) => acc + curr.votes.length, 0)} Total Votes
                        </p>
                        {post.poll.options.some(opt => opt.votes.includes(student?.id || '')) && (
                          <span className="text-[9px] font-bold text-blue-500 uppercase">Voted</span>
                        )}
                      </div>
                    </div>
                  )}

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

                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                              {post.commentCount || 0}
                          </span>
                      </div>
                  </div>
                </div>
              ))}

              {posts.length > postsToShow && (
                <button
                  onClick={() => setPostsToShow(prev => prev + 5)}
                  className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-[0.98]"
                >
                  Load More Posts
                </button>
              )}
            </>
          )}
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
                <div 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg
                        ${(selectedPost.likes || []).includes(student?.id || '') 
                            ? 'bg-red-50 text-red-600' 
                            : 'bg-slate-50 text-slate-500'}`}
                >
                    <Heart 
                        className={`h-3.5 w-3.5 ${ (selectedPost.likes || []).includes(student?.id || '') ? 'fill-current' : ''}`} 
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        {(selectedPost.likes || []).length}
                    </span>
                </div>

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
                {loadingComments[selectedPost.id] ? (
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

            {/* Sticky/Fixed Comment Input at the bottom of drawer content area or separate */}
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

      {/* Comment Delete Confirmation Modal */}
      {commentToDelete && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCommentToDelete(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 p-6 text-center"
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
          </div>
        </div>
      )}
    </div>
  );
}
