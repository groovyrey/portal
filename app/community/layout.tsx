import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community',
  description: 'Connect with fellow students and share academic insights.',
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
