'use client';

import React, { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StarRatingProps {
  onSuccess?: () => void;
}

export default function StarRating({ onSuccess }: StarRatingProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/ratings')
      .then(res => res.json())
      .then(data => {
        if (data.userRating) {
          setRating(data.userRating.rating);
          setFeedback(data.userRating.feedback || '');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });

      if (!res.ok) throw new Error('Failed to submit rating');
      
      setSubmitted(true);
      toast.success('Your rating has been updated!');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Could not submit rating. Try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Loading your rating...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="h-12 w-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="h-6 w-6 fill-current" />
        </div>
        <p className="text-sm font-bold text-foreground">Thank you!</p>
        <p className="text-xs text-muted-foreground mt-1">Your feedback helps us improve LCC Hub.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Rate your experience</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none transition-all active:opacity-70"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  (hover || rating) >= star
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/20'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
            {['Terrible', 'Bad', 'Okay', 'Good', 'Amazing'][rating - 1]}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            maxLength={500}
            placeholder="What do you think of LCC Hub? (Optional)"
            className="w-full bg-accent/50 dark:bg-accent/20 border border-border rounded-2xl p-4 text-sm focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none min-h-[100px] resize-none text-foreground placeholder:text-muted-foreground/50"
          />
          <div className="absolute bottom-3 right-4">
            <span className={`text-[9px] font-bold uppercase tracking-widest ${feedback.length >= 450 ? 'text-red-500' : 'text-muted-foreground/30'}`}>
              {feedback.length}/500
            </span>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
          className="w-full py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Feedback'
          )}
        </button>
      </div>
    </div>
  );
}
