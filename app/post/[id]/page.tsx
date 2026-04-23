'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
import { 
  Loader2, 
  Send, 
  Trash2, 
  Flag,
  MessageSquare,
  Heart,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  GraduationCap,
  HeartHandshake,
  Info,
  ArrowLeft,
  Link as LinkIcon,
  Share2,
  User,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import { CommunityPost, Student, CommunityComment } from '@/types';
import { useRealtime } from '@/components/shared/RealtimeProvider';

const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg bg-accent/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-all border border-border/50 shadow-sm active:scale-90"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
};

const getTopicStyle = (topic: string) => {
  switch (topic) {
    case 'Academics': return 'bg-primary/10 text-primary border-primary/20';
    case 'Campus Life': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'Career': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'Well-being': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-accent text-muted-foreground border-border';
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
  const [reportingComment, setReportingComment] = useState<string | null>(null);
  const [commentToReport, setCommentToReport] = useState<string | null>(null);
  const [postToReport, setPostToReport] = useState<string | null>(null);
  const [reportingPost, setReportingPost] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{postId: string, commentId: string} | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeCommentMenu, setActiveCommentMenu] = useState<string | null>(null);
  const [reactors, setReactors] = useState<{id: string, name: string}[] | null>(null);
  const [loadingReactors, setLoadingReactors] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const commentMenuRef = useRef<HTMLDivElement>(null);
  const postMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedStudent = localStorage.getItem('student_data');
    if (savedStudent) setStudent(JSON.parse(savedStudent));
    setActivePostId(postId);
    return () => setActivePostId(null);
  }, [postId, setActivePostId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commentMenuRef.current && !commentMenuRef.current.contains(event.target as Node)) {
        setActiveCommentMenu(null);
      }
      if (postMenuRef.current && !postMenuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    if (activeCommentMenu || activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeCommentMenu, activeMenu]);

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
    toast.success('Link copied to clipboard!');
    setActiveMenu(null);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post?.userName}`,
          text: post?.content.substring(0, 100),
          url: url,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      handleCopyLink();
    }
    setActiveMenu(null);
  };

  const handleLike = async (id: string, currentlyLiked: boolean) => {
    if (!student) return;
    const previousPost = queryClient.getQueryData(['post', id]);
    
    // Optimistic update
    queryClient.setQueryData(['post', id], (old: any) => ({
      ...old,
      likes: currentlyLiked 
        ? (old.likes || []).filter((uid: string) => uid !== student.id)
        : [...(old.likes || []), student.id]
    }));

    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id, action: currentlyLiked ? 'unlike' : 'like' })
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      queryClient.setQueryData(['post', id], previousPost);
      toast.error('Failed to update like');
    }
  };

  const handleVote = async (id: string, optionIndex: number) => {
    if (!student) return;
    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id, action: 'vote', optionIndex })
      });
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['post', id] });
        toast.success('Vote recorded!');
      } else {
        toast.error(data.error || 'Failed to vote');
      }
    } catch (e) {
      toast.error('Failed to vote');
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
        router.push('/community');
      } else {
        toast.error(data.error || 'Failed to delete post', { id: deleteToast });
      }
    } catch (e) {
      toast.error('Failed to delete post', { id: deleteToast });
    } finally {
      setPostToDelete(null);
    }
  };

  const handleReportPost = async (id: string) => {
    if (reportingPost) return;
    setReportingPost(true);
    const reportToast = toast.loading('Aegis is reviewing this post...');
    try {
      const res = await fetch('/api/community/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id })
      });
      const data = await res.json();
      if (data.success) {
        if (data.decision === 'REJECTED') {
          toast.success('Post removed. AI analysis confirmed community guideline violations.', { id: reportToast, duration: 5000 });
          router.push('/community');
        } else {
          toast.info('Aegis found this post follows our guidelines.', { id: reportToast, duration: 5000 });
        }
      } else {
        toast.error(data.error || 'Failed to report post', { id: reportToast });
      }
    } catch (error) {
      toast.error('Failed to report post', { id: reportToast });
    } finally {
      setReportingPost(false);
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
        toast.success('Comment added!');
      } else {
        toast.error(data.error || 'Failed to add comment');
      }
    } catch (e) {
      toast.error('Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  const handleReportComment = async (cId: string) => {
    if (reportingComment) return;
    setReportingComment(cId);
    const reportToast = toast.loading('Aegis is reviewing this comment...');
    try {
      const res = await fetch('/api/community/comments/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: cId })
      });
      const data = await res.json();
      if (data.success) {
        if (data.decision === 'REJECTED') {
          queryClient.invalidateQueries({ queryKey: ['comments', postId] });
          toast.success('Comment removed. Thank you for keeping the community safe!', { id: reportToast, duration: 5000 });
        } else {
          toast.info('Aegis found this comment follows our guidelines.', { id: reportToast, duration: 5000 });
        }
      } else {
        toast.error(data.error || 'Failed to report comment', { id: reportToast });
      }
    } catch (error) {
      toast.error('Failed to report comment', { id: reportToast });
    } finally {
      setReportingComment(null);
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    const { commentId } = commentToDelete;
    setCommentToDelete(null);
    const deleteToast = toast.loading('Deleting comment...');
    try {
      const res = await fetch(`/api/community/comments?id=${commentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        queryClient.invalidateQueries({ queryKey: ['post', postId] });
        toast.success('Comment deleted', { id: deleteToast });
      } else {
        toast.error(data.error || 'Failed to delete comment', { id: deleteToast });
      }
    } catch (e) {
      toast.error('Failed to delete comment', { id: deleteToast });
    }
  };

  const fetchReactors = async (id: string) => {
    setLoadingReactors(true);
    setReactors([]);
    try {
      const res = await fetch(`/api/community?postId=${id}`);
      const data = await res.json();
      if (data.success) setReactors(data.reactors || []);
    } catch (e) {
      toast.error('Failed to fetch reactors');
    } finally {
      setLoadingReactors(false);
    }
  };

  if (postError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm max-w-sm w-full">
          <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Post Not Found</h2>
          <p className="text-sm text-muted-foreground">This post may have been deleted or the link is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
        {loadingPost ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : post && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border/40 shadow-sm">
                  <Image 
                    src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${post.userId || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffeb99`}
                    alt={post.userName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <Link href={`/student/${post.userId}`} className="block group">
                    <h2 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{post.userName}</h2>
                  </Link>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <p className="text-[10px] font-medium text-muted-foreground/60">
                      {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="h-0.5 w-0.5 rounded-full bg-border" />
                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${getTopicStyle(post.topic || 'General')}`}>
                      {post.topic || 'General'}
                    </span>
                    {post.isUnreviewed && (
                      <span className="bg-amber-500/5 text-amber-500/80 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-amber-500/10">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative" ref={postMenuRef}>
                <button 
                  onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-all"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {activeMenu === post.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-card rounded-2xl shadow-xl border border-border py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <Link 
                      href={`/student/${post.userId}`}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors uppercase tracking-wider"
                    >
                      <User className="h-4 w-4" />
                      View Profile
                    </Link>

                    <button 
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors uppercase tracking-wider"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Copy Link
                    </button>

                    <button 
                      onClick={handleShare}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors uppercase tracking-wider"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>

                    <div className="h-[1px] bg-border my-1.5 mx-2" />

                    {student?.id === post.userId ? (
                      <button 
                        onClick={() => {
                          setPostToDelete(post.id);
                          setActiveMenu(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors uppercase tracking-wider"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Post
                      </button>
                    ) : (
                      student && (
                        <button 
                          onClick={() => {
                            setPostToReport(post.id);
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-amber-500 hover:bg-amber-500/10 transition-colors uppercase tracking-wider"
                        >
                          <Flag className="h-4 w-4" />
                          Report Post
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none prose-sm font-normal text-muted-foreground/90 leading-relaxed px-0.5">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
                components={{
                  a: ({ ...props }) => (
                    <a 
                      {...props} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary font-bold underline hover:opacity-80 transition-opacity"
                    >
                      {props.children}
                    </a>
                  ),
                  blockquote: ({ ...props }) => (
                    <blockquote 
                      className="border-l-4 border-primary/50 pl-4 py-1 my-4 text-muted-foreground italic bg-primary/5 rounded-r-lg" 
                      {...props} 
                    />
                  ),
                  ul: ({ ...props }) => (
                    <ul className="list-disc list-outside ml-5 my-4 space-y-2" {...props} />
                  ),
                  ol: ({ ...props }) => (
                    <ol className="list-decimal list-outside ml-5 my-4 space-y-2" {...props} />
                  ),
                  li: ({ ...props }) => (
                    <li className="mb-1" {...props} />
                  ),
                  h1: ({children}) => <h1 className="text-xl font-bold text-foreground mt-8 mb-4 pb-2 border-b border-border/50 tracking-tight">{children}</h1>,
                  h2: ({children}) => <h2 className="text-lg font-bold text-foreground mt-6 mb-3 tracking-tight">{children}</h2>,
                  h3: ({children}) => <h3 className="text-base font-bold text-foreground mt-5 mb-2.5">{children}</h3>,
                  p: ({children}) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                  table: ({...props}) => <div className="overflow-x-auto my-6 rounded-xl border border-border/60 shadow-sm bg-card/50"><table className="w-full text-sm text-left" {...props} /></div>,
                  thead: ({...props}) => <thead className="bg-accent/80 text-foreground font-bold uppercase tracking-tight text-[10px]" {...props} />,
                  th: ({...props}) => <th className="px-4 py-3" {...props} />,
                  td: ({...props}) => <td className="px-4 py-3 border-t border-border/40" {...props} />,
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <div className="relative group my-6">
                        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                          <div className="px-2 py-1 bg-accent rounded text-[8px] font-bold uppercase tracking-tight text-muted-foreground border border-border">
                            {match[1]}
                          </div>
                          <CopyButton content={String(children).replace(/\n$/, '')} />
                        </div>
                        <pre className="bg-muted text-foreground rounded-xl p-5 overflow-x-auto text-sm scroll-smooth custom-scrollbar border border-border shadow-xl">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono text-[0.9em] font-bold border border-primary/20" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {post.poll && (
              <div className="p-4 bg-muted/40 rounded-2xl border border-border/40 space-y-3.5">
                <h4 className="text-sm font-bold text-foreground tracking-tight">{post.poll.question}</h4>
                <div className="space-y-2">
                  {post.poll.options.map((option, idx) => {
                    const totalVotes = post.poll?.options.reduce((acc, curr) => acc + curr.votes.length, 0) || 0;
                    const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
                    const hasVoted = post.poll?.options.some(opt => opt.votes.includes(student?.id || ''));
                    const isSelected = option.votes.includes(student?.id || '');

                    return (
                      <button
                        key={idx}
                        disabled={!student || hasVoted}
                        onClick={() => handleVote(post.id, idx)}
                        className={`w-full relative h-10 rounded-xl overflow-hidden border transition-all duration-300 ${
                          hasVoted 
                            ? isSelected ? 'border-primary/30 bg-card' : 'border-border/40 bg-transparent opacity-60'
                            : !student ? 'border-border/40 bg-card/50 cursor-not-allowed' : 'border-border/40 bg-card hover:border-primary/40'
                        }`}
                      >
                        {hasVoted && (
                          <div 
                            className={`absolute inset-y-0 left-0 transition-all duration-1000 ${isSelected ? 'bg-primary/10' : 'bg-muted/20'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        )}
                        <div className="absolute inset-0 px-4 flex items-center justify-between">
                          <span className={`text-[13px] font-bold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                            {option.text}
                          </span>
                          {hasVoted && (
                            <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                              {percentage}%
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] font-black text-muted-foreground/60 px-1 uppercase tracking-widest">
                  {post.poll.options.reduce((acc, curr) => acc + curr.votes.length, 0)} total votes
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 py-4 border-y border-border/40">
                <button 
                    onClick={() => handleLike(post.id, isLiked || false)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      fetchReactors(post.id);
                    }}
                    disabled={!student}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all duration-300 border
                        ${isLiked 
                            ? 'bg-rose-500/5 text-rose-500 border-rose-500/10' 
                            : !student 
                              ? 'bg-transparent text-muted-foreground/30 cursor-not-allowed border-transparent'
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted border-transparent'}`}
                >
                    <Heart 
                        className={`h-4 w-4 transition-transform duration-300 active:scale-125 ${ isLiked ? 'fill-current' : ''}`} 
                    />
                    <span className="text-sm font-bold">
                        {(post.likes || []).length}
                    </span>
                </button>

                <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-muted/50 text-muted-foreground border border-transparent">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm font-bold">
                        {post.commentCount || 0}
                    </span>
                </div>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <h3 className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
              Discussion ({comments.length})
            </h3>
          </div>

          <div className="space-y-1">
            {loadingComments ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 items-start">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="p-12 text-center bg-accent/30 rounded-3xl border border-dashed border-border">
                <div className="h-14 w-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground/30">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No comments yet</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Be the first to share your thoughts</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {comments.map((comment) => {
                  const isMe = student && comment.userId === student.id;
                  return (
                    <div key={comment.id} className="py-5 flex gap-4 items-start group relative">
                      <Link 
                        href={`/student/${comment.userId}`}
                        className="shrink-0"
                      >
                        <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-secondary/50 border border-border group-hover:bg-card transition-all flex items-center justify-center shadow-sm">
                          <Image 
                            src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${comment.userId || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffeb99`}
                            alt={comment.userName}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-4">
                          <Link href={`/student/${comment.userId}`} className="break-words">
                            <span className={`text-sm font-bold break-words hover:text-primary transition-colors ${isMe ? 'text-primary' : 'text-foreground'}`}>
                              {comment.userName}
                            </span>
                          </Link>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">
                              {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            
                            {student && (
                              <div className="relative" ref={activeCommentMenu === comment.id ? commentMenuRef : null}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveCommentMenu(activeCommentMenu === comment.id ? null : comment.id);
                                  }}
                                  className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground hover:bg-accent transition-all"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                                
                                {activeCommentMenu === comment.id && (
                                  <div className="absolute right-0 mt-1 w-36 bg-card border border-border rounded-xl shadow-xl z-10 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    {isMe ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveCommentMenu(null);
                                          setCommentToDelete({ postId: postId, commentId: comment.id });
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-red-500 hover:bg-red-500/10 transition-colors uppercase tracking-wider"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveCommentMenu(null);
                                          setCommentToReport(comment.id);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-amber-500 hover:bg-amber-500/10 transition-colors uppercase tracking-wider"
                                        disabled={reportingComment === comment.id}
                                      >
                                        <Flag className={`h-3.5 w-3.5 ${reportingComment === comment.id ? 'animate-pulse' : ''}`} />
                                        Report
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comment Input Part of flow */}
          <div className="pt-8">
            {student ? (
              <div className="flex gap-3 items-center bg-accent/50 p-2 rounded-2xl border border-border focus-within:border-primary/50 focus-within:bg-card transition-all shadow-sm relative">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  maxLength={500}
                  placeholder="Write a comment..."
                  className="flex-1 bg-transparent border-none px-4 text-sm font-bold focus:outline-none py-2.5 placeholder:text-muted-foreground/50"
                />
                {newComment.length > 0 && (
                  <div className="absolute right-14 top-1/2 -translate-y-1/2">
                    <span className={`text-[8px] font-bold uppercase tracking-widest ${newComment.length >= 450 ? 'text-red-500' : 'text-muted-foreground/30'}`}>
                      {newComment.length}/500
                    </span>
                  </div>
                )}
                <button
                  disabled={!newComment.trim() || commenting}
                  onClick={handleComment}
                  className="bg-foreground text-background hover:opacity-90 disabled:opacity-20 p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
                >
                  {commenting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-accent/50 px-5 py-4 rounded-2xl border border-border">
                <p className="text-sm font-bold text-muted-foreground">Log in to join the discussion</p>
                <Link href="/" className="text-sm font-bold text-primary hover:underline">Sign In</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reactors Modal */}
      <Modal 
        isOpen={!!reactors && reactors.length > 0} 
        onClose={() => setReactors(null)}
        maxWidth="max-w-xs"
        title={<h3 className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Hearts</h3>}
      >
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {loadingReactors ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : (
            reactors?.map(user => (
              <Link 
                key={user.id} 
                href={`/student/${user.id}`}
                onClick={() => setReactors(null)}
                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-accent transition-all group"
              >
                <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-secondary/50 border border-border group-hover:bg-card transition-all flex items-center justify-center shadow-sm">
                  <Image 
                    src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${user.id || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffeb99`}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <span className="text-sm font-bold text-foreground">
                  {user.name}
                </span>
              </Link>
            ))
          )}
        </div>
      </Modal>

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
                className="w-full py-3.5 bg-destructive hover:bg-destructive/90 text-white text-xs font-bold tracking-tight rounded-2xl transition-all shadow-lg shadow-destructive/10 active:scale-95"
            >
                Delete Post
            </button>
            <button 
                onClick={() => setPostToDelete(null)}
                className="w-full py-3.5 bg-accent hover:bg-accent/80 text-muted-foreground text-xs font-bold tracking-tight rounded-2xl transition-all active:scale-95"
            >
                Cancel
            </button>
        </div>
      </Modal>

      {/* Delete Comment Confirmation */}
      <Modal 
        isOpen={!!commentToDelete} 
        onClose={() => setCommentToDelete(null)}
        maxWidth="max-w-xs"
        className="p-8 text-center"
      >
        <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Trash2 className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Delete Comment?</h3>
        <p className="text-xs text-muted-foreground font-bold leading-relaxed mb-8">Are you sure you want to remove this comment?</p>
        <div className="flex flex-col gap-3">
            <button 
                onClick={confirmDeleteComment}
                className="w-full py-3.5 bg-destructive hover:bg-destructive/90 text-white text-xs font-bold tracking-tight rounded-2xl transition-all shadow-lg shadow-destructive/10 active:scale-95"
            >
                Delete Comment
            </button>
            <button 
                onClick={() => setCommentToDelete(null)}
                className="w-full py-3.5 bg-accent hover:bg-accent/80 text-muted-foreground text-xs font-bold tracking-tight rounded-2xl transition-all active:scale-95"
            >
                Cancel
            </button>
        </div>
      </Modal>

      {/* Report Confirmation & Guidelines Modal */}
      <Modal 
        isOpen={!!commentToReport || !!postToReport} 
        onClose={() => { setCommentToReport(null); setPostToReport(null); }}
        maxWidth="max-w-md"
        className="p-0 overflow-hidden"
      >
        <div className="bg-card">
          {/* Modal Header */}
          <div className="bg-foreground p-8 text-background">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-background/10 flex items-center justify-center">
                <ShieldAlert className="h-7 w-7 text-background" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Report to Aegis</h3>
                <p className="text-xs text-background/60 font-bold uppercase tracking-wider">Review guidelines before reporting</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 flex gap-4">
              <Info className="h-6 w-6 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground font-bold leading-relaxed">
                Aegis will review the reported content based on our <span className="text-foreground">Community Guidelines</span>. Excessive false reporting may result in account restrictions.
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/50">Guidelines for Review</h4>
              
              <div className="grid gap-6">
                {[
                  { icon: <GraduationCap className="h-5 w-5 text-primary" />, title: "Professionalism", desc: "No offensive content or excessive slang." },
                  { icon: <HeartHandshake className="h-5 w-5 text-destructive" />, title: "Peer Support", desc: "Is it helpful or supportive?" },
                  { icon: <AlertTriangle className="h-5 w-5 text-amber-500" />, title: "No Bullying", desc: "Zero tolerance for harassment or shaming." },
                  { icon: <ShieldCheck className="h-5 w-5 text-green-500" />, title: "Privacy", desc: "No personal info should be shared." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shrink-0 border border-border">
                      {item.icon}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-foreground">{item.title}</h5>
                      <p className="text-xs text-muted-foreground font-medium leading-tight">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 pt-0 flex flex-col gap-3">
            <button 
              onClick={() => {
                if (commentToReport) {
                  const cId = commentToReport;
                  setCommentToReport(null);
                  handleReportComment(cId);
                } else if (postToReport) {
                  const pId = postToReport;
                  setPostToReport(null);
                  handleReportPost(pId);
                }
              }}
              className="w-full py-4 bg-foreground text-background hover:opacity-90 text-xs font-bold tracking-tight rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <CheckCircle className="h-5 w-5" />
              Confirm Violation
            </button>
            <button 
              onClick={() => { setCommentToReport(null); setPostToReport(null); }}
              className="w-full py-4 bg-accent hover:bg-accent/80 text-muted-foreground text-xs font-bold tracking-tight rounded-2xl transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
