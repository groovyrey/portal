import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Team',
  description: 'Meet the creators and contributors behind LCC Hub.',
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
