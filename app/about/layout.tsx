import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn more about the mission and vision of LCC Hub.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
