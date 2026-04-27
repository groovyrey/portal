export const PORTAL_BASE = 'https://premium.schoolista.com/LCC';
export const ORIGIN = 'https://premium.schoolista.com';

export const QUEST_CATEGORIES = [
  'General', 'Computers', 'Math', 'Science', 'History', 'Geography', 'Sports', 'Gaming', 'Art'
];

export function getFeaturedCategory(): string {
  // Use day of year to cycle through categories
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);

  return QUEST_CATEGORIES[day % QUEST_CATEGORIES.length];
}
