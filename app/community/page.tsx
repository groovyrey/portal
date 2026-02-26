'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  Send, 
  User, 
  MessageSquare, 
  Loader2, 
  PenLine, 
  Eye, 
  MoreVertical, 
  Trash2, 
  Heart, 
  X, 
  Plus, 
  BarChart2, 
  ShieldAlert, 
  Search, 
  SlidersHorizontal, 
  ChevronDown, 
  Flag 
} from 'lucide-react';
import { CommunityPost, Student } from '@/types';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import PostReviewModal from '@/components/community/PostReviewModal';
import PostReviewResultModal from '@/components/community/PostReviewResultModal';
import CommunityGuidelinesDrawer from '@/components/community/CommunityGuidelinesDrawer';
import Skeleton from '@/components/ui/Skeleton';
import PostCard from '@/components/community/PostCard';
import { ExternalLink } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@/components/shared/RealtimeProvider';

function CommunityContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { setActivePostId } = useRealtime();

  // Read from URL Search Params
  const selectedTopic = searchParams.get('topic') || 'All';
  const searchQuery = searchParams.get('search') || '';
  const selectedType = searchParams.get('type') || 'all';
  const sortBy = searchParams.get('sort') || 'newest';
  const limit = parseInt(searchParams.get('limit') || '5', 10);

  const [postsToShow, setPostsToShow] = useState(limit);
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
  
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [student, setStudent] = useState<Student | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === 'All' || value === 'all' || (key === 'sort' && value === 'newest') || (key === 'limit' && value === '5')) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setPostsToShow(limit);
  }, [limit]);

  const handleLoadMore = () => {
    const nextLimit = postsToShow + 5;
    updateSearchParams({ limit: nextLimit.toString() });
  };

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const checkStudent = () => {
      const savedStudent = localStorage.getItem('student_data');
      if (savedStudent) setStudent(JSON.parse(savedStudent));
    };
    checkStudent();
    window.addEventListener('local-storage-update', checkStudent);
    return () => window.removeEventListener('local-storage-update', checkStudent);
  }, []);

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

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!student) return;
    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action: isLiked ? 'unlike' : 'like' }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    } catch (err) {
      toast.error('Failed to update reaction');
    }
  };

  const handleVote = async (postId: string, optionIndex: number) => {
    if (!student) return;
    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action: 'vote', optionIndex }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    } catch (err) {
      toast.error('Failed to cast vote');
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

      if (!reviewRes.ok) throw new Error('AI Review service unavailable');
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
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          userName: student?.name || 'Anonymous',
          topic: result?.topic || 'General',
          isUnreviewed,
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
        setActiveTab('write');
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        if (!isUnreviewed) {
          setShowReviewModal(false);
          setShowResultModal(true);
        }
      } else {
        toast.error(data.error || 'Failed to post');
        setShowReviewModal(false);
      }
    } catch (err) {
      toast.error('Network error');
      setShowReviewModal(false);
    } finally {
      setPosting(false);
    }
  };

  const openPostModal = (post: CommunityPost) => {
    router.push(`/post/${post.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Community</h1>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          </div>
          <button onClick={() => setShowGuidelines(true)} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-blue-600 transition-colors">
            Guidelines
          </button>
        </div>

        {student ? (
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm transition-all focus-within:border-slate-400">
            <div className="flex border-b border-slate-100">
              <button 
                type="button" 
                onClick={() => setActiveTab('write')}
                className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'write' ? 'text-slate-900 bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Write
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab('preview')}
                className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'preview' ? 'text-slate-900 bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Preview
              </button>
            </div>
            
            <form onSubmit={handlePost} className="p-5 space-y-4">
              <div>
                {activeTab === 'write' ? (
                  <div className="space-y-3">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="What's on your mind?"
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium placeholder:text-slate-300 resize-none min-h-[80px] outline-none"
                    />
                    {showPollEditor && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <BarChart2 className="h-4 w-4 text-slate-600" />
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Poll Details</label>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setShowPollEditor(false)} 
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          <input 
                            value={pollQuestion} 
                            onChange={(e) => setPollQuestion(e.target.value)} 
                            placeholder="Ask a question..." 
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:border-slate-400 transition-all" 
                          />

                          <div className="space-y-2">
                            {pollOptions.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <input 
                                  value={opt} 
                                  onChange={(e) => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }} 
                                  placeholder={`Option ${i+1}`} 
                                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-slate-400 transition-all placeholder:text-slate-300" 
                                />
                              </div>
                            ))}
                            {pollOptions.length < 5 && (
                              <button 
                                type="button" 
                                onClick={() => setPollOptions([...pollOptions, ''])} 
                                className="mt-1 flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:text-blue-700 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                                Add Option
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="min-h-[80px] prose prose-slate prose-sm max-w-none">
                    {content.trim() ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    ) : (
                      <p className="text-slate-300 italic">Preview will appear here...</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex gap-1">
                  <button type="button" onClick={() => setShowPollEditor(!showPollEditor)} className={`p-2 rounded-lg transition-all ${showPollEditor ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`} title="Add Poll"><BarChart2 className="h-4 w-4" /></button>
                </div>
                <button type="submit" disabled={(!content.trim() && !pollQuestion.trim()) || posting} className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-2">
                  {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Post
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto"><User className="h-6 w-6 text-slate-300" /></div>
            <h2 className="text-lg font-bold text-slate-900">Ready to join?</h2>
            <p className="text-xs text-slate-500 font-medium mb-4">Share posts, vote on polls, and join discussions.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95">Sign In</Link>
          </div>
        )}

        {/* Search & Main Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" value={searchQuery} onChange={(e) => updateSearchParams({ search: e.target.value })} placeholder="Search..." className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-400 transition-all" />
              {searchQuery && <button onClick={() => updateSearchParams({ search: null })} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all ${showFilters || selectedType !== 'all' || sortBy !== 'newest' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 shadow-sm'}`}><SlidersHorizontal className="h-3.5 w-3.5" />Filters</button>
          </div>

          {showFilters && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-1">Sort</label>
                  <div className="flex flex-wrap gap-1.5">{sortOptions.map(opt => <button key={opt.id} onClick={() => updateSearchParams({ sort: opt.id })} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${sortBy === opt.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'}`}>{opt.label}</button>)}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-1">Type</label>
                  <div className="flex flex-wrap gap-1.5">{postTypes.map(type => <button key={type.id} onClick={() => updateSearchParams({ type: type.id })} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${selectedType === type.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'}`}>{type.label}</button>)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {topics.map(topic => <button key={topic} onClick={() => updateSearchParams({ topic })} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${selectedTopic === topic ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>{topic}</button>)}
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><div className="space-y-1.5 flex-1"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-2.5 w-16" /></div></div>
                  <div className="space-y-2"><Skeleton className="h-3.5 w-full" /><Skeleton className="h-3.5 w-2/3" /></div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-red-100">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-4">Failed to load posts</p>
              <button onClick={() => refetch()} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors">Retry</button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No posts found</p>
            </div>
          ) : (
            <>
              {posts.slice(0, postsToShow).map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  student={student}
                  onLike={handleLike}
                  onVote={handleVote}
                  onOpen={openPostModal}
                  onFetchReactors={() => {}}
                />
              ))}
              {posts.length > postsToShow && (
                <button onClick={handleLoadMore} className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-all active:scale-95">Load More</button>
              )}
            </>
          )}
        </div>
      </div>

      <PostReviewModal isOpen={showReviewModal} />
      <PostReviewResultModal isOpen={showResultModal} onClose={() => setShowResultModal(false)} result={reviewResult} isError={reviewError} />
      <CommunityGuidelinesDrawer isOpen={showGuidelines} onClose={() => setShowGuidelines(false)} />
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <Skeleton className="h-20 flex-1" />
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-lg" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div>
                <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <CommunityContent />
    </Suspense>
  );
}
