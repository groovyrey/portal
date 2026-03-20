import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Profile',
  description: 'View student information and academic activity.',
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
