'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { toast } from 'sonner';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  MessageSquare, 
  Trash2, 
  X, 
  Search, 
  SlidersHorizontal, 
  Info,
  Plus,
  RefreshCcw,
  ArrowRight
} from 'lucide-react';
import { CommunityPost, Student } from '@/types';
import CommunityGuidelinesDrawer from '@/components/community/CommunityGuidelinesDrawer';
import Skeleton from '@/components/ui/Skeleton';
import { Label } from '@/components/ui/label';
import PostCard from '@/components/community/PostCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@/components/shared/RealtimeProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
    if (offset === 0) setAllPosts(data.posts);
    else setAllPosts((prev) => [...prev, ...data.posts]);
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
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    } catch (err) {
      toast.error('Could not react to post');
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
    const toastId = toast.loading('Reporting...');
    try {
      const res = await fetch('/api/community/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.decision === 'REJECTED') {
          toast.success('Post removed for policy violation.', { id: toastId });
          queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        } else {
          toast.success('Report received. Content is being monitored.', { id: toastId });
        }
      } else {
        toast.error('Report failed', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error', { id: toastId });
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    const deleteToast = toast.loading('Deleting...');
    try {
      const res = await fetch('/api/community', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: postToDelete })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Post deleted', { id: deleteToast });
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      } else {
        toast.error('Delete failed', { id: deleteToast });
      }
    } catch (e) {
      toast.error('Network error', { id: deleteToast });
    } finally {
      setPostToDelete(null);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Community</h2>
            <p className="text-sm text-muted-foreground">Connect with other students.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowGuidelines(true)}>
            <Info className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchInput && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-0 top-0 h-9 w-9 hover:bg-transparent"
                  onClick={() => setSearchInput('')}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
            <Button 
              variant={showFilters || selectedType !== 'all' || sortBy !== 'newest' ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </Button>
          </div>

          {showFilters && (
            <Card>
              <CardContent className="p-4 grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Sort By</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {sortOptions.map(opt => (
                      <Badge 
                        key={opt.id} 
                        variant={sortBy === opt.id ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1"
                        onClick={() => updateSearchParams({ sort: opt.id })}
                      >
                        {opt.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Type</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {postTypes.map(type => (
                      <Badge 
                        key={type.id} 
                        variant={selectedType === type.id ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1"
                        onClick={() => updateSearchParams({ type: type.id })}
                      >
                        {type.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {topics.map(topic => (
              <Button
                key={topic}
                variant={selectedTopic === topic ? "default" : "secondary"}
                size="sm"
                className="rounded-full h-8 px-4 text-xs"
                onClick={() => updateSearchParams({ topic })}
              >
                {topic}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-20 w-full rounded-md" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-12 text-center space-y-4">
                <p className="text-sm font-medium text-destructive">Could not connect to the community.</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : allPosts.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground">
                <p className="text-sm font-medium">No posts found in this category.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4">
                {allPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    student={student}
                    onLike={handleLike}
                    onVote={handleVote}
                    onOpen={(p) => router.push(`/post/${p.id}`)}
                    onReport={handleReport}
                    onDelete={setPostToDelete}
                  />
                ))}
              </div>
              {hasMore && (
                <Button 
                  variant="outline" 
                  className="w-full h-12" 
                  onClick={handleLoadMore}
                >
                  Load More
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <CommunityGuidelinesDrawer isOpen={showGuidelines} onClose={() => setShowGuidelines(false)} />

      <Link 
        href="/community/create"
        className="fixed bottom-24 right-6 h-14 w-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 md:bottom-8 md:right-8"
      >
        <Plus className="h-6 w-6" />
      </Link>

      <Dialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle>Delete post?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This post will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
            <Button variant="destructive" onClick={handleDeletePost} className="w-full">
              Delete Post
            </Button>
            <Button variant="ghost" onClick={() => setPostToDelete(null)} className="w-full">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-24 w-full rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    }>
      <CommunityContent />
    </Suspense>
  );
}
