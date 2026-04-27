'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { toast } from 'sonner';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  MessageSquare, 
  Eye, 
  MoreVertical, 
  Trash2, 
  Heart, 
  X, 
  BarChart2, 
  ShieldAlert, 
  Search, 
  SlidersHorizontal, 
  ChevronDown, 
  Flag,
  Info,
  Plus
} from 'lucide-react';
import { CommunityPost, Student } from '@/types';
import CommunityGuidelinesDrawer from '@/components/community/CommunityGuidelinesDrawer';
import Skeleton from '@/components/ui/Skeleton';
import PostCard from '@/components/community/PostCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@/components/shared/RealtimeProvider';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';

function CommunityContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { setActivePostId } = useRealtime();

  const selectedTopic = searchParams.get('topic') || 'All';
  const searchQuery = searchParams.get('search') || '';
  const selectedType = searchParams.get('type') || 'all';
  const sortBy = searchParams.get('sort') || 'newest';

  const PAGE_SIZE = 10;
  const [offset, setOffset] = useState(0);
  const [allPosts, setAllPosts] = useState<CommunityPost[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [student, setStudent] = useState<Student | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === 'All' || value === 'all' || (key === 'sort' && value === 'newest')) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleLoadMore = () => {
    setOffset((prev) => prev + PAGE_SIZE);
  };

  const topics = ['All', 'Academics', 'Campus Life', 'Career', 'Well-being', 'General'];
  const postTypes = [
    { id: 'all', label: 'All Content' },
    { id: 'posts', label: 'Posts' },
    { id: 'polls', label: 'Polls' }
  ];
  const sortOptions = [
    { id: 'newest', label: 'Newest' },
    { id: 'popular', label: 'Popular' },
    { id: 'commented', label: 'Active' }
  ];

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateSearchParams({ search: searchInput || null });
      }
      setDebouncedSearch(searchInput);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, searchQuery]);

  useEffect(() => {
    setOffset(0);
    setAllPosts([]);
    setHasMore(false);
  }, [selectedTopic, selectedType, sortBy, debouncedSearch]);

  useEffect(() => {
    const checkStudent = () => {
      const savedStudent = localStorage.getItem('student_data');
      if (savedStudent) setStudent(JSON.parse(savedStudent));
    };

    checkStudent();
    window.addEventListener('local-storage-update', checkStudent);
    return () => window.removeEventListener('local-storage-update', checkStudent);
  }, []);

  const { data, isLoading: loading, isError, refetch } = useQuery({
    queryKey: ['community-posts', selectedTopic, debouncedSearch, selectedType, sortBy, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTopic !== 'All') params.append('topic', selectedTopic);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (sortBy !== 'newest') params.append('sort', sortBy);
      params.append('limit', PAGE_SIZE.toString());
      params.append('offset', offset.toString());

      const res = await fetch(`/api/community?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const result = await res.json();
      return {
        posts: result.success ? (result.posts as CommunityPost[]) : [],
        hasMore: !!result.hasMore,
      };
    },
  });

  useEffect(() => {
    if (!data) return;

    if (offset === 0) {
      setAllPosts(data.posts);
    } else {
      setAllPosts((prev) => [...prev, ...data.posts]);
    }

    setHasMore(data.hasMore);
  }, [data, offset]);

  const posts = allPosts;

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
      toast.error('Reaction failed');
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
      toast.error('Vote failed');
    }
  };

  const handleReport = async (postId: string) => {
    if (!student) return;
    const toastId = toast.loading('Reviewing post protocol...');
    try {
      const res = await fetch('/api/community/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.decision === 'REJECTED') {
          toast.success('Guideline violation confirmed. Post purged.', { id: toastId });
          queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        } else {
          toast.success('Aegis: Content matches community safety protocols.', { id: toastId });
        }
      } else {
        toast.error(data.error || 'Review failed', { id: toastId });
      }
    } catch (err) {
      toast.error('Network protocol error', { id: toastId });
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    const deleteToast = toast.loading('Purging record...');
    try {
      const res = await fetch('/api/community', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: postToDelete })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Post purged', { id: deleteToast });
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      } else {
        toast.error(data.error || 'Purge failed', { id: deleteToast });
      }
    } catch (e) {
      toast.error('Network failure', { id: deleteToast });
    } finally {
      setPostToDelete(null);
    }
  };

  const openPostModal = (post: CommunityPost) => {
    router.push(`/post/${post.id}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-end mb-2">
          <button onClick={() => setShowGuidelines(true)} className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary transition-colors border border-border/50">
            <Info size={16} />
          </button>
        </div>

        {/* Search & Main Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} maxLength={100} placeholder="Search the community..." className="w-full pl-10 pr-10 py-3 surface-neutral border border-border/50 rounded-lg text-[13px] font-black uppercase tracking-tight focus:outline-none focus:border-primary/50 transition-all text-foreground shadow-sm ring-1 ring-black/5" />
              {searchInput && <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-5 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${showFilters || selectedType !== 'all' || sortBy !== 'newest' ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'surface-neutral text-muted-foreground border-border/50 hover:border-muted-foreground shadow-sm'}`}><SlidersHorizontal className="h-3.5 w-3.5" />Refine Feed</button>
          </div>

          {showFilters && (
            <div className="surface-neutral rounded-lg border border-border/50 p-5 shadow-sm ring-1 ring-black/5 space-y-5 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Order By</label>
                  <div className="flex flex-wrap gap-2">{sortOptions.map(opt => <button key={opt.id} onClick={() => updateSearchParams({ sort: opt.id })} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all ${sortBy === opt.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border/50 hover:border-muted-foreground'}`}>{opt.label}</button>)}</div>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Type</label>
                  <div className="flex flex-wrap gap-2">{postTypes.map(type => <button key={type.id} onClick={() => updateSearchParams({ type: type.id })} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all ${selectedType === type.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border/50 hover:border-muted-foreground'}`}>{type.label}</button>)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {topics.map(topic => <button key={topic} onClick={() => updateSearchParams({ topic })} className={`px-4 py-2 rounded-md text-[9px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${selectedTopic === topic ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-muted/30 text-muted-foreground border-border/50 hover:border-muted-foreground'}`}>{topic}</button>)}
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="surface-neutral rounded-xl p-6 border border-border/50 space-y-4 shadow-sm ring-1 ring-black/5">
                  <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-lg" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="surface-neutral text-center py-20 rounded-xl border border-red-500/20 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6">Connection Interrupted</p>
              <button onClick={() => refetch()} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-colors shadow-lg shadow-primary/10">Retry Connection</button>
            </div>
          ) : posts.length === 0 ? (
            <div className="surface-neutral text-center py-20 rounded-xl border border-border/50 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No posts found in this category</p>
            </div>
          ) : (
            <>
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  student={student}
                  onLike={handleLike}
                  onVote={handleVote}
                  onOpen={openPostModal}
                  onReport={handleReport}
                  onDelete={setPostToDelete}
                />
              ))}
              {hasMore && (
                <button onClick={handleLoadMore} className="w-full py-4 surface-neutral border border-border/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all active:scale-[0.99] shadow-sm ring-1 ring-black/5">Load More Posts</button>
              )}
            </>
          )}
        </div>
      </div>

      <CommunityGuidelinesDrawer isOpen={showGuidelines} onClose={() => setShowGuidelines(false)} />

      {/* Floating Create Button */}
      <Link 
        href="/community/create"
        className="fixed bottom-24 right-6 h-14 w-14 bg-foreground text-background rounded-xl shadow-2xl shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 md:hidden border border-white/10"
      >
        <Plus className="h-7 w-7" />
      </Link>

      <Modal 
        isOpen={!!postToDelete} 
        onClose={() => setPostToDelete(null)}
        maxWidth="max-w-xs"
        className="p-10 text-center"
      >
        <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-red-500/10">
            <Trash2 className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-black text-foreground mb-3 uppercase tracking-tight">Delete Post?</h3>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed mb-10">This post will be permanently removed from the LCCians community database.</p>
        <div className="flex flex-col gap-3">
            <button 
                onClick={handleDeletePost}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-red-500/20 active:scale-95"
            >
                Confirm Delete
            </button>
            <button 
                onClick={() => setPostToDelete(null)}
                className="w-full py-4 bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
            >
                Cancel
            </button>
        </div>
      </Modal>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-48 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <div className="surface-neutral rounded-xl p-6 border border-border/50">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-12 flex-1 rounded-lg" />
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="surface-neutral rounded-xl p-6 border border-border/50 space-y-4">
                <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-lg" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div>
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
