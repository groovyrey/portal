'use client';

import React, { useRef, useState, useEffect } from 'react';
import { 
  Heart, 
  MessageSquare, 
  MoreVertical, 
  Trash2, 
  Link as LinkIcon, 
  Share2, 
  User,
  Flag
} from 'lucide-react';
import { CommunityPost, Student } from '@/types';
import Link from 'next/link';
import { toast } from 'sonner';
import Image from 'next/image';
import { useRealtime } from '@/components/shared/RealtimeProvider';
import CommunityMarkdown from './CommunityMarkdown';

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
  
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const isTruncated = post.content.length > 280;
  const displayContent = isTruncated ? post.content.substring(0, 280) + '...' : post.content;

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
      className="surface-neutral relative rounded-xl p-4 border border-border/70 hover:border-primary/30 transition-all cursor-pointer group shadow-sm hover:shadow-md duration-300 ring-1 ring-black/5 dark:ring-white/10"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border/40">
            <Image 
              src={post.isAnonymous 
                ? `https://api.dicebear.com/7.x/identicon/svg?seed=anonymous&backgroundColor=b6e3f4`
                : `https://api.dicebear.com/7.x/lorelei/svg?seed=${post.userId || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffeb99`
              }
              alt={post.userName}
              width={36}
              height={36}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            {isProfileView || post.isAnonymous ? (
               <div className="flex items-center gap-1.5 mb-1">
                 <h4 className="text-sm font-bold text-foreground leading-none">{post.userName}</h4>
               </div>
            ) : (
              <Link 
                href={`/student/${post.userId}`} 
                onClick={(e) => e.stopPropagation()}
                className="block group/link"
              >
                  <div className="flex items-center gap-1.5 mb-1">
                    <h4 className="text-sm font-bold text-foreground leading-none group-hover/link:text-primary transition-colors">{post.userName}</h4>
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
            <div className="absolute right-0 mt-1 w-44 surface-neutral border border-border rounded-xl shadow-xl z-10 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {!post.isAnonymous && (
                <Link 
                  href={`/student/${post.userId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  <User className="h-3.5 w-3.5" />
                  View Profile
                </Link>
              )}
              
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
      
      <div className="mb-4 px-0.5">
        <CommunityMarkdown 
          content={displayContent}
          className="prose prose-slate dark:prose-invert max-w-none prose-sm font-normal text-muted-foreground/90 leading-relaxed inline"
        />
        {isTruncated && (
          <span className="text-xs font-bold text-blue-500 hover:underline transition-all ml-1">
            Read more
          </span>
        )}
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
