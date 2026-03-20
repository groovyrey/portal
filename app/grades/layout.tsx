import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grades',
  description: 'View your academic performance, GPA, and semester grades.',
};

export default function GradesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
