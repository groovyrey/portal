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
  Info
} from 'lucide-react';
import { CommunityPost, Student } from '@/types';
import CommunityGuidelinesDrawer from '@/components/community/CommunityGuidelinesDrawer';
import Skeleton from '@/components/ui/Skeleton';
import PostCard from '@/components/community/PostCard';
import CreatePostCard from '@/components/community/CreatePostCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@/components/shared/RealtimeProvider';
import Modal from '@/components/ui/Modal';
import Drawer from '@/components/layout/Drawer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

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
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [student, setStudent] = useState<Student | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

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

  const handleReport = async (postId: string) => {
    if (!student) return;
    
    const toastId = toast.loading('Reporting post to AI...');
    
    try {
      const res = await fetch('/api/community/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (data.decision === 'REJECTED') {
          toast.success('Post removed: AI analysis confirmed community guideline violations.', { id: toastId });
          queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        } else {
          toast.success('Report processed: AI determined this post follows community guidelines.', { id: toastId });
        }
      } else {
        toast.error(data.error || 'Failed to report post', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error while reporting', { id: toastId });
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    const deleteToast = toast.loading('Deleting post...');
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
        toast.error(data.error || 'Failed to delete post', { id: deleteToast });
      }
    } catch (e) {
      toast.error('Failed to delete post', { id: deleteToast });
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Community</h1>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsInfoDrawerOpen(true)}
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Info className="h-3.5 w-3.5" />
              Formatting
            </button>
            <div className="w-[1px] h-3 bg-border" />
            <button onClick={() => setShowGuidelines(true)} className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight hover:text-primary transition-colors">
              Guidelines
            </button>
          </div>
        </div>

        <CreatePostCard student={student} />

        {/* Search & Main Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={(e) => updateSearchParams({ search: e.target.value })} placeholder="Search..." className="w-full pl-9 pr-9 py-2 bg-card border border-border rounded-xl text-sm font-medium focus:outline-none focus:border-primary transition-all text-foreground" />
              {searchQuery && <button onClick={() => updateSearchParams({ search: null })} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all ${showFilters || selectedType !== 'all' || sortBy !== 'newest' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground shadow-sm'}`}><SlidersHorizontal className="h-3.5 w-3.5" />Filters</button>
          </div>

          {showFilters && (
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-1">Sort</label>
                  <div className="flex flex-wrap gap-1.5">{sortOptions.map(opt => <button key={opt.id} onClick={() => updateSearchParams({ sort: opt.id })} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${sortBy === opt.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent text-muted-foreground border-border hover:border-muted-foreground'}`}>{opt.label}</button>)}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-1">Type</label>
                  <div className="flex flex-wrap gap-1.5">{postTypes.map(type => <button key={type.id} onClick={() => updateSearchParams({ type: type.id })} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${selectedType === type.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent text-muted-foreground border-border hover:border-muted-foreground'}`}>{type.label}</button>)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {topics.map(topic => <button key={topic} onClick={() => updateSearchParams({ topic })} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${selectedTopic === topic ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground'}`}>{topic}</button>)}
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-card rounded-xl p-5 border border-border space-y-4">
                  <div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><div className="space-y-1.5 flex-1"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-2.5 w-16" /></div></div>
                  <div className="space-y-2"><Skeleton className="h-3.5 w-full" /><Skeleton className="h-3.5 w-2/3" /></div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-red-500/20">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-4">Failed to load posts</p>
              <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-colors">Retry</button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No posts found</p>
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
                  onReport={handleReport}
                  onDelete={setPostToDelete}
                />
              ))}
              {posts.length > postsToShow && (
                <button onClick={handleLoadMore} className="w-full py-3 bg-card border border-border rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all active:scale-95">Load More</button>
              )}
            </>
          )}
        </div>
      </div>

      <CommunityGuidelinesDrawer isOpen={showGuidelines} onClose={() => setShowGuidelines(false)} />

      {/* Info Drawer */}
      <Drawer
        isOpen={isInfoDrawerOpen}
        onClose={() => setIsInfoDrawerOpen(false)}
        title="Post Formatting Guide"
        side="right"
      >
        <div className="space-y-10 pb-10">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Express yourself clearly using these formatting tools. All posts are rendered with GitHub Flavored Markdown and LaTeX support.
            </p>
            <div className="flex flex-wrap gap-2">
               <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-tight rounded border border-primary/20">Markdown</span>
               <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-tight rounded border border-primary/20">LaTeX</span>
               <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-[8px] font-bold uppercase tracking-tight rounded border border-border">Syntax Highlighting</span>
            </div>
          </div>

          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-tight text-primary flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Typography & Lists
            </h3>
            <div className="bg-accent/40 rounded-xl border border-border/50 overflow-hidden text-left shadow-sm">
              <div className="px-4 py-2 bg-accent/60 border-b border-border/50 flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">Syntax</span>
              </div>
              <pre className="p-4 text-[10px] font-mono text-foreground whitespace-pre-wrap leading-relaxed bg-accent/20">
{"# Heading 1\n## Heading 2\n\n**Bold** and *Italic*\n~~Strikethrough~~\n\n- Unordered list\n1. Ordered list\n- [ ] Task incomplete\n- [x] Task completed"}
              </pre>
              <div className="px-4 py-2 bg-accent/60 border-t border-border/50 border-b border-border/50">
                <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">Output</span>
              </div>
              <div className="p-5 prose prose-sm dark:prose-invert max-w-none bg-card/30">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => <h1 className="text-lg font-bold text-foreground mt-4 mb-2 pb-1 border-b border-border/50 uppercase tracking-tight">{children}</h1>,
                    h2: ({children}) => <h2 className="text-base font-bold text-foreground mt-3 mb-2 tracking-tight">{children}</h2>,
                    ul: ({...props}) => <ul className="list-disc list-outside ml-5 my-3 space-y-1" {...props} />,
                    ol: ({...props}) => <ol className="list-decimal list-outside ml-5 my-3 space-y-1" {...props} />,
                    p: ({children}) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                  }}
                >
{"# Heading 1\n## Heading 2\n\n**Bold** and *Italic*\n~~Strikethrough~~\n\n- Unordered list\n1. Ordered list\n- [ ] Task incomplete\n- [x] Task completed"}
                </ReactMarkdown>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-tight text-primary flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Advanced Layout
            </h3>
            <div className="bg-accent/40 rounded-xl border border-border/50 overflow-hidden text-left shadow-sm">
              <div className="px-4 py-2 bg-accent/60 border-b border-border/50">
                <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">Syntax</span>
              </div>
              <pre className="p-4 text-[10px] font-mono text-foreground whitespace-pre-wrap leading-relaxed bg-accent/20">
{"> Blockquote\n\n| Subject | Grade |\n| :--- | :---: |\n| Math | A+ |\n| Sci | A |"}
              </pre>
              <div className="px-4 py-2 bg-accent/60 border-t border-border/50 border-b border-border/50">
                <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">Output</span>
              </div>
              <div className="p-5 prose prose-sm dark:prose-invert max-w-none bg-card/30">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    blockquote: ({...props}) => <blockquote className="border-l-4 border-primary/50 pl-4 py-1 my-3 text-muted-foreground italic bg-primary/5 rounded-r-lg" {...props} />,
                    table: ({...props}) => <div className="overflow-x-auto my-4 rounded-xl border border-border/60 shadow-sm bg-card/50"><table className="w-full text-[10px] text-left" {...props} /></div>,
                    thead: ({...props}) => <thead className="bg-accent/80 text-foreground font-bold uppercase tracking-tight text-[8px]" {...props} />,
                    th: ({...props}) => <th className="px-3 py-2" {...props} />,
                    td: ({...props}) => <td className="px-3 py-2 border-t border-border/40" {...props} />,
                  }}
                >
{"> Blockquote\n\n| Subject | Grade |\n| :--- | :---: |\n| Math | A+ |\n| Sci | A |"}
                </ReactMarkdown>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-tight text-primary flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Math & Equations
            </h3>
            <div className="bg-accent/40 rounded-xl border border-border/50 overflow-hidden text-left shadow-sm">
              <div className="px-4 py-2 bg-accent/60 border-b border-border/50">
                <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">Inline & Display LaTeX</span>
              </div>
              <pre className="p-4 text-[10px] font-mono text-foreground whitespace-pre-wrap leading-relaxed bg-accent/20">
{"Pythagorean: $a^2 + b^2 = c^2$\n\n$$ E = mc^2 $$"}
              </pre>
              <div className="px-4 py-2 bg-accent/60 border-t border-border/50 border-b border-border/50">
                <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">Output</span>
              </div>
              <div className="p-5 prose prose-sm dark:prose-invert max-w-none bg-card/30">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
{"Pythagorean: $a^2 + b^2 = c^2$\n\n$$ E = mc^2 $$"}
                </ReactMarkdown>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-tight text-primary flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Code & Media
            </h3>
            <div className="bg-accent/40 rounded-xl border border-border/50 overflow-hidden text-left shadow-sm">
              <div className="px-4 py-2 bg-accent/60 border-b border-border/50">
                <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">Syntax</span>
              </div>
              <pre className="p-4 text-[10px] font-mono text-foreground whitespace-pre-wrap leading-relaxed bg-accent/20">
{"Inline \`code\` snippet\\n\\n[Link Text](https://example.com)\\n\\n\`\`\`python\\nprint(\\\"Hello Cici\\\")\\n\`\`\`"}
              </pre>
              <div className="px-4 py-2 bg-accent/60 border-t border-border/50 border-b border-border/50">
                <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">Output</span>
              </div>
              <div className="p-5 bg-card/30">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={{
                    code: ({className, children, ...props}) => {
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <div className="relative group my-2">
                          <pre className="bg-foreground text-background rounded-lg p-3 overflow-x-auto text-[10px] border border-border">
                            <code className={className} {...props}>{children}</code>
                          </pre>
                        </div>
                      ) : (
                        <code className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono text-[0.85em] font-bold border border-primary/20" {...props}>{children}</code>
                      );
                    },
                    a: ({...props}) => <a className="text-primary font-bold hover:underline underline-offset-4" {...props} />
                  }}
                >
{"Inline \`code\` snippet\\n\\n[Link Text](https://example.com)\\n\\n\`\`\`python\\nprint(\\\"Hello Cici\\\")\\n\`\`\`"}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        </div>
      </Drawer>

      {/* Delete Post Confirmation */}
      <Modal 
        isOpen={!!postToDelete} 
        onClose={() => setPostToDelete(null)}
        maxWidth="max-w-xs"
        className="p-8 text-center"
      >
        <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Trash2 className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Delete Post?</h3>
        <p className="text-xs text-muted-foreground font-bold leading-relaxed mb-8">This action cannot be undone. Are you sure you want to remove this post?</p>
        <div className="flex flex-col gap-3">
            <button 
                onClick={handleDeletePost}
                className="w-full py-3.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold uppercase tracking-tight rounded-2xl transition-all shadow-lg shadow-destructive/10 active:scale-95"
            >
                Delete Post
            </button>
            <button 
                onClick={() => setPostToDelete(null)}
                className="w-full py-3.5 bg-accent hover:bg-accent/80 text-muted-foreground text-xs font-bold uppercase tracking-tight rounded-2xl transition-all active:scale-95"
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
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="bg-card rounded-3xl p-6 border border-border">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <Skeleton className="h-20 flex-1" />
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border space-y-4">
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
