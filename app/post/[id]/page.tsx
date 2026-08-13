'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2,
  Send,
  Heart,
  MessageSquare,
  EllipsisVertical,
  Trash2,
  Flag,
  Reply,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { CommunityPost, Student, CommunityComment } from '@/types';
import { useRealtime } from '@/components/shared/RealtimeProvider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import ReportModal from '@/components/community/ReportModal';
import StudentAvatar from '@/components/shared/StudentAvatar';
import StaffBadge from '@/components/shared/StaffBadge';

const getTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

function PostSkeleton() {
  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32 rounded-full" />
            <Skeleton className="h-2.5 w-16 rounded-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full rounded-full" />
          <Skeleton className="h-3.5 w-4/5 rounded-full" />
          <Skeleton className="h-3.5 w-3/5 rounded-full" />
        </div>
        <div className="flex items-center gap-4 pt-1">
          <Skeleton className="h-4 w-14 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-full" />
        </div>
      </div>

      <div className="space-y-3">
        {[0, 1].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl shadow-sm p-4 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-2/3 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setActivePostId } = useRealtime();
  const postId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [postToDelete, setPostToDelete] = useState<CommunityPost | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<CommunityComment | null>(null);
  const [reportedPost, setReportedPost] = useState<CommunityPost | null>(null);
  const [reportedComment, setReportedComment] = useState<CommunityComment | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

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

  const childrenMap = useMemo(() => {
    const map = new Map<string | null, CommunityComment[]>();
    for (const c of comments) {
      const key = c.parentId || null;
      const list = map.get(key) || [];
      list.push(c);
      map.set(key, list);
    }
    return map;
  }, [comments]);

  const topLevelComments = childrenMap.get(null) || [];

  const isLiked = post && (post.likes || []).includes(student?.id || '');
  const displayName = post?.isAnonymous ? 'Anonymous' : post?.userName || '';

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
    if (!postToDelete) return;
    try {
      const res = await fetch('/api/community', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: postToDelete.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Post deleted');
        router.push('/community');
      }
    } catch {
      toast.error('Error deleting post');
    } finally {
      setPostToDelete(null);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      const res = await fetch(`/api/community/comments?id=${commentToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Comment deleted');
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      }
    } catch {
      toast.error('Error deleting comment');
    } finally {
      setCommentToDelete(null);
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

  const handleReply = async (comment: CommunityComment) => {
    if (!replyText.trim() || replying || !student) return;
    setReplying(true);
    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: replyText, userName: student.name, parentId: comment.id }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        setReplyingTo(null);
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        toast.success('Reply added');
      }
    } catch {} finally {
      setReplying(false);
    }
  };

  const openReply = (comment: CommunityComment) => {
    if (!student) return;
    setReplyingTo({ id: comment.id, name: comment.userName });
    setReplyText('');
    setTimeout(() => replyInputRef.current?.focus(), 50);
  };

  const renderComment = (comment: CommunityComment, depth: number): React.ReactNode => {
    const replies = childrenMap.get(comment.id) || [];
    const isReplyBox = replyingTo?.id === comment.id;
    return (
      <div key={comment.id} className={depth > 0 ? "ml-3 sm:ml-4 pl-3 sm:pl-4 border-l-2 border-border/70" : ""}>
        <div className="bg-muted/50 border border-border rounded-xl p-4">
          <div className="flex items-center gap-2.5">
            <StudentAvatar
              name={comment.userName}
              photoUrl={comment.userPhoto}
              className="h-7 w-7"
              fallbackClassName="bg-secondary text-secondary-foreground text-xs font-bold"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Link
                  href={`/student/${comment.userId}`}
                  className={cn("text-[13px] font-semibold text-primary hover:underline min-w-0 truncate", comment.isStaff && 'staff-gradient-text')}
                >
                  {comment.userName}
                </Link>
                {comment.isStaff && <StaffBadge />}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {getTimeAgo(comment.createdAt)}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground shrink-0">
                  <EllipsisVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {student?.id === comment.userId && (
                  <DropdownMenuItem className="text-destructive" onClick={() => setCommentToDelete(comment)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete comment
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setReportedComment(comment)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Report comment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="mt-2.5 text-[13px] text-foreground whitespace-pre-wrap break-words leading-relaxed">
            {comment.content}
          </p>
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={!student}
              onClick={() => openReply(comment)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-primary gap-1.5"
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </Button>
          </div>
          {isReplyBox && (
            <div className="mt-3 rounded-lg bg-card border border-border p-3 flex items-end gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">
                    Replying to <span className="font-semibold text-primary">{comment.userName}</span>
                  </span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Cancel reply"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <textarea
                  ref={replyInputRef}
                  rows={1}
                  value={replyText}
                  placeholder={`Reply to ${comment.userName}...`}
                  onChange={(e) => setReplyText(e.target.value)}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = 'auto';
                    t.style.height = Math.min(t.scrollHeight, 128) + 'px';
                  }}
                  className="w-full bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground max-h-32"
                />
              </div>
              <Button
                size="icon"
                className="rounded-full shrink-0"
                disabled={!replyText.trim() || replying}
                onClick={() => handleReply(comment)}
              >
                {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
        {replies.map((reply) => renderComment(reply, depth + 1))}
      </div>
    );
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
    <div className="flex-1 p-4 md:p-8 pt-6 pb-32">
      <div className="max-w-2xl mx-auto space-y-5">
        {loadingPost ? (
          <PostSkeleton />
        ) : post && (
          <>
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <StudentAvatar
                  name={displayName}
                  photoUrl={post.isAnonymous ? null : post.userPhoto}
                  className="h-10 w-10"
                  fallbackClassName="bg-primary/10 text-primary text-sm font-bold"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {post.isAnonymous ? (
                      <span className={cn("text-sm font-semibold text-foreground min-w-0 truncate", post.isStaff && 'staff-gradient-text')}>{displayName}</span>
                    ) : (
                      <Link
                        href={`/student/${post.userId}`}
                        className={cn("text-sm font-semibold text-primary hover:underline min-w-0 truncate", post.isStaff && 'staff-gradient-text')}
                      >
                        {displayName}
                      </Link>
                    )}
                    {post.isStaff && <StaffBadge />}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {getTimeAgo(post.createdAt)}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground shrink-0">
                      <EllipsisVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {student?.id === post.userId && (
                      <DropdownMenuItem className="text-destructive" onClick={() => setPostToDelete(post)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete post
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setReportedPost(post)}>
                      <Flag className="h-4 w-4 mr-2" />
                      Report post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Content */}
              <div className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
                {post.content}
              </div>

              {/* Poll */}
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
                          <div className={cn("absolute inset-y-0 left-0", isSelected ? "bg-primary/10" : "bg-muted")} style={{ width: `${percentage}%` }} />
                        )}
                        <div className="relative flex justify-between gap-2">
                          <span className={cn(isSelected && 'font-semibold text-primary')}>{option.text}</span>
                          {hasVoted && <span className="text-xs text-muted-foreground tabular-nums">{percentage}%</span>}
                        </div>
                      </button>
                    );
                  })}
                  <p className="text-xs text-muted-foreground pt-1">
                    {post.poll.options.reduce((a, c) => a + c.votes.length, 0)} votes
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-1">
                <button
                  onClick={handleLike}
                  disabled={!student}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-medium transition-colors disabled:cursor-default",
                    isLiked ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Heart className={cn("h-[18px] w-[18px]", isLiked && "fill-current")} />
                  <span>{(post.likes || []).length}</span>
                </button>
                <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <MessageSquare className="h-[18px] w-[18px]" />
                  <span>{comments.length} comments</span>
                </span>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Comments */}
            <div className="space-y-3">
              {loadingComments ? (
                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-xl bg-muted/20">
                  No comments yet. Be the first to reply!
                </div>
              ) : (
                topLevelComments.map((comment) => renderComment(comment, 0))
              )}
            </div>
          </>
        )}
      </div>

      {/* Fixed comment composer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 p-3">
        <div className="mx-auto max-w-2xl flex items-end gap-2">
          <div className="flex-1 rounded-xl bg-muted px-4 py-2.5">
            <textarea
              rows={1}
              value={newComment}
              disabled={!student}
              placeholder={student ? 'Write a comment...' : 'Sign in to comment'}
              onChange={(e) => setNewComment(e.target.value)}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 128) + 'px';
              }}
              className="w-full bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground disabled:opacity-60 max-h-32"
            />
          </div>
          <Button
            size="icon"
            className="rounded-full shrink-0"
            disabled={!student || !newComment.trim() || commenting}
            onClick={handleComment}
          >
            {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Delete post confirm */}
      <Dialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="items-center text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle>Delete post?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col pt-4">
            <Button variant="destructive" onClick={handleDeletePost} className="w-full">Delete</Button>
            <Button variant="ghost" onClick={() => setPostToDelete(null)} className="w-full">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete comment confirm */}
      <Dialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="items-center text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle>Delete comment?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col pt-4">
            <Button variant="destructive" onClick={handleDeleteComment} className="w-full">Delete</Button>
            <Button variant="ghost" onClick={() => setCommentToDelete(null)} className="w-full">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report post */}
      <ReportModal
        isOpen={!!reportedPost}
        onClose={() => setReportedPost(null)}
        targetType="post"
        targetId={reportedPost?.id || ''}
        content={reportedPost?.content || ''}
        authorName={reportedPost?.isAnonymous ? 'Anonymous' : (reportedPost?.userName || '')}
        onReportSuccess={(decision) => {
          if (decision === 'REJECTED') {
            toast.success('Post removed by Aegis');
            router.push('/community');
          } else {
            toast.success('Report approved by Aegis');
          }
        }}
      />

      {/* Report comment */}
      <ReportModal
        isOpen={!!reportedComment}
        onClose={() => setReportedComment(null)}
        targetType="comment"
        targetId={reportedComment?.id || ''}
        content={reportedComment?.content || ''}
        authorName={reportedComment?.userName || ''}
        onReportSuccess={(decision) => {
          if (decision === 'REJECTED') {
            toast.success('Comment removed by Aegis');
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
          } else {
            toast.success('Report approved by Aegis');
          }
        }}
      />
    </div>
  );
}
