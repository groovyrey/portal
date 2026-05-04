'use client';

import React from 'react';
import { 
  Heart, 
  MessageSquare, 
  MoreVertical, 
  Trash2, 
  Link as LinkIcon, 
  Share2, 
  User,
  Flag,
  Circle
} from 'lucide-react';
import { CommunityPost, Student } from '@/types';
import Link from 'next/link';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRealtime } from '@/components/shared/RealtimeProvider';
import CommunityMarkdown from './CommunityMarkdown';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: CommunityPost;
  student: Student | null;
  onLike: (postId: string, isLiked: boolean) => void;
  onVote: (postId: string, optionIndex: number) => void;
  onOpen: (post: CommunityPost) => void;
  onReport: (postId: string) => void;
  onDelete?: (postId: string) => void;
  isProfileView?: boolean;
}

const getTopicStyle = (topic: string) => {
  switch (topic) {
    case 'Academics': return 'text-blue-600 bg-blue-50 border-blue-100';
    case 'Campus Life': return 'text-purple-600 bg-purple-50 border-purple-100';
    case 'Career': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'Well-being': return 'text-rose-600 bg-rose-50 border-rose-100';
    default: return 'text-muted-foreground bg-muted';
  }
};

export default function PostCard({
  post,
  student,
  onLike,
  onVote,
  onOpen,
  onReport,
  onDelete,
  isProfileView = false
}: PostCardProps) {
  const isLiked = (post.likes || []).includes(student?.id || '');
  const topic = post.topic || 'General';
  const isAuthor = student?.id === post.userId;
  
  const displayContent = post.content.length > 280 
    ? post.content.substring(0, 280) + '...' 
    : post.content;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.userName}`,
          text: post.content.substring(0, 100),
          url,
        });
      } catch (err) {}
    } else {
      handleCopyLink(e);
    }
  };

  return (
    <Card 
      onClick={() => onOpen(post)}
      className="cursor-pointer hover:border-primary/30 transition-colors shadow-sm overflow-hidden"
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 border">
            <AvatarImage 
              src={post.isAnonymous 
                ? `https://api.dicebear.com/7.x/identicon/svg?seed=anonymous&backgroundColor=b6e3f4`
                : `https://api.dicebear.com/7.x/lorelei/svg?seed=${post.userId || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffeb99`
              }
            />
            <AvatarFallback>{post.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold truncate">{post.userName}</span>
              {post.isUnreviewed && <Badge variant="outline" className="h-4 text-[8px] uppercase px-1 border-amber-200 text-amber-600 bg-amber-50">Pending</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <Circle className="h-1 w-1 fill-muted-foreground/30 text-muted-foreground/30" />
              <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 uppercase font-bold", getTopicStyle(topic))}>
                {topic}
              </Badge>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {!post.isAnonymous && (
              <DropdownMenuItem asChild>
                <Link href={`/student/${post.userId}`} onClick={(e) => e.stopPropagation()}>
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleCopyLink}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {student && !isAuthor && (
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); onReport(post.id); }}>
                <Flag className="mr-2 h-4 w-4" />
                Report
              </DropdownMenuItem>
            )}
            {isAuthor && onDelete && (
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="text-sm text-muted-foreground/90 leading-relaxed break-words">
          <CommunityMarkdown content={displayContent} className="inline" />
          {post.content.length > 280 && <span className="text-primary font-semibold ml-1">Read more</span>}
        </div>

        {post.poll && (
          <div className="mt-4 p-4 rounded-md bg-muted/30 border space-y-3" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-sm font-bold">{post.poll.question}</h4>
            <div className="grid gap-2">
              {post.poll.options.map((option, idx) => {
                const totalVotes = post.poll?.options.reduce((acc, curr) => acc + curr.votes.length, 0) || 0;
                const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
                const hasVoted = post.poll?.options.some(opt => opt.votes.includes(student?.id || ''));
                const isSelected = option.votes.includes(student?.id || '');

                return (
                  <Button
                    key={idx}
                    variant="outline"
                    disabled={!student || hasVoted}
                    onClick={() => onVote(post.id, idx)}
                    className={cn(
                      "w-full justify-start relative overflow-hidden h-9 px-3",
                      isSelected && "border-primary/50"
                    )}
                  >
                    {hasVoted && (
                      <div 
                        className={cn("absolute inset-y-0 left-0 opacity-10", isSelected ? "bg-primary" : "bg-muted-foreground")}
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                    <div className="relative flex w-full justify-between items-center">
                      <span className={cn("text-xs", isSelected && "font-bold text-primary")}>{option.text}</span>
                      {hasVoted && <span className="text-[10px] font-mono opacity-70">{percentage}%</span>}
                    </div>
                  </Button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium px-0.5">
              {post.poll.options.reduce((acc, curr) => acc + curr.votes.length, 0)} votes
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={!student}
            className={cn(
                "h-8 px-3 gap-1.5",
                isLiked ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50" : "text-muted-foreground"
            )}
            onClick={(e) => { e.stopPropagation(); onLike(post.id, isLiked); }}
          >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              <span className="text-xs font-bold tabular-nums">{(post.likes || []).length}</span>
          </Button>

          <div className="flex items-center gap-1.5 h-8 px-3 text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs font-bold tabular-nums">{post.commentCount || 0}</span>
          </div>
      </CardFooter>
    </Card>
  );
}
