import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EAF Viewer',
  description: 'View and manage your Electronic Admission Form (EAF).',
};

export default function EAFLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
