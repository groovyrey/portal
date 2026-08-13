export type CardThemeKey = 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'indigo';

export interface CardTheme {
  bg: string;
  icon: string;
  tile: string;
  bar: string;
}

export const CARD_THEMES: Record<CardThemeKey, CardTheme> = {
  emerald: {
    bg: 'from-emerald-100 via-emerald-50/70 to-background dark:from-emerald-500/15 dark:via-emerald-500/5 dark:to-background',
    icon: 'text-emerald-600 dark:text-emerald-400',
    tile: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    bar: 'bg-emerald-500',
  },
  sky: {
    bg: 'from-sky-100 via-sky-50/70 to-background dark:from-sky-500/15 dark:via-sky-500/5 dark:to-background',
    icon: 'text-sky-600 dark:text-sky-400',
    tile: 'bg-sky-500/10 dark:bg-sky-500/20',
    bar: 'bg-sky-500',
  },
  violet: {
    bg: 'from-violet-100 via-violet-50/70 to-background dark:from-violet-500/15 dark:via-violet-500/5 dark:to-background',
    icon: 'text-violet-600 dark:text-violet-400',
    tile: 'bg-violet-500/10 dark:bg-violet-500/20',
    bar: 'bg-violet-500',
  },
  amber: {
    bg: 'from-amber-100 via-amber-50/70 to-background dark:from-amber-500/15 dark:via-amber-500/5 dark:to-background',
    icon: 'text-amber-600 dark:text-amber-400',
    tile: 'bg-amber-500/10 dark:bg-amber-500/20',
    bar: 'bg-amber-500',
  },
  rose: {
    bg: 'from-rose-100 via-rose-50/70 to-background dark:from-rose-500/15 dark:via-rose-500/5 dark:to-background',
    icon: 'text-rose-600 dark:text-rose-400',
    tile: 'bg-rose-500/10 dark:bg-rose-500/20',
    bar: 'bg-rose-500',
  },
  indigo: {
    bg: 'from-indigo-100 via-indigo-50/70 to-background dark:from-indigo-500/15 dark:via-indigo-500/5 dark:to-background',
    icon: 'text-indigo-600 dark:text-indigo-400',
    tile: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    bar: 'bg-indigo-500',
  },
};
