'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Send, Trash2, ArrowLeft, Heart, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { CommunityPost, Student, CommunityComment } from '@/types';
import { useRealtime } from '@/components/shared/RealtimeProvider';
import { Button } from '@/components/ui/button';

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
        <Button variant="ghost" size="sm" onClick={() => router.push('/community')} className="gap-2 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {loadingPost ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : post && (
          <>
              <div className="bg-card border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {post.isAnonymous ? (
                      <span className="font-bold text-sm">Anonymous</span>
                    ) : (
                      <Link href={`/student/${post.userId}`} className="font-bold text-sm hover:text-primary">
                        {post.userName}
                      </Link>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{post.topic || 'General'}</span>
                </div>
                {student?.id === post.userId && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDeletePost}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="text-sm whitespace-pre-wrap break-words">{post.content}</div>

              {post.poll && (
                <div className="border rounded p-3 space-y-2 bg-muted/20">
                  <p className="font-bold text-sm">{post.poll.question}</p>
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
                        className="w-full text-left relative border rounded px-3 py-2 text-sm hover:bg-accent disabled:cursor-default"
                      >
                        {hasVoted && (
                          <div className="absolute inset-y-0 left-0 bg-primary/10 rounded" style={{ width: `${percentage}%` }} />
                        )}
                        <div className="relative flex justify-between">
                          <span className={isSelected ? 'font-bold text-primary' : ''}>{option.text}</span>
                          {hasVoted && <span className="text-xs text-muted-foreground">{percentage}%</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-4 text-sm">
                <button onClick={handleLike} disabled={!student} className="flex items-center gap-1 text-muted-foreground hover:text-rose-600 disabled:cursor-default">
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current text-rose-600' : ''}`} />
                  <span>{(post.likes || []).length}</span>
                </button>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{comments.length}</span>
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {student && (
                <div className="flex gap-2">
                  <textarea
                    placeholder="Write a comment..."
                    className="flex-1 min-h-[80px] p-3 border rounded text-sm resize-none outline-none focus:ring-1 focus:ring-primary"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button size="sm" disabled={!newComment.trim() || commenting} onClick={handleComment} className="self-end">
                    {commenting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  </Button>
                </div>
              )}

              {loadingComments ? (
                <p className="text-sm text-muted-foreground">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded">No comments yet.</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b pb-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{comment.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
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
