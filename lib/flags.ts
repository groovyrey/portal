import { unstable_flag as flag } from '@vercel/flags/next';

export const showTestFeature = flag({
  key: 'test-feature',
  decide: async () => {
    // In a real app, you might check a database, Edge Config, or user session
    // For this demo, we'll default to true if the environment variable is set
    return process.env.NODE_ENV === 'development';
  },
});
