import { flag } from 'flags/next';

export const getTestFeature = flag<{ greeting: string } | null>({
  key: 'test-feature',
  decide: async () => {
    // In development, we'll return a default greeting. 
    // In production, this would be controlled by Vercel.
    if (process.env.NODE_ENV === 'development') {
      return { greeting: 'Hello! This is your custom greeting from Vercel Flags.' };
    }
    return null;
  },
});
