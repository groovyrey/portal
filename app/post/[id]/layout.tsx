import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    // We can't easily import a full DB service for posts here without knowing where it is,
    // but we can use the same API the client uses, or just fetch from Firestore directly.
    // For now, let's use a generic title as the post content is dynamic.
    // Ideally we'd fetch the post title/topic here.
    
    // Attempt to fetch from API internally if possible, or just use a good default.
    return {
      title: 'Community Post',
      description: 'Read and join the discussion on this community post.',
    };
  } catch (e) {
    return {
      title: 'Post',
    };
  }
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
