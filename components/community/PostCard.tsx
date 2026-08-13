'use client';

import React from 'react';
import { Heart, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { CommunityPost, Student } from '@/types';
import StudentAvatar from '@/components/shared/StudentAvatar';
import StaffBadge from '@/components/shared/StaffBadge';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: CommunityPost;
  student: Student | null;
  onLike: (postId: string, isLiked: boolean) => void;
  onVote: (postId: string, optionIndex: number) => void;
  onOpen: (post: CommunityPost) => void;
}

const TOPIC_CHIP_COLORS: Record<string, string> = {
  Academics: 'bg-blue-500/5 text-blue-600 dark:text-blue-400',
  'Campus Life': 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
  Career: 'bg-violet-500/5 text-violet-600 dark:text-violet-400',
  'Well-being': 'bg-amber-500/5 text-amber-600 dark:text-amber-400',
  General: 'bg-muted/40 text-muted-foreground',
};

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

export default function PostCard({ post, student, onLike, onVote, onOpen }: PostCardProps) {
  const isLiked = (post.likes || []).includes(student?.id || '');
  const displayName = post.isAnonymous ? 'Anonymous' : post.userName;
  const topic = post.topic || 'General';

  return (
    <div
      onClick={() => onOpen(post)}
      className="group bg-card border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all p-4 space-y-3 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <StudentAvatar
          name={displayName}
          photoUrl={post.isAnonymous ? null : post.userPhoto}
          className="h-8 w-8"
          fallbackClassName="bg-primary/10 text-primary text-[13px] font-semibold"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {post.isAnonymous ? (
              <span className={cn("text-[13px] font-semibold text-foreground min-w-0 truncate", post.isStaff && 'staff-gradient-text')}>{displayName}</span>
            ) : (
              <Link
                href={`/student/${post.userId}`}
                onClick={(e) => e.stopPropagation()}
                className={cn("text-[13px] font-semibold text-primary hover:underline min-w-0 truncate", post.isStaff && 'staff-gradient-text')}
              >
                {displayName}
              </Link>
            )}
            {post.isStaff && <StaffBadge />}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground shrink-0">{getTimeAgo(post.createdAt)}</span>
            <span className={cn("shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-medium", TOPIC_CHIP_COLORS[topic] || TOPIC_CHIP_COLORS.General)}>
              {topic}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed line-clamp-4">
        {post.content}
      </div>

      {/* Poll */}
      {post.poll && (
        <div className="border border-border rounded-xl p-3.5 space-y-2 bg-muted/30">
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
                onClick={(e) => { e.stopPropagation(); onVote(post.id, idx); }}
                className="w-full text-left relative overflow-hidden border border-border rounded-lg px-3 py-2 text-[13px] bg-card hover:border-primary/40 disabled:cursor-default disabled:hover:border-border transition-colors"
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
          <p className="text-[11px] text-muted-foreground pt-0.5">
            {post.poll.options.reduce((a, c) => a + c.votes.length, 0)} votes
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 pt-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onLike(post.id, isLiked); }}
          disabled={!student}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium transition-colors disabled:cursor-default",
            isLiked ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          <span>{(post.likes || []).length}</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onOpen(post); }}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{post.commentCount || 0}</span>
        </button>
      </div>
    </div>
  );
}
