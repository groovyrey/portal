'use client';

import { Student } from '@/types';
import { Cloud, Sun, Moon, Sparkles, Loader2, PartyPopper, RotateCcw } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

const FALLBACK_QUOTES = [
  { q: "Education is the most powerful weapon which you can use to change the world.", a: 'Nelson Mandela' },
  { q: 'The beautiful thing about learning is that no one can take it away from you.', a: 'B.B. King' },
  { q: 'Success is the sum of small efforts, repeated day in and day out.', a: 'Robert Collier' },
  { q: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", a: 'Dr. Seuss' },
  { q: 'Intelligence plus character - that is the goal of true education.', a: 'Martin Luther King Jr.' },
  { q: 'An investment in knowledge pays the best interest.', a: 'Benjamin Franklin' },
  { q: 'The direction in which education starts a man will determine his future in life.', a: 'Plato' },
  { q: 'Recipe for success: Study while others are sleeping; work while others are loafing; prepare while others are playing; and dream while others are wishing.', a: 'William A. Ward' }
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
    const today = new Date().toDateString();
    try {
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

      setLoading(true);
      const response = await fetch('/api/quotes');
      if (!response.ok) throw new Error();
      const data = await response.json();

      if (data && data.quote) {
        setQuote(data.quote);
        setAuthor(data.author);

        localStorage.setItem(
          'daily_quote_data',
          JSON.stringify({
            quote: data.quote,
            author: data.author,
            date: new Date().toDateString()
          })
        );
      } else {
        throw new Error();
      }
    } catch {
      const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
      setQuote(fallback.q);
      setAuthor(fallback.a);

      localStorage.setItem(
        'daily_quote_data',
        JSON.stringify({
          quote: fallback.q,
          author: fallback.a,
          date: new Date().toDateString()
        })
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const checkHoliday = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const day = currentDate.getDate().toString().padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const response = await fetch(`/api/student/holidays?year=${year}`);
      if (response.ok) {
        const holidays: Holiday[] = await response.json();
        const todayHoliday = holidays.find((h) => h.date === todayStr);
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
      case 'morning':
        return <Sun className="h-5 w-5 text-amber-500" />;
      case 'afternoon':
        return <Cloud className="h-5 w-5 text-sky-500" />;
      case 'evening':
        return <Moon className="h-5 w-5 text-indigo-500" />;
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
    <section className="surface-sky relative overflow-hidden rounded-lg border border-border/80 p-4 sm:p-5 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
      <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-400/5" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-400/5" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background">{getIcon()}</div>
            <p className="text-xs font-medium">
              {timeOfDay === 'morning' ? 'Good morning' : timeOfDay === 'afternoon' ? 'Good afternoon' : 'Good evening'}
            </p>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{firstName}</h2>
          <p className="text-xs text-muted-foreground">
            Year {student.yearLevel || '?'} • Semester {student.semester || '?'}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs text-muted-foreground">{dayName}</p>
          <p className="text-base font-medium tabular-nums">{formattedDate}</p>
        </div>
      </div>

      {holiday && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          <PartyPopper className="h-4 w-4 text-primary" />
          <p className="text-xs">
            Today is {holiday.localName || holiday.name}.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Today's Quote</span>
        </div>
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Loading quote...</span>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{quote}"</p>
                {author && <p className="mt-2 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tight">— {author}</p>}
              </div>
            )}
          </div>

          <button
            onClick={() => fetchQuote(true)}
            disabled={loading}
            className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            title="Refresh Quote"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </section>
  );
}
