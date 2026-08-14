export interface AccentTheme {
  id: string;
  name: string;
  description: string;
  from: string;
  to: string;
}

export const ACCENT_THEMES: AccentTheme[] = [
  { id: 'blue', name: 'Ocean Blue', description: 'The classic LCCian look', from: '#60a5fa', to: '#2563eb' },
  { id: 'emerald', name: 'Emerald', description: 'Fresh and calm', from: '#34d399', to: '#059669' },
  { id: 'violet', name: 'Violet', description: 'Bold and vibrant', from: '#a78bfa', to: '#7c3aed' },
  { id: 'rose', name: 'Rose', description: 'Warm and energetic', from: '#fb7185', to: '#e11d48' },
  { id: 'amber', name: 'Amber', description: 'Warm and golden', from: '#fbbf24', to: '#b45309' },
  { id: 'cyan', name: 'Cyan', description: 'Cool and crisp', from: '#22d3ee', to: '#0891b2' },
];

export const DEFAULT_ACCENT = 'blue';

export function applyAccent(id: string) {
  if (typeof document === 'undefined') return;
  const valid = ACCENT_THEMES.some((t) => t.id === id);
  document.documentElement.setAttribute('data-accent', valid ? id : DEFAULT_ACCENT);
}
