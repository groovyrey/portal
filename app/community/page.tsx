'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { toast } from 'sonner';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Trash2, Plus, RefreshCcw } from 'lucide-react';
import { CommunityPost, Student } from '@/types';
import PostCard from '@/components/community/PostCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

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
  const types = ['all', 'posts', 'polls'];
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

  const handleDeletePost = async () => {
    const id = prompt('Enter post ID to delete:');
    if (!id) return;
    try {
      const res = await fetch('/api/community', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Deleted');
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      } else toast.error(data.error || 'Delete failed');
    } catch {
      toast.error('Network error');
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 pb-20">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Community</h2>
          <div className="flex gap-2 text-sm">
            {sorts.map(s => (
              <button key={s} onClick={() => updateParams({ sort: s })} className={sortBy === s ? 'font-bold' : 'text-muted-foreground'}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 text-sm">
          {topics.map(t => (
            <button
              key={t}
              onClick={() => updateParams({ topic: t })}
              className={selectedTopic === t ? 'font-bold' : 'text-muted-foreground'}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-2 text-xs text-muted-foreground">
          {types.map(t => (
            <button
              key={t}
              onClick={() => updateParams({ type: t })}
              className={selectedType === t ? 'font-bold text-foreground' : ''}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : isError ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-muted-foreground">Failed to load posts.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        ) : allPosts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No posts found.</p>
        ) : (
          <div className="space-y-3">
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

        <button
          onClick={() => router.push('/community/create')}
          className="fixed bottom-8 right-8 h-12 w-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-all"
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
