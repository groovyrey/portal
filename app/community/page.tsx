'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { Send, User, MessageSquare, Loader2, PenLine, Eye, MoreVertical, Trash2, Heart, X, Plus, BarChart2, ShieldAlert, Lock as LockIcon, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { CommunityPost, Student, CommunityComment } from '@/types';
import Link from 'next/link';
import Drawer from '@/components/layout/Drawer';
import Modal from '@/components/ui/Modal';
import PostReviewModal from '@/components/community/PostReviewModal';
import PostReviewResultModal from '@/components/community/PostReviewResultModal';
import CommunityGuidelinesDrawer from '@/components/community/CommunityGuidelinesDrawer';
import Skeleton from '@/components/ui/Skeleton';
import PostCard from '@/components/community/PostCard';
import { Info, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obfuscateId } from '@/lib/utils';
import { useRef } from 'react';
import { useRealtime } from '@/components/shared/RealtimeProvider';

export default function CommunityPage() {
  const queryClient = useQueryClient();
  const { setActivePostId } = useRealtime();
  const [postsToShow, setPostsToShow] = useState(5);
  const [content, setContent] = useState('');
  const [showPollEditor, setShowPollEditor] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [posting, setPosting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [reviewError, setReviewError] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [student, setStudent] = useState<Student | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const topics = ['All', 'Academics', 'Campus Life', 'Career', 'Well-being', 'General'];
  const postTypes = [
    { id: 'all', label: 'All Content' },
    { id: 'posts', label: 'Posts' },
    { id: 'polls', label: 'Polls' }
  ];
  const sortOptions = [
    { id: 'newest', label: 'Newest' },
    { id: 'popular', label: 'Most Liked' },
    { id: 'commented', label: 'Most Commented' }
  ];

  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [reactors, setReactors] = useState<{id: string, name: string}[] | null>(null);
  const [loadingReactors, setLoadingReactors] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{postId: string, commentId: string} | null>(null);
  const [commentsToShow, setCommentsToShow] = useState<{[key: string]: number}>({});
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const checkStudent = () => {
      const savedStudent = localStorage.getItem('student_data');
      if (savedStudent) {
        setStudent(JSON.parse(savedStudent));
      } else {
        setStudent(null);
      }
    };

    checkStudent();
    window.addEventListener('local-storage-update', checkStudent);
    window.addEventListener('storage', checkStudent);

    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('local-storage-update', checkStudent);
      window.removeEventListener('storage', checkStudent);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

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

  const { data: posts = [], isLoading: loading, isError, error, refetch } = useQuery({
    queryKey: ['community-posts', selectedTopic, debouncedSearch, selectedType, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTopic !== 'All') params.append('topic', selectedTopic);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (sortBy !== 'newest') params.append('sort', sortBy);
      
      const res = await fetch(`/api/community?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      return data.success ? (data.posts as CommunityPost[]) : [];
    }
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
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
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
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
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
    setActivePostId(post.id);
    setCommentsToShow(prev => ({ ...prev, [post.id]: 5 }));
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!student) return;

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
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    } catch (err) {
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
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
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
    setShowReviewModal(true);
    setReviewError(false);
    setReviewResult(null);

    let isUnreviewed = false;
    let result = null;

    try {
      // 1. AI Moderation Check
      const reviewRes = await fetch('/api/ai/review', {
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

      if (!reviewRes.ok) {
        throw new Error('AI Review service unavailable');
      }

      result = await reviewRes.json();
      setReviewResult(result);

      if (result.decision === 'REJECTED') {
        setShowReviewModal(false);
        setShowResultModal(true);
        setPosting(false);
        return;
      }
    } catch (err) {
      console.error('AI Review Error:', err);
      isUnreviewed = true;
      setReviewError(true);
    }

    try {
      // 2. Proceed with posting
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          userName: student?.name || 'Anonymous',
          isUnreviewed,
          topic: result?.topic || 'General',
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
        setShowReviewModal(false);
        setShowResultModal(true); // Show success or error modal
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      } else {
        setShowReviewModal(false);
        toast.error(data.error || 'Failed to post');
      }
    } catch (err) {
      setShowReviewModal(false);
      toast.error('Network error');
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (postId: string, optionIndex: number) => {
    if (!student) return;

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
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    } catch (err) {
      toast.error('Failed to cast vote');
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGuidelines(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <Info className="h-4 w-4" />
              Guidelines
            </button>
            <a 
              href="https://www.markdownguide.org/basic-syntax/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm hover:underline transition-all cursor-help group"
            >
              <ExternalLink className="h-3 w-3" />
              Markdown Help
            </a>
          </div>
        </div>

        {/* Create Post */}
        {student ? (
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
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ ...props }) => (
                          <a 
                            {...props} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 underline hover:text-blue-700 inline-flex items-center gap-0.5"
                          >
                            {props.children}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )
                      }}
                    >
                      {content}
                    </ReactMarkdown>
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
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LockIcon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Login to participate</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">Join our student community to share posts, vote on polls, and join discussions.</p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              Sign In Now
            </Link>
          </div>
        )}

        {/* Search & Main Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, users or polls..."
                className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                  showFilters || selectedType !== 'all' || sortBy !== 'newest'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {(selectedType !== 'all' || sortBy !== 'newest') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xl shadow-slate-200/50 space-y-5 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Sort By</label>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSortBy(opt.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          sortBy === opt.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10'
                            : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Content Type</label>
                  <div className="flex flex-wrap gap-2">
                    {postTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          selectedType === type.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10'
                            : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {(selectedType !== 'all' || sortBy !== 'newest' || searchQuery || selectedTopic !== 'All') && (
                <div className="pt-4 border-t border-slate-50 flex justify-end">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTopic('All');
                      setSelectedType('all');
                      setSortBy('newest');
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Topic Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap border transition-all ${
                  selectedTopic === topic
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-slate-50">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-red-100 text-red-400">
              <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-semibold text-xs uppercase tracking-wider mb-4">Failed to load posts</p>
              <button 
                onClick={() => refetch()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
              >
                Retry Fetching
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-400">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-semibold text-xs uppercase tracking-wider">No posts found</p>
              {(searchQuery || selectedTopic !== 'All' || selectedType !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTopic('All');
                    setSelectedType('all');
                  }}
                  className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              {posts.slice(0, postsToShow).map((post) => (
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
                />
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
        onClose={() => {
          setSelectedPost(null);
          setActivePostId(null);
        }}
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
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ ...props }) => (
                    <a 
                      {...props} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 underline hover:text-blue-700 inline-flex items-center gap-0.5"
                    >
                      {props.children}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )
                }}
              >
                {selectedPost.content}
              </ReactMarkdown>
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
                    onPointerDown={() => student && handlePointerDown(selectedPost.id, (selectedPost.likes || []).length > 0)}
                    onPointerUp={() => student && handlePointerUp(selectedPost.id, (selectedPost.likes || []).includes(student.id))}
                    onPointerLeave={handlePointerLeave}
                    onContextMenu={(e) => e.preventDefault()}
                    disabled={!student}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
                        ${student && (selectedPost.likes || []).includes(student.id) 
                            ? 'bg-red-50 text-red-600' 
                            : !student 
                              ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                    <Heart 
                        className={`h-3.5 w-3.5 ${ student && (selectedPost.likes || []).includes(student.id) ? 'fill-current' : ''}`} 
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
                      const isMe = student && comment.userId === student.id;
                      return (
                        <div key={comment.id} className={`flex gap-4 group items-start pb-6 ${idx !== arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                          <Link 
                            href={`/profile/${obfuscateId(comment.userId)}`}
                            className="shrink-0 group/avatar"
                          >
                            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 group-hover/avatar:bg-blue-50 group-hover/avatar:text-blue-600 transition-colors">
                              {comment.userName.charAt(0)}
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1 gap-4">
                              <Link 
                                href={`/profile/${obfuscateId(comment.userId)}`}
                                className="truncate"
                              >
                                <span className={`text-sm font-bold truncate hover:text-blue-500 transition-colors ${isMe ? 'text-blue-600' : 'text-slate-900'}`}>
                                  {isMe ? 'You' : comment.userName}
                                </span>
                              </Link>
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
              {student ? (
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
              ) : (
                <div className="max-w-2xl mx-auto flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">Log in to join the discussion</p>
                  <Link href="/" className="text-xs font-black uppercase tracking-widest text-blue-600 hover:underline">Sign In</Link>
                </div>
              )}
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

      <PostReviewModal isOpen={showReviewModal} />
      <PostReviewResultModal 
        isOpen={showResultModal} 
        onClose={() => setShowResultModal(false)}
        result={reviewResult}
        isError={reviewError}
      />
      <CommunityGuidelinesDrawer 
        isOpen={showGuidelines} 
        onClose={() => setShowGuidelines(false)} 
      />
    </div>
  );
}
