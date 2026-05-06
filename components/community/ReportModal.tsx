'use client';

import React, { useState } from 'react';
import { 
  Flag, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowRight, 
  Loader2,
  User,
  Clock
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CommunityMarkdown from './CommunityMarkdown';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment';
  targetId: string;
  content: string;
  authorName: string;
  onReportSuccess?: (decision: 'APPROVED' | 'REJECTED') => void;
}

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  content,
  authorName,
  onReportSuccess
}: ReportModalProps) {
  const [step, setStep] = useState<'confirm' | 'loading' | 'result'>('confirm');
  const [result, setResult] = useState<{ decision: 'APPROVED' | 'REJECTED'; reason: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReport = async () => {
    setStep('loading');
    setError(null);
    try {
      const endpoint = targetType === 'post' ? '/api/community/report' : '/api/community/comments/report';
      const body = targetType === 'post' ? { postId: targetId } : { commentId: targetId };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      if (res.ok) {
        setResult({ decision: data.decision, reason: data.reason });
        setStep('result');
        if (onReportSuccess) onReportSuccess(data.decision);
      } else {
        throw new Error(data.error || 'Failed to process report');
      }
    } catch (err: any) {
      setError(err.message);
      setStep('confirm');
    }
  };

  const handleClose = () => {
    setStep('confirm');
    setResult(null);
    setError(null);
    onClose();
  };

  if (step === 'confirm') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Report Content">
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-destructive">Are you sure you want to report this?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reporting helps keep our community safe. Our AI moderator (Aegis) will review this content immediately.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reported Content</span>
            </div>
            
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border">
                  <AvatarFallback className="text-[10px]">{authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold">{authorName}</span>
              </div>
              <div className="text-sm text-foreground/90 leading-relaxed italic line-clamp-4">
                <CommunityMarkdown content={content} />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs font-bold text-destructive text-center">{error}</p>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button 
              variant="destructive" 
              className="w-full h-11 font-bold uppercase tracking-widest text-xs"
              onClick={handleReport}
            >
              <Flag className="mr-2 h-4 w-4" />
              Submit Report
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-11 font-bold uppercase tracking-widest text-xs"
              onClick={handleClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (step === 'loading') {
    return (
      <Modal isOpen={isOpen} onClose={() => {}} noPadding>
        <div className="p-12 flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
            <ShieldAlert className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Aegis is Reviewing</h3>
            <p className="text-sm text-muted-foreground px-4">
              Our AI is analyzing the content against community guidelines...
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  const isRejected = result?.decision === 'REJECTED';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} noPadding>
      <div className="p-8 flex flex-col items-center text-center">
        <div className={`mb-6 p-4 rounded-2xl ${
          isRejected ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        }`}>
          {isRejected ? (
            <ShieldAlert className="h-10 w-10" />
          ) : (
            <ShieldCheck className="h-10 w-10" />
          )}
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">
          {isRejected ? 'Content Removed' : 'Report Reviewed'}
        </h2>
        
        <p className="text-sm text-muted-foreground mb-8 px-2 font-medium leading-relaxed">
          {isRejected 
            ? "Aegis has determined this content violates our guidelines and it has been removed from the platform." 
            : "Aegis has reviewed the content and determined it follows our community guidelines. However, it will be monitored for further reports."}
        </p>

        <div className="w-full bg-accent/50 dark:bg-accent/20 rounded-2xl p-5 mb-8 text-left border border-border">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aegis Decision Reason</span>
          </div>
          <p className="text-xs text-muted-foreground font-bold leading-relaxed italic">
            &quot;{result?.reason}&quot;
          </p>
        </div>

        <button
          onClick={handleClose}
          className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
            isRejected ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20' : 'bg-primary text-primary-foreground hover:opacity-90 shadow-primary/20'
          }`}
        >
          {isRejected ? 'I understand' : 'Got it, thanks!'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Modal>
  );
}
