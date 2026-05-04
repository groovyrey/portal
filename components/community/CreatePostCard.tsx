'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { 
  Send, 
  User, 
  Loader2, 
  X, 
  Plus, 
  BarChart2,
  Ghost,
  Hash,
  Eye,
  PenLine
} from 'lucide-react';
import { Student } from '@/types';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import CommunityMarkdown from './CommunityMarkdown';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CreatePostCardProps {
  student: Student | null;
  onSuccess?: () => void;
}

const topics = ['General', 'Academics', 'Campus Life', 'Career', 'Well-being'];

export default function CreatePostCard({ student, onSuccess }: CreatePostCardProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('General');
  const [showPollEditor, setShowPollEditor] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);
  const [activeView, setActiveView] = useState('write');

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
        setActiveView('write');
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        toast.success('Post shared');
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
      <Card className="border-dashed bg-muted/20">
        <CardContent className="p-12 text-center space-y-4">
          <div className="h-12 w-12 bg-background rounded-full flex items-center justify-center mx-auto border shadow-sm text-muted-foreground">
            <User className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-bold">Join the conversation</p>
            <p className="text-sm text-muted-foreground">Sign in to participate in the community.</p>
          </div>
          <Button asChild>
            <Link href="/">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <form onSubmit={handlePost}>
        <CardHeader className="p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {topics.map(t => (
              <Badge
                key={t}
                variant={topic === t ? "default" : "outline"}
                className="cursor-pointer px-3 py-1 rounded-full uppercase text-[9px] font-bold"
                onClick={() => setTopic(t)}
              >
                {t}
              </Badge>
            ))}
          </div>
        </CardHeader>
        
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
           <div className="px-4 py-2 border-b flex items-center justify-between">
              <TabsList className="h-8 p-1 bg-muted/50">
                 <TabsTrigger value="write" className="text-[10px] uppercase font-bold px-4 h-6">Write</TabsTrigger>
                 <TabsTrigger value="preview" className="text-[10px] uppercase font-bold px-4 h-6">Preview</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                 <Button 
                   type="button" 
                   variant={showPollEditor ? "default" : "outline"} 
                   size="icon" 
                   className="h-8 w-8"
                   onClick={() => setShowPollEditor(!showPollEditor)}
                 >
                   <BarChart2 className="h-4 w-4" />
                 </Button>
                 <Button 
                   type="button" 
                   variant={isAnonymous ? "secondary" : "outline"} 
                   size="sm" 
                   className="h-8 gap-2 text-[10px] uppercase font-bold"
                   onClick={() => setIsAnonymous(!isAnonymous)}
                 >
                   <Ghost className="h-3.5 w-3.5" />
                   {isAnonymous ? 'Incognito' : 'Public'}
                 </Button>
              </div>
           </div>

           <CardContent className="p-0">
             <TabsContent value="write" className="m-0 p-4 space-y-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts... (Markdown supported)"
                  className="w-full min-h-[160px] bg-transparent border-none p-0 focus:ring-0 text-sm leading-relaxed resize-none outline-none"
                />
                
                {showPollEditor && (
                  <div className="p-4 rounded-md border bg-muted/20 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                        <BarChart2 className="h-3 w-3" /> Poll Options
                      </Label>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPollEditor(false)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                       <Input 
                         value={pollQuestion} 
                         onChange={(e) => setPollQuestion(e.target.value)} 
                         placeholder="Ask a question..."
                         className="font-bold h-9"
                       />
                       <div className="grid gap-2">
                          {pollOptions.map((opt, i) => (
                            <div key={i} className="flex gap-2">
                               <Input 
                                 value={opt} 
                                 onChange={(e) => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }} 
                                 placeholder={`Option ${i+1}`}
                                 className="h-8 text-xs"
                               />
                               {pollOptions.length > 2 && (
                                 <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}>
                                    <X className="h-3 w-3" />
                                 </Button>
                               )}
                            </div>
                          ))}
                          {pollOptions.length < 5 && (
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] uppercase gap-1 w-fit" onClick={() => setPollOptions([...pollOptions, ''])}>
                               <Plus className="h-3 w-3" /> Add Option
                            </Button>
                          )}
                       </div>
                    </div>
                  </div>
                )}
             </TabsContent>
             <TabsContent value="preview" className="m-0 p-6 min-h-[210px] bg-muted/10">
                {content.trim() ? (
                  <CommunityMarkdown content={content} />
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center pt-10">Nothing to preview yet.</p>
                )}
             </TabsContent>
           </CardContent>
        </Tabs>

        <CardFooter className="p-4 border-t flex items-center justify-between bg-muted/5">
           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {content.length}/2000 characters
           </p>
           <Button 
             type="submit" 
             disabled={(!content.trim() && !pollQuestion.trim()) || posting}
             className="gap-2 px-6"
           >
             {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
             Post Community
           </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
