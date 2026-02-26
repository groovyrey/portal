'use client';

import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Heart, MessageSquare, ExternalLink, BarChart2 } from 'lucide-react';
import { CommunityPost, Student } from '@/types';
import Link from 'next/link';
import { obfuscateId } from '@/lib/utils';

interface PostCardProps {
  post: CommunityPost;
  student: Student | null;
  onLike: (postId: string, isLiked: boolean) => void;
  onVote: (postId: string, optionIndex: number) => void;
  onOpen: (post: CommunityPost) => void;
  onFetchReactors: (postId: string) => void;
  isProfileView?: boolean;
}

const getTopicStyle = (topic: string) => {
  switch (topic) {
    case 'Academics': return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'Campus Life': return 'bg-purple-50 text-purple-600 border-purple-100';
    case 'Career': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'Well-being': return 'bg-rose-50 text-rose-600 border-rose-100';
    default: return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

export default function PostCard({
  post,
  student,
  onLike,
  onVote,
  onOpen,
  onFetchReactors,
  isProfileView = false
}: PostCardProps) {
  const isLiked = (post.likes || []).includes(student?.id || '');
  const topic = post.topic || 'General';
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    longPressTimer.current = setTimeout(() => {
      if ((post.likes || []).length > 0) {
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
      className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group relative shadow-sm hover:shadow-md duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
            {post.userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            {isProfileView ? (
               <h4 className="text-sm font-bold text-slate-900 leading-none mb-1">{post.userName}</h4>
            ) : (
              <Link 
                href={`/profile/${obfuscateId(post.userId)}`} 
                onClick={(e) => e.stopPropagation()}
                className="block group/link"
              >
                  <h4 className="text-sm font-bold text-slate-900 leading-none mb-1 group-hover/link:text-blue-600 transition-colors">{post.userName}</h4>
              </Link>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-medium text-slate-400">
                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <div className="h-1 w-1 rounded-full bg-slate-200" />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTopicStyle(topic)}`}>
                {topic}
              </span>
              {post.isUnreviewed && (
                <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-100">
                  Pending
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="prose prose-slate max-w-none prose-sm font-normal text-slate-600 leading-relaxed mb-4 line-clamp-3 px-0.5">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ ...props }) => (
              <a 
                {...props} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 font-bold underline hover:text-blue-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {props.children}
              </a>
            )
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      {post.poll && (
        <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3" onClick={(e) => e.stopPropagation()}>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight mb-3">{post.poll.question}</h4>
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
                  onClick={() => onVote(post.id, idx)}
                  className={`w-full relative h-10 rounded-xl overflow-hidden border transition-all duration-300 ${
                    hasVoted 
                      ? isSelected ? 'border-blue-200 bg-white' : 'border-slate-100 bg-transparent opacity-60'
                      : !student ? 'border-slate-100 bg-white/50 cursor-not-allowed' : 'border-slate-200 bg-white hover:border-blue-400'
                  }`}
                >
                  {hasVoted && (
                    <div 
                      className={`absolute inset-y-0 left-0 transition-all duration-1000 ${isSelected ? 'bg-blue-600/10' : 'bg-slate-200/20'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  <div className="absolute inset-0 px-4 flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                      {option.text}
                    </span>
                    {hasVoted && (
                      <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                        {percentage}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] font-medium text-slate-400 px-1">
            {post.poll.options.reduce((acc, curr) => acc + curr.votes.length, 0)} votes
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
          <button 
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
              disabled={!student}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all duration-300
                  ${isLiked 
                      ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                      : !student 
                        ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
              <Heart 
                  className={`h-4 w-4 transition-transform duration-300 group-active:scale-125 ${ isLiked ? 'fill-current' : ''}`} 
              />
              <span className="text-xs font-bold">
                  {(post.likes || []).length}
              </span>
          </button>

          <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-50 text-slate-500 border border-transparent">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs font-bold">
                  {post.commentCount || 0}
              </span>
          </div>
      </div>
    </div>
  );
}
