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
      className="bg-white rounded-[2rem] p-8 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group relative shadow-sm hover:shadow-xl hover:shadow-slate-200/50 duration-500"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-slate-200">
            {post.userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            {isProfileView ? (
               <h4 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1.5">{post.userName}</h4>
            ) : (
              <Link 
                href={`/profile/${obfuscateId(post.userId)}`} 
                onClick={(e) => e.stopPropagation()}
                className="block group/link"
              >
                  <h4 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1.5 group-hover/link:text-blue-600 transition-colors">{post.userName}</h4>
              </Link>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <div className="h-1 w-1 rounded-full bg-slate-200" />
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter leading-none ${getTopicStyle(topic)}`}>
                {topic}
              </span>
              {post.isUnreviewed && (
                <span className="bg-amber-50 text-amber-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-tighter leading-none">
                  AI Review Pending
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="prose prose-slate max-w-none prose-sm font-medium text-slate-700 leading-relaxed mb-6 line-clamp-4 px-1">
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
        <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 shadow-inner" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="h-3 w-3 text-blue-600" />
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Community Opinion</h5>
          </div>
          <h4 className="text-base font-black text-slate-900 tracking-tight mb-4">{post.poll.question}</h4>
          <div className="space-y-2.5">
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
                  className={`w-full relative h-12 rounded-2xl overflow-hidden border transition-all duration-300 ${
                    hasVoted 
                      ? isSelected ? 'border-blue-200 bg-white shadow-sm' : 'border-slate-100 bg-transparent opacity-60'
                      : !student ? 'border-slate-100 bg-white/50 cursor-not-allowed' : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-md'
                  }`}
                >
                  {hasVoted && (
                    <div 
                      className={`absolute inset-y-0 left-0 transition-all duration-1000 ${isSelected ? 'bg-blue-600/10' : 'bg-slate-200/20'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  <div className="absolute inset-0 px-5 flex items-center justify-between">
                    <span className={`text-xs font-black uppercase tracking-tight ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                      {option.text}
                    </span>
                    {hasVoted && (
                      <span className="text-[10px] font-black text-slate-400 tabular-nums">
                        {percentage}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-2 px-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {post.poll.options.reduce((acc, curr) => acc + curr.votes.length, 0)} Combined Votes
            </p>
            {student && post.poll.options.some(opt => opt.votes.includes(student.id)) && (
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">Voted</span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
          <button 
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
              disabled={!student}
              className={`flex items-center gap-2.5 px-5 py-2 rounded-xl transition-all duration-300
                  ${isLiked 
                      ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                      : !student 
                        ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                        : 'bg-slate-50 text-slate-500 hover:bg-white hover:border-slate-200 hover:shadow-sm'}`}
          >
              <Heart 
                  className={`h-4 w-4 transition-transform duration-300 group-active:scale-125 ${ isLiked ? 'fill-current' : ''}`} 
              />
              <span className="text-[11px] font-black uppercase tracking-[0.1em]">
                  {(post.likes || []).length}
              </span>
          </button>

          <div className="flex items-center gap-2.5 px-5 py-2 rounded-xl bg-slate-50 text-slate-500 border border-transparent">
              <MessageSquare className="h-4 w-4" />
              <span className="text-[11px] font-black uppercase tracking-[0.1em]">
                  {post.commentCount || 0}
              </span>
          </div>
      </div>
    </div>
  );
}
