export type CardThemeKey = 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'indigo';

export interface CardTheme {
  bg: string;
  icon: string;
  tile: string;
  bar: string;
}

export const ACCENT_CARD: CardTheme = {
  bg: 'bg-card',
  icon: 'text-primary',
  tile: 'bg-primary/10',
  bar: 'bg-primary',
};

export const CARD_THEMES: Record<CardThemeKey, CardTheme> = {
  emerald: ACCENT_CARD,
  sky: ACCENT_CARD,
  violet: ACCENT_CARD,
  amber: ACCENT_CARD,
  rose: ACCENT_CARD,
  indigo: ACCENT_CARD,
};
