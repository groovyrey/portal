'use client';

import React from 'react';
import { Heart, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { CommunityPost, Student } from '@/types';

interface PostCardProps {
  post: CommunityPost;
  student: Student | null;
  onLike: (postId: string, isLiked: boolean) => void;
  onVote: (postId: string, optionIndex: number) => void;
  onOpen: (post: CommunityPost) => void;
}

export default function PostCard({ post, student, onLike, onVote, onOpen }: PostCardProps) {
  const isLiked = (post.likes || []).includes(student?.id || '');

  const displayContent = post.content.length > 300
    ? post.content.substring(0, 300) + '...'
    : post.content;

  return (
    <div onClick={() => onOpen(post)} className="bg-card border rounded-lg p-4 space-y-3 cursor-pointer hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        {post.isAnonymous ? (
          <span className="font-bold">Anonymous</span>
        ) : (
          <Link href={`/student/${post.userId}`} onClick={(e) => e.stopPropagation()} className="font-bold hover:text-primary">
            {post.userName}
          </Link>
        )}
        <span className="text-xs text-muted-foreground">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
        <span className="text-xs text-muted-foreground">{post.topic || 'General'}</span>
      </div>

      <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
        {displayContent}
        {post.content.length > 300 && <span className="text-primary ml-1">more</span>}
      </div>

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
                onClick={(e) => { e.stopPropagation(); onVote(post.id, idx); }}
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
        <button onClick={(e) => { e.stopPropagation(); onLike(post.id, isLiked); }} disabled={!student} className="flex items-center gap-1 text-muted-foreground hover:text-rose-600 disabled:cursor-default">
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current text-rose-600' : ''}`} />
          <span>{(post.likes || []).length}</span>
        </button>
        <span className="flex items-center gap-1 text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span>{post.commentCount || 0}</span>
        </span>
      </div>
    </div>
  );
}
