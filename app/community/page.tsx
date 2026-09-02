'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { toast } from 'sonner';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Plus, RefreshCcw, MessagesSquare, MessageCircle, BarChart3 } from 'lucide-react';
import { CommunityPost, Student } from '@/types';
import PostCard from '@/components/community/PostCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';

function CommunityContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const selectedTopic = searchParams.get('topic') || 'All';
  const selectedType = searchParams.get('type') || 'all';
  const sortBy = searchParams.get('sort') || 'newest';

  const PAGE_SIZE = 10;
  const [offset, setOffset] = useState(0);
  const [allPosts, setAllPosts] = useState<CommunityPost[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);

  const topics = ['All', 'Academics', 'Campus Life', 'Career', 'Well-being', 'General'];
  const types = [
    { id: 'all', label: 'All', icon: MessagesSquare },
    { id: 'posts', label: 'Posts', icon: MessageCircle },
    { id: 'polls', label: 'Polls', icon: BarChart3 },
  ] as const;
  const sorts = ['newest', 'popular', 'commented'];

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'All' || value === 'all' || (key === 'sort' && value === 'newest'))
        params.delete(key);
      else params.set(key, value);
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const saved = localStorage.getItem('student_data');
    if (saved) setStudent(JSON.parse(saved));
  }, []);

  useEffect(() => {
    setOffset(0);
    setAllPosts([]);
  }, [selectedTopic, selectedType, sortBy]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['community-posts', selectedTopic, selectedType, sortBy, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTopic !== 'All') params.set('topic', selectedTopic);
      if (selectedType !== 'all') params.set('type', selectedType);
      if (sortBy !== 'newest') params.set('sort', sortBy);
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(offset));

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
    if (offset === 0) setAllPosts(data.posts);
    else setAllPosts(p => [...p, ...data.posts]);
    setHasMore(data.hasMore);
  }, [data, offset]);

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
    } catch {
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
    } catch {
      toast.error('Vote failed');
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Community</h1>
            <p className="text-sm text-muted-foreground mt-1">Connect with your fellow LCCians.</p>
          </div>
          <Button onClick={() => router.push('/community/create')}>
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">Sort</span>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {sorts.map(s => (
              <button
                key={s}
                onClick={() => updateParams({ sort: s })}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors",
                  sortBy === s
                    ? "bg-card text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Topics */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {topics.map(t => (
            <button
              key={t}
              onClick={() => updateParams({ topic: t })}
              className={cn(
                "px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap border transition-colors",
                selectedTopic === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          {types.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => updateParams({ type: t.id })}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  selectedType === t.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-5 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">Failed to load posts.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        ) : allPosts.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="w-14 h-14 bg-muted rounded-md flex items-center justify-center mx-auto mb-2">
              <MessagesSquare className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium">No posts found.</p>
            <p className="text-xs text-muted-foreground">Be the first to start a conversation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                student={student}
                onLike={handleLike}
                onVote={handleVote}
                onOpen={(p) => router.push(`/post/${p.id}`)}
              />
            ))}
            {hasMore && (
              <Button variant="outline" className="w-full" onClick={() => setOffset(o => o + PAGE_SIZE)}>
                Load More
              </Button>
            )}
          </div>
        )}

        {/* Floating action button (mobile) */}
        <button
          onClick={() => router.push('/community/create')}
          className="lg:hidden fixed bottom-8 right-8 h-12 w-12 bg-primary text-primary-foreground rounded-md flex items-center justify-center active:scale-95 transition-all"
          aria-label="New post"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<p className="text-center py-20 text-muted-foreground">Loading community...</p>}>
      <CommunityContent />
    </Suspense>
  );
}
