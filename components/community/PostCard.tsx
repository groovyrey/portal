'use client';

import React, { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
import { 
  Heart, 
  MessageSquare, 
  ExternalLink, 
  BarChart2, 
  Eye, 
  Flag, 
  MoreVertical, 
  Trash2, 
  Link as LinkIcon, 
  Share2, 
  User,
  Copy,
  Check,
  BrainCircuit
} from 'lucide-react';
import { CommunityPost, Student } from '@/types';
import Link from 'next/link';
import { toast } from 'sonner';
import Image from 'next/image';
import { useRealtime } from '@/components/shared/RealtimeProvider';

interface PostCardProps {
  post: CommunityPost;
  student: Student | null;
  onLike: (postId: string, isLiked: boolean) => void;
  onVote: (postId: string, optionIndex: number) => void;
  onOpen: (post: CommunityPost) => void;
  onFetchReactors?: (postId: string) => void;
  onReport: (postId: string) => void;
  onDelete?: (postId: string) => void;
  isProfileView?: boolean;
}

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
    case 'Academics': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'Campus Life': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'Career': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'Well-being': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    default: return 'bg-accent text-muted-foreground border-border';
  }
};

export default function PostCard({
  post,
  student,
  onLike,
  onVote,
  onOpen,
  onFetchReactors,
  onReport,
  onDelete,
  isProfileView = false
}: PostCardProps) {
  const { onlineMembers } = useRealtime();
  const isLiked = (post.likes || []).includes(student?.id || '');
  const topic = post.topic || 'General';
  const isAuthor = student?.id === post.userId;
  const [showMenu, setShowMenu] = useState(false);
  
  const memberStatus = onlineMembers.get(post.userId);
  const isStudying = memberStatus?.isStudying;

  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
    setShowMenu(false);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.userName}`,
          text: post.content.substring(0, 100),
          url: url,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      handleCopyLink(e);
    }
    setShowMenu(false);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    longPressTimer.current = setTimeout(() => {
      if (onFetchReactors && (post.likes || []).length > 0) {
        onFetchReactors(post.id);
      }
      longPressTimer.current = null;
    }, 500);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      onLike(post.id, isLiked);
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div 
      onClick={() => onOpen(post)}
      className="bg-card rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-all cursor-pointer group relative shadow-sm hover:shadow-md duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border/40">
            <Image 
              src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${post.userId || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffeb99`}
              alt={post.userName}
              width={36}
              height={36}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            {isProfileView ? (
               <div className="flex items-center gap-1.5 mb-1">
                 <h4 className="text-sm font-bold text-foreground leading-none">{post.userName}</h4>
                 {isStudying && (
                    <BrainCircuit className="h-3 w-3 text-primary animate-pulse" />
                 )}
               </div>
            ) : (
              <Link 
                href={`/student/${post.userId}`} 
                onClick={(e) => e.stopPropagation()}
                className="block group/link"
              >
                  <div className="flex items-center gap-1.5 mb-1">
                    <h4 className="text-sm font-bold text-foreground leading-none group-hover/link:text-primary transition-colors">{post.userName}</h4>
                    {isStudying && (
                      <BrainCircuit className="h-3 w-3 text-primary animate-pulse" />
                    )}
                  </div>
              </Link>
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-medium text-muted-foreground/70">
                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <div className="h-0.5 w-0.5 rounded-full bg-border" />
              <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${getTopicStyle(topic)}`}>
                {topic}
              </span>
              {post.isUnreviewed && (
                <span className="bg-amber-500/5 text-amber-600/80 dark:text-amber-400/80 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-amber-500/10">
                  Pending
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-all"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-card border border-border rounded-xl shadow-xl z-10 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <Link 
                href={`/student/${post.userId}`}
                onClick={(e) => e.stopPropagation()}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors uppercase tracking-wider"
              >
                <User className="h-3.5 w-3.5" />
                View Profile
              </Link>
              
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors uppercase tracking-wider"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Copy Link
              </button>

              <button
                onClick={handleShare}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors uppercase tracking-wider"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>

              <div className="h-[1px] bg-border my-1" />

              {student && !isAuthor && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onReport(post.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold text-amber-500 hover:bg-amber-500/10 transition-colors uppercase tracking-wider"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Report Post
                </button>
              )}

              {isAuthor && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete(post.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold text-red-500 hover:bg-red-500/10 transition-colors uppercase tracking-wider"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="prose prose-slate dark:prose-invert max-w-none prose-sm font-normal text-muted-foreground/90 leading-relaxed mb-4 px-0.5">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeHighlight, rehypeKatex]}
          components={{
            a: ({ ...props }) => (
              <a 
                {...props} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary font-bold underline hover:opacity-80 transition-opacity"
                onClick={(e) => e.stopPropagation()}
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
            h1: ({children}) => <h1 className="text-lg font-black text-foreground mt-6 mb-3 pb-2 border-b border-border/50 uppercase tracking-tight">{children}</h1>,
            h2: ({children}) => <h2 className="text-base font-bold text-foreground mt-5 mb-2.5 tracking-tight">{children}</h2>,
            h3: ({children}) => <h3 className="text-sm font-bold text-foreground mt-4 mb-2">{children}</h3>,
            p: ({children}) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
            table: ({...props}) => <div className="overflow-x-auto my-6 rounded-xl border border-border/60 shadow-sm bg-card/50"><table className="w-full text-xs text-left" {...props} /></div>,
            thead: ({...props}) => <thead className="bg-accent/80 text-foreground font-black uppercase tracking-widest text-[9px]" {...props} />,
            th: ({...props}) => <th className="px-3 py-2" {...props} />,
            td: ({...props}) => <td className="px-3 py-2 border-t border-border/40" {...props} />,
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <div className="relative group my-4" onClick={(e) => e.stopPropagation()}>
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                    <div className="px-2 py-1 bg-accent rounded text-[8px] font-black uppercase tracking-widest text-muted-foreground border border-border">
                      {match[1]}
                    </div>
                    <CopyButton content={String(children).replace(/\n$/, '')} />
                  </div>
                  <pre className="bg-muted text-foreground rounded-xl p-4 overflow-x-auto text-xs scroll-smooth custom-scrollbar border border-border shadow-lg">
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
        <div className="mb-4 p-3.5 bg-muted/40 rounded-xl border border-border/40 space-y-3" onClick={(e) => e.stopPropagation()}>
          <h4 className="text-sm font-bold text-foreground tracking-tight mb-2.5">{post.poll.question}</h4>
          <div className="space-y-1.5">
            {post.poll.options.map((option, idx) => {
              const totalVotes = post.poll?.options.reduce((acc, curr) => acc + curr.votes.length, 0) || 0;
              const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
              const hasVoted = post.poll?.options.some(opt => opt.votes.includes(student?.id || ''));
              const isSelected = option.votes.includes(student?.id || '');

              return (
                <button
                  key={idx}
                  disabled={!student || hasVoted}
                  onClick={() => onVote(post.id, idx)}
                  className={`w-full relative h-9 rounded-lg overflow-hidden border transition-all duration-300 ${
                    hasVoted 
                      ? isSelected ? 'border-primary/40 bg-card' : 'border-border/40 bg-transparent opacity-60'
                      : !student ? 'border-border/40 bg-card/50 cursor-not-allowed' : 'border-border/40 bg-card hover:border-primary/50'
                  }`}
                >
                  {hasVoted && (
                    <div 
                      className={`absolute inset-y-0 left-0 transition-all duration-1000 ${isSelected ? 'bg-primary/10' : 'bg-muted/30'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  <div className="absolute inset-0 px-3 flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                      {option.text}
                    </span>
                    {hasVoted && (
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                        {percentage}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">
            {post.poll.options.reduce((acc, curr) => acc + curr.votes.length, 0)} votes
          </p>
        </div>
      )}

      <div className="flex items-center gap-1.5 pt-3 border-t border-border/40">
          <button 
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
              disabled={!student}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all duration-200
                  ${isLiked 
                      ? 'bg-rose-500/5 text-rose-500 border border-rose-500/10' 
                      : !student 
                        ? 'bg-transparent text-muted-foreground/30 cursor-not-allowed'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
              <Heart 
                  className={`h-3.5 w-3.5 transition-transform duration-200 group-active:scale-125 ${ isLiked ? 'fill-current' : ''}`} 
              />
              <span className="text-[11px] font-bold">
                  {(post.likes || []).length}
              </span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold">
                  {post.commentCount || 0}
              </span>
          </div>
      </div>
    </div>
  );
}
