'use client';

import { Student } from '@/types';
import { Cloud, Sun, CloudRain, Moon, Sparkles, Loader2, PartyPopper, RotateCcw } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const FALLBACK_QUOTES = [
  { q: "Education is the most powerful weapon which you can use to change the world.", a: "Nelson Mandela" },
  { q: "The beautiful thing about learning is that no one can take it away from you.", a: "B.B. King" },
  { q: "Success is the sum of small efforts, repeated day in and day out.", a: "Robert Collier" },
  { q: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", a: "Dr. Seuss" },
  { q: "Intelligence plus character - that is the goal of true education.", a: "Martin Luther King Jr." },
  { q: "An investment in knowledge pays the best interest.", a: "Benjamin Franklin" },
  { q: "The direction in which education starts a man will determine his future in life.", a: "Plato" },
  { q: "Recipe for success: Study while others are sleeping; work while others are loafing; prepare while others are playing; and dream while others are wishing.", a: "William A. Ward" }
];

interface Holiday {
  date: string;
  localName: string;
  name: string;
}

export default function DailyGreeting({ student }: { student: Student }) {
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(true);
  const [holiday, setHoliday] = useState<Holiday | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchQuote = useCallback(async (force = false) => {
    const today = currentDate.toDateString();
    try {
      setLoading(true);
      
      // Check if we have a quote for today in localStorage (skip if force is true)
      if (!force) {
        const cachedQuoteStr = localStorage.getItem('daily_quote_data');
        if (cachedQuoteStr) {
          const cached = JSON.parse(cachedQuoteStr);
          if (cached.date === today) {
            setQuote(cached.quote);
            setAuthor(cached.author);
            setLoading(false);
            return;
          }
        }
      }

      const response = await fetch('/api/quotes');
      if (!response.ok) throw new Error();
      const data = await response.json();
      
      if (data && data.quote) {
        setQuote(data.quote);
        setAuthor(data.author);
        
        // Cache for today
        localStorage.setItem('daily_quote_data', JSON.stringify({
          quote: data.quote,
          author: data.author,
          date: today
        }));
      } else {
        throw new Error();
      }
    } catch (err) {
      const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
      setQuote(fallback.q);
      setAuthor(fallback.a);

      // Cache the fallback for today as well
      localStorage.setItem('daily_quote_data', JSON.stringify({
        quote: fallback.q,
        author: fallback.a,
        date: today
      }));
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  const checkHoliday = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const day = currentDate.getDate().toString().padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      // Fetch from the internal API
      const response = await fetch(`/api/student/holidays?year=${year}`);
      if (response.ok) {
        const holidays: Holiday[] = await response.json();
        const todayHoliday = holidays.find(h => h.date === todayStr);
        if (todayHoliday) setHoliday(todayHoliday);
      }
    } catch (e) {
      console.error('Failed to fetch holidays', e);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchQuote();
    checkHoliday();
    
    const hour = currentDate.getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');

    // Update date periodically (every minute) to handle day transition while tab is open
    const timer = setInterval(() => {
      const now = new Date();
      if (now.toDateString() !== currentDate.toDateString()) {
        setCurrentDate(now);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [currentDate, fetchQuote, checkHoliday]);

  const getIcon = () => {
    switch (timeOfDay) {
      case 'morning': return <Sun className="h-5 w-5 text-amber-500" />;
      case 'afternoon': return <Cloud className="h-5 w-5 text-sky-400" />;
      case 'evening': return <Moon className="h-5 w-5 text-indigo-400" />;
    }
  };

  const firstName = student.parsedName?.firstName || student.name.split(' ')[0];

  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(currentDate);
  const formattedDate = new Intl.DateTimeFormat('en-US', { 
    month: 'long', 
    day: '2-digit', 
    year: 'numeric' 
  }).format(currentDate);

  return (
    <div className="bg-gradient-to-br from-primary/5 via-card to-card border border-primary/10 rounded-3xl p-6 relative overflow-hidden group min-h-[180px] flex flex-col justify-between shadow-sm">
      <div className="absolute -right-8 -top-8 h-32 w-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
      <div className="absolute -left-8 -bottom-8 h-32 w-32 bg-sky-500/5 rounded-full blur-3xl group-hover:bg-sky-500/10 transition-colors" />

      <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-background border border-border flex items-center justify-center shadow-sm">
              {getIcon()}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              {timeOfDay === 'morning' ? 'Good Morning' : timeOfDay === 'afternoon' ? 'Good Afternoon' : 'Good Evening'},
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4">
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {firstName} <span className="text-primary">.</span>
            </h2>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-[9px] font-black text-primary uppercase tracking-wider border border-primary/20">
                Year {student.yearLevel || '?'}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border border-emerald-500/20">
                Sem {student.semester || '?'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground leading-none mb-1">
            {dayName}
          </p>
          <p className="text-lg font-black text-foreground tabular-nums tracking-tighter leading-none">
            {formattedDate}
          </p>
        </div>
      </div>

      {holiday && (
        <div className="relative mt-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3 animate-bounce-subtle">
          <PartyPopper className="h-4 w-4 text-primary" />
          <p className="text-xs font-bold text-primary tracking-tight">
            Today is <span className="uppercase">{holiday.localName || holiday.name}</span>. Enjoy your holiday!
          </p>
        </div>
      )}

      <div className="relative mt-8 pt-6 border-t border-border/50 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-1 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
          </div>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fetching inspiration...</span>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-bold italic text-muted-foreground leading-relaxed">
                "{quote}"
              </p>
              {author && (
                <p className="text-[9px] font-black uppercase tracking-widest text-primary/70">
                  — {author}
                </p>
              )}
            </div>
          )}
        </div>

        <motion.button
          onClick={() => fetchQuote(true)}
          disabled={loading}
          whileHover={{ rotate: -180 }}
          whileTap={{ scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors shrink-0"
          title="Refresh Quote"
        >
          <RotateCcw className={`h-3 w-3 ${loading ? 'animate-spin-reverse' : ''}`} />
        </motion.button>
      </div>
    </div>
  );
}
