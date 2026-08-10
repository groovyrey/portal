'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Send, Trash2, ArrowLeft, Heart, MessageSquare, Ghost, Clock } from 'lucide-react';
import Link from 'next/link';
import { CommunityPost, Student, CommunityComment } from '@/types';
import { useRealtime } from '@/components/shared/RealtimeProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TOPIC_COLORS: Record<string, string> = {
  Academics: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30',
  'Campus Life': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
  Career: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30',
  'Well-being': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
  General: 'bg-muted text-muted-foreground border-border',
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase();

const getTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setActivePostId } = useRealtime();
  const postId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('student_data');
    if (saved) setStudent(JSON.parse(saved));
    setActivePostId(postId);
    return () => setActivePostId(null);
  }, [postId, setActivePostId]);

  const { data: post, isLoading: loadingPost, error: postError } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await fetch(`/api/community?postId=${postId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch post');
      return data.post as CommunityPost;
    },
    enabled: !!postId,
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await fetch(`/api/community/comments?postId=${postId}`);
      const data = await res.json();
      return data.success ? data.comments as CommunityComment[] : [];
    },
    enabled: !!postId,
  });

  const isLiked = post && (post.likes || []).includes(student?.id || '');

  const handleLike = async () => {
    if (!student || !post) return;
    const liked = isLiked;
    queryClient.setQueryData(['post', postId], (old: any) => ({
      ...old,
      likes: liked
        ? (old.likes || []).filter((uid: string) => uid !== student.id)
        : [...(old.likes || []), student.id],
    }));
    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action: liked ? 'unlike' : 'like' }),
      });
      if (!res.ok) throw new Error();
    } catch {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    }
  };

  const handleVote = async (optionIndex: number) => {
    if (!student || !post) return;
    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action: 'vote', optionIndex }),
      });
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['post', postId] });
      }
    } catch {}
  };

  const handleDeletePost = async () => {
    if (!post) return;
    try {
      const res = await fetch('/api/community', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Post deleted');
        router.push('/community');
      }
    } catch {
      toast.error('Error deleting post');
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || commenting || !student) return;
    setCommenting(true);
    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: newComment, userName: student.name }),
      });
      const data = await res.json();
      if (data.success) {
        setNewComment('');
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        toast.success('Comment added');
      }
    } catch {} finally {
      setCommenting(false);
    }
  };

  if (postError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h2 className="text-xl font-bold">Post not found</h2>
        <p className="text-muted-foreground mt-2">It may have been deleted.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/community">Back to Community</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/community')} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {loadingPost ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading...
          </div>
        ) : post && (
          <>
              <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    post.isAnonymous
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary"
                  )}>
                    {post.isAnonymous ? <Ghost className="h-4 w-4" /> : getInitials(post.isAnonymous ? 'Anonymous' : post.userName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {post.isAnonymous ? (
                        <span className="text-sm font-semibold text-foreground">Anonymous</span>
                      ) : (
                        <Link href={`/student/${post.userId}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate">
                          {post.userName}
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3" />
                      {getTimeAgo(post.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wide font-semibold border", TOPIC_COLORS[post.topic || 'General'] || TOPIC_COLORS.General)}>
                    {post.topic || 'General'}
                  </Badge>
                  {student?.id === post.userId && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={handleDeletePost}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">{post.content}</div>

              {post.poll && (
                <div className="border border-border rounded-xl p-4 space-y-2 bg-muted/30">
                  <p className="font-semibold text-sm">{post.poll.question}</p>
                  {post.poll.options.map((option, idx) => {
                    const totalVotes = post.poll!.options.reduce((a, c) => a + c.votes.length, 0);
                    const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
                    const hasVoted = post.poll!.options.some(o => o.votes.includes(student?.id || ''));
                    const isSelected = option.votes.includes(student?.id || '');
                    return (
                      <button
                        key={idx}
                        disabled={!student || hasVoted}
                        onClick={() => handleVote(idx)}
                        className="w-full text-left relative overflow-hidden border border-border rounded-lg px-3 py-2 text-sm bg-card hover:border-primary/40 disabled:cursor-default disabled:hover:border-border transition-colors"
                      >
                        {hasVoted && (
                          <div className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${percentage}%` }} />
                        )}
                        <div className="relative flex justify-between gap-2">
                          <span className={cn(isSelected && 'font-semibold text-primary')}>{option.text}</span>
                          {hasVoted && <span className="text-xs text-muted-foreground tabular-nums">{percentage}%</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button onClick={handleLike} disabled={!student} className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-default",
                  isLiked
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}>
                  <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                  <span>{(post.likes || []).length}</span>
                </button>
                <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{comments.length}</span>
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {student && (
                <div className="bg-card border border-border rounded-xl shadow-sm p-4">
                  <textarea
                    placeholder="Write a comment..."
                    className="w-full min-h-[80px] bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="flex justify-end pt-2">
                    <Button size="sm" disabled={!newComment.trim() || commenting} onClick={handleComment} className="gap-1.5 rounded-full">
                      {commenting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      Comment
                    </Button>
                  </div>
                </div>
              )}

              {loadingComments ? (
                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-xl bg-muted/20">No comments yet. Be the first to reply!</div>
              ) : (
                <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {getInitials(comment.userName)}
                        </div>
                        <span className="font-semibold">{comment.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 text-muted-foreground whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
