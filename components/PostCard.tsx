'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Heart, MessageSquare, MoreVertical, Trash2 } from 'lucide-react';
import { CommunityPost, Student } from '@/types';
import Link from 'next/link';
import { obfuscateId } from '@/lib/utils';

interface PostCardProps {
  post: CommunityPost;
  student: Student | null;
  onLike: (postId: string, isLiked: boolean) => void;
  onVote: (postId: string, optionIndex: number) => void;
  onDelete: (postId: string) => void;
  onOpen: (post: CommunityPost) => void;
  onFetchReactors: (postId: string) => void;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
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
  onDelete,
  onOpen,
  onFetchReactors,
  activeMenu,
  setActiveMenu,
  isProfileView = false
}: PostCardProps) {
  const isLiked = (post.likes || []).includes(student?.id || '');
  const topic = (post as any).topic || 'General';

  return (
    <div 
      onClick={() => onOpen(post)}
      className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-200 transition-all cursor-pointer group relative"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
            {post.userName.charAt(0)}
          </div>
          <div>
            {isProfileView ? (
               <h4 className="text-sm font-bold text-slate-900">{post.userName}</h4>
            ) : (
              <Link 
                href={`/profile/${obfuscateId(post.userId)}`} 
                onClick={(e) => e.stopPropagation()}
                className="block"
              >
                  <h4 className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">{post.userName}</h4>
              </Link>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter ${getTopicStyle(topic)}`}>
                {topic}
              </span>
              {(post as any).isUnreviewed && (
                <span className="bg-amber-50 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-tighter">
                  Pending AI Review
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)}
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {activeMenu === post.id && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
              {student?.id === post.userId ? (
                <button 
                  onClick={() => {
                    onDelete(post.id);
                    setActiveMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Post
                </button>
              ) : (
                <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase">No actions</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="prose prose-slate max-w-none prose-sm font-medium text-slate-700 leading-relaxed mb-4 line-clamp-3">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>

      {post.poll && (
        <div className="mb-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-3" onClick={(e) => e.stopPropagation()}>
          <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Community Poll</h5>
          <h4 className="text-sm font-bold text-slate-900 mb-4">{post.poll.question}</h4>
          <div className="space-y-2">
            {post.poll.options.map((option, idx) => {
              const totalVotes = post.poll?.options.reduce((acc, curr) => acc + curr.votes.length, 0) || 0;
              const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
              const hasVoted = post.poll?.options.some(opt => opt.votes.includes(student?.id || ''));
              const isSelected = option.votes.includes(student?.id || '');

              return (
                <button
                  key={idx}
                  disabled={hasVoted}
                  onClick={() => onVote(post.id, idx)}
                  className={`w-full relative h-10 rounded-xl overflow-hidden border transition-all ${
                    hasVoted 
                      ? isSelected ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-white/50'
                      : 'border-slate-200 bg-white hover:border-blue-600/30'
                  }`}
                >
                  {hasVoted && (
                    <div 
                      className={`absolute inset-y-0 left-0 transition-all duration-1000 ${isSelected ? 'bg-blue-600/10' : 'bg-slate-100/50'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  <div className="absolute inset-0 px-4 flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                      {option.text}
                    </span>
                    {hasVoted && (
                      <span className="text-[10px] font-black text-slate-400">
                        {percentage}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {post.poll.options.reduce((acc, curr) => acc + curr.votes.length, 0)} Total Votes
            </p>
            {post.poll.options.some(opt => opt.votes.includes(student?.id || '')) && (
              <span className="text-[9px] font-bold text-blue-500 uppercase">Voted</span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
          <button 
              onClick={(e) => {
                  e.stopPropagation();
                  onLike(post.id, isLiked);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
                  ${isLiked 
                      ? 'bg-red-50 text-red-600' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
              <Heart 
                  className={`h-3.5 w-3.5 ${ isLiked ? 'fill-current' : ''}`} 
              />
              <span 
                  onClick={(e) => {
                      e.stopPropagation();
                      if ((post.likes || []).length > 0) onFetchReactors(post.id);
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider hover:underline"
              >
                  {(post.likes || []).length}
              </span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                  {post.commentCount || 0}
              </span>
          </div>
      </div>
    </div>
  );
}
