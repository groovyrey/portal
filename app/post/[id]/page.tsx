'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Loader2, 
  Send, 
  Trash2, 
  Flag,
  MessageSquare,
  Heart,
  MoreVertical,
  CheckCircle,
  ArrowLeft,
  Link as LinkIcon,
  Share2,
  User,
  Circle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommunityPost, Student, CommunityComment } from '@/types';
import { useRealtime } from '@/components/shared/RealtimeProvider';
import CommunityMarkdown from '@/components/community/CommunityMarkdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';

const getTopicStyle = (topic: string) => {
  switch (topic) {
    case 'Academics': return 'text-blue-600 bg-blue-50 border-blue-100';
    case 'Campus Life': return 'text-purple-600 bg-purple-50 border-purple-100';
    case 'Career': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'Well-being': return 'text-rose-600 bg-rose-50 border-rose-100';
    default: return 'text-muted-foreground bg-muted';
  }
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
  const [commentToDelete, setCommentToDelete] = useState<{postId: string, commentId: string} | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  useEffect(() => {
    const savedStudent = localStorage.getItem('student_data');
    if (savedStudent) setStudent(JSON.parse(savedStudent));
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

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post?.userName}`,
          text: post?.content.substring(0, 100),
          url,
        });
      } catch (err) {}
    } else {
      handleCopyLink();
    }
  };

  const handleLike = async () => {
    if (!student || !post) return;
    const currentlyLiked = isLiked;
    
    queryClient.setQueryData(['post', postId], (old: any) => ({
      ...old,
      likes: currentlyLiked 
        ? (old.likes || []).filter((uid: string) => uid !== student.id)
        : [...(old.likes || []), student.id]
    }));

    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action: currentlyLiked ? 'unlike' : 'like' })
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      toast.error('Reaction failed');
    }
  };

  const handleVote = async (optionIndex: number) => {
    if (!student || !post) return;
    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action: 'vote', optionIndex })
      });
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['post', postId] });
        toast.success('Vote recorded');
      }
    } catch (e) {}
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
        router.push('/community');
      }
    } catch (e) {
      toast.error('Error occurred', { id: deleteToast });
    } finally {
      setPostToDelete(null);
    }
  };

  const handleReportPost = async () => {
    if (!post) return;
    const reportToast = toast.loading('Reporting...');
    try {
      const res = await fetch('/api/community/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });
      const data = await res.json();
      if (data.success) {
        if (data.decision === 'REJECTED') {
          toast.success('Post removed.', { id: reportToast });
          router.push('/community');
        } else {
          toast.info('Report received.', { id: reportToast });
        }
      }
    } catch (error) {
      toast.error('Error occurred', { id: reportToast });
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || commenting || !student) return;
    setCommenting(true);
    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: newComment, userName: student.name })
      });
      const data = await res.json();
      if (data.success) {
        setNewComment('');
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        queryClient.invalidateQueries({ queryKey: ['post', postId] });
        toast.success('Comment added');
      }
    } catch (e) {} finally {
      setCommenting(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    const { commentId } = commentToDelete;
    const deleteToast = toast.loading('Deleting...');
    try {
      const res = await fetch(`/api/community/comments?id=${commentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        queryClient.invalidateQueries({ queryKey: ['post', postId] });
        toast.success('Comment deleted', { id: deleteToast });
      }
    } catch (e) {
      toast.error('Error occurred', { id: deleteToast });
    } finally {
      setCommentToDelete(null);
    }
  };

  if (postError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Post not found</h2>
        <p className="text-muted-foreground mt-2">The post might have been deleted.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/community">Back to Community</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.push('/community')} className="gap-2 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {loadingPost ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-64 w-full rounded-md" />
          </div>
        ) : post && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage 
                      src={post.isAnonymous 
                        ? `https://api.dicebear.com/7.x/identicon/svg?seed=anonymous&backgroundColor=b6e3f4`
                        : `https://api.dicebear.com/7.x/lorelei/svg?seed=${post.userId || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffeb99`
                      }
                    />
                    <AvatarFallback>{post.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    {post.isAnonymous ? (
                      <span className="text-sm font-bold">{post.userName}</span>
                    ) : (
                      <Link href={`/student/${post.userId}`} className="text-sm font-bold hover:text-primary transition-colors">{post.userName}</Link>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <Circle className="h-1 w-1 fill-muted-foreground/30 text-muted-foreground/30" />
                      <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 uppercase font-bold", getTopicStyle(post.topic || 'General'))}>
                        {post.topic || 'General'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {!post.isAnonymous && (
                      <DropdownMenuItem asChild>
                        <Link href={`/student/${post.userId}`}>
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {student?.id === post.userId ? (
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setPostToDelete(post.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    ) : (
                      student && (
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleReportPost}>
                          <Flag className="mr-2 h-4 w-4" />
                          Report
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                <div className="text-base text-muted-foreground/90 leading-relaxed break-words whitespace-pre-wrap">
                  <CommunityMarkdown content={post.content} />
                </div>

                {post.poll && (
                  <div className="mt-6 p-4 rounded-md bg-muted/30 border space-y-4">
                    <h4 className="text-sm font-bold">{post.poll.question}</h4>
                    <div className="grid gap-2">
                      {post.poll.options.map((option, idx) => {
                        const totalVotes = post.poll?.options.reduce((acc, curr) => acc + curr.votes.length, 0) || 0;
                        const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
                        const hasVoted = post.poll?.options.some(opt => opt.votes.includes(student?.id || ''));
                        const isSelected = option.votes.includes(student?.id || '');

                        return (
                          <Button
                            key={idx}
                            variant="outline"
                            disabled={!student || hasVoted}
                            onClick={() => handleVote(idx)}
                            className={cn(
                              "w-full justify-start relative overflow-hidden h-11 px-4",
                              isSelected && "border-primary/50"
                            )}
                          >
                            {hasVoted && (
                              <div 
                                className={cn("absolute inset-y-0 left-0 opacity-10", isSelected ? "bg-primary" : "bg-muted-foreground")}
                                style={{ width: `${percentage}%` }}
                              />
                            )}
                            <div className="relative flex w-full justify-between items-center">
                              <span className={cn("text-sm", isSelected && "font-bold text-primary")}>{option.text}</span>
                              {hasVoted && <span className="text-xs font-mono opacity-70">{percentage}%</span>}
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="p-4 pt-0 flex gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!student}
                    className={cn(
                        "h-9 px-3 gap-2",
                        isLiked ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50" : "text-muted-foreground"
                    )}
                    onClick={handleLike}
                  >
                      <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
                      <span className="text-sm font-bold tabular-nums">{(post.likes || []).length}</span>
                  </Button>

                  <div className="flex items-center gap-2 h-9 px-3 text-muted-foreground">
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-sm font-bold tabular-nums">{comments.length}</span>
                  </div>
              </CardFooter>
            </Card>

            <div className="space-y-6 pt-4">
              <h3 className="font-bold text-lg">Discussion</h3>

              {student && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${student.id}&backgroundColor=b6e3f4`} />
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <textarea
                      placeholder="Add a comment..."
                      className="w-full min-h-[100px] p-4 rounded-md bg-muted/30 border border-input focus:ring-1 focus:ring-primary outline-none text-sm resize-none"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        disabled={!newComment.trim() || commenting} 
                        onClick={handleComment}
                        className="gap-2"
                      >
                        {commenting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {loadingComments ? (
                  <div className="space-y-6">
                    {[1, 2].map(i => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : comments.length === 0 ? (
                  <div className="py-20 text-center border rounded-md border-dashed bg-muted/10">
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {comments.map((comment) => (
                      <div key={comment.id} className="py-6 flex gap-4 items-start group">
                        <Avatar className="h-9 w-9 border shrink-0">
                          <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${comment.userId}&backgroundColor=ffeb99`} />
                          <AvatarFallback>{comment.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">{comment.userName}</span>
                              <span className="text-[10px] text-muted-foreground font-medium uppercase">
                                {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-32">
                                {student?.id === comment.userId ? (
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setCommentToDelete({ postId: post.id, commentId: comment.id })}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => {}}
                                  >
                                    <Flag className="mr-2 h-4 w-4" />
                                    Report
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
                            <CommunityMarkdown content={comment.content} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="items-center text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle>Delete post?</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col pt-4">
            <Button variant="destructive" onClick={handleDeletePost} className="w-full">Delete Post</Button>
            <Button variant="ghost" onClick={() => setPostToDelete(null)} className="w-full">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="items-center text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle>Delete comment?</DialogTitle>
            <DialogDescription>
              This will remove your comment permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col pt-4">
            <Button variant="destructive" onClick={confirmDeleteComment} className="w-full">Delete Comment</Button>
            <Button variant="ghost" onClick={() => setCommentToDelete(null)} className="w-full">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
