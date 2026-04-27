'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
import { toast } from 'sonner';
import { 
  Send, 
  User, 
  Loader2, 
  X, 
  Plus, 
  BarChart2,
  Ghost,
  Hash
} from 'lucide-react';
import { Student } from '@/types';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import CommunityMarkdown from './CommunityMarkdown';

interface CreatePostCardProps {
  student: Student | null;
  onSuccess?: () => void;
}

const topics = ['General', 'Academics', 'Campus Life', 'Career', 'Well-being'];

export default function CreatePostCard({ student, onSuccess }: CreatePostCardProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('General');
  const [showPollEditor, setShowPollEditor] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !pollQuestion.trim()) || posting) return;
    setPosting(true);

    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          userName: isAnonymous ? 'Anonymous Student' : (student?.name || 'Anonymous'),
          topic: topic,
          isAnonymous,
          isUnreviewed: false,
          poll: showPollEditor && pollQuestion.trim() ? {
            question: pollQuestion,
            options: pollOptions.filter(opt => opt.trim() !== '')
          } : null
        }),
      });

      const data = await res.json();
      if (data.success) {
        setContent('');
        setPollQuestion('');
        setPollOptions(['', '']);
        setIsAnonymous(false);
        setShowPollEditor(false);
        setActiveTab('write');
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        toast.success('Post shared successfully!');
        if (onSuccess) onSuccess();
      } else {
        toast.error(data.error || 'Failed to post');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setPosting(false);
    }
  };

  if (!student) {
    return (
      <div className="surface-violet relative overflow-hidden rounded-2xl p-8 border border-border/80 text-center space-y-4 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        <div className="h-12 w-12 bg-accent rounded-full flex items-center justify-center mx-auto">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Join the LCCians Community</h2>
        <p className="text-xs text-muted-foreground font-medium mb-4">
          Engage with fellow LCCians, share updates, and participate in community polls.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-6 py-2.5 rounded-xl text-xs font-bold transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="surface-sky relative overflow-hidden rounded-2xl border border-border/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10 focus-within:border-primary/30">
          <div className="flex border-b border-border">
            <button 
              type="button" 
              onClick={() => setActiveTab('write')}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'write' ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Write
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'preview' ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Preview
            </button>
          </div>
          
          <form onSubmit={handlePost} className="relative z-10 p-5 space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {topics.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all shrink-0 ${topic === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent text-muted-foreground border-border hover:border-muted-foreground'}`}
                >
                  <Hash className="h-3 w-3" />
                  {t}
                </button>
              ))}
            </div>

            <div>
              {activeTab === 'write' ? (
                <div className="space-y-3">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={2000}
                    placeholder="What's on your mind, LCCian? (Markdown supported)"
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium placeholder:text-muted-foreground/50 resize-none min-h-[120px] outline-none text-foreground"
                  />
                  <div className="flex justify-end">
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${content.length >= 1900 ? 'text-red-500' : 'text-muted-foreground/40'}`}>
                      {content.length}/2000
                    </span>
                  </div>
                </div>
              ) : (
                <div className="min-h-[120px] px-0.5">
                  {content.trim() ? (
                    <CommunityMarkdown 
                      content={content}
                      className="prose prose-slate dark:prose-invert prose-sm max-w-none"
                    />
                  ) : (
                    <p className="text-muted-foreground/50 italic text-sm font-medium">Preview will appear here...</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowPollEditor(!showPollEditor)} 
                  className={`p-2 rounded-lg transition-all ${showPollEditor ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`} 
                  title="Add Poll"
                >
                  <BarChart2 className="h-4 w-4" />
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setIsAnonymous(!isAnonymous)} 
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all border ${isAnonymous ? 'bg-foreground text-background border-foreground' : 'text-muted-foreground border-border hover:bg-accent'}`} 
                  title="Post Anonymously"
                >
                  <Ghost className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Anonymous</span>
                </button>
              </div>
              <button 
                type="submit" 
                disabled={(!content.trim() && !pollQuestion.trim()) || posting} 
                className="bg-primary hover:opacity-90 disabled:opacity-30 text-primary-foreground px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
              >
                {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Post
              </button>
            </div>
          </form>
        </div>

        {showPollEditor && activeTab === 'write' && (
          <div className="surface-amber relative overflow-hidden p-5 rounded-2xl border border-border/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground">Poll Details</label>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPollEditor(false)} 
                className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <input 
                  value={pollQuestion} 
                  onChange={(e) => setPollQuestion(e.target.value)} 
                  maxLength={100}
                  placeholder="Ask a question..." 
                  className="w-full px-3 py-2.5 bg-accent/50 border border-border rounded-xl text-sm font-bold placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-all text-foreground pr-12" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold text-muted-foreground/40 uppercase">
                  {pollQuestion.length}/100
                </span>
              </div>

              <div className="space-y-2">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="relative flex items-center gap-2">
                    <input 
                      value={opt} 
                      onChange={(e) => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }} 
                      maxLength={30}
                      placeholder={`Option ${i+1}`} 
                      className="flex-1 px-3 py-2 bg-accent/30 border border-border rounded-lg text-xs font-semibold focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50 text-foreground pr-10" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[7px] font-bold text-muted-foreground/30 uppercase">
                      {opt.length}/30
                    </span>
                  </div>
                ))}
                {pollOptions.length < 5 && (
                  <button 
                    type="button" 
                    onClick={() => setPollOptions([...pollOptions, ''])} 
                    className="mt-1 flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-wider hover:text-blue-600 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Add Option
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
