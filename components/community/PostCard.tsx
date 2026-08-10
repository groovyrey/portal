'use client';

import React from 'react';
import { Heart, MessageSquare, Ghost, Clock } from 'lucide-react';
import Link from 'next/link';
import { CommunityPost, Student } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: CommunityPost;
  student: Student | null;
  onLike: (postId: string, isLiked: boolean) => void;
  onVote: (postId: string, optionIndex: number) => void;
  onOpen: (post: CommunityPost) => void;
}

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

export default function PostCard({ post, student, onLike, onVote, onOpen }: PostCardProps) {
  const isLiked = (post.likes || []).includes(student?.id || '');
  const displayName = post.isAnonymous ? 'Anonymous' : post.userName;
  const topic = post.topic || 'General';

  const displayContent = post.content.length > 300
    ? post.content.substring(0, 300) + '...'
    : post.content;

  return (
    <div
      onClick={() => onOpen(post)}
      className="group bg-card border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all p-5 space-y-4 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          post.isAnonymous
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary"
        )}>
          {post.isAnonymous ? <Ghost className="h-4 w-4" /> : getInitials(displayName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {post.isAnonymous ? (
              <span className="text-sm font-semibold text-foreground">{displayName}</span>
            ) : (
              <Link
                href={`/student/${post.userId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate"
              >
                {displayName}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <Clock className="h-3 w-3" />
            {getTimeAgo(post.createdAt)}
          </div>
        </div>

        <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wide font-semibold border", TOPIC_COLORS[topic] || TOPIC_COLORS.General)}>
          {topic}
        </Badge>
      </div>

      {/* Content */}
      <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">
        {displayContent}
        {post.content.length > 300 && (
          <span className="text-primary font-medium ml-1 hover:underline">more</span>
        )}
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
                onClick={(e) => { e.stopPropagation(); onVote(post.id, idx); }}
                className="w-full text-left relative overflow-hidden border border-border rounded-lg px-3 py-2 text-sm bg-card hover:border-primary/40 disabled:cursor-default disabled:hover:border-border transition-colors"
              >
                {hasVoted && (
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/10"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                <div className="relative flex justify-between gap-2">
                  <span className={cn(isSelected && 'font-semibold text-primary')}>{option.text}</span>
                  {hasVoted && <span className="text-xs text-muted-foreground tabular-nums">{percentage}%</span>}
                </div>
              </button>
            );
          })}
          {post.poll && !post.poll.options.some(o => o.votes.includes(student?.id || '')) && student && (
            <p className="text-[10px] text-muted-foreground pt-1">Tap an option to vote</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={(e) => { e.stopPropagation(); onLike(post.id, isLiked); }}
          disabled={!student}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-default",
            isLiked
              ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          <span>{(post.likes || []).length}</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onOpen(post); }}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{post.commentCount || 0}</span>
        </button>
      </div>
    </div>
  );
}
