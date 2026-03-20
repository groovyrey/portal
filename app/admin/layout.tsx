import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'Management and monitoring dashboard for LCC Hub administrators.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
