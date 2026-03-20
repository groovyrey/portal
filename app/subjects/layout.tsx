import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subjects',
  description: 'Explore your current subjects, course descriptions, and schedules.',
};

export default function SubjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
