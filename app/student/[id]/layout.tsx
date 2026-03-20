import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Profile',
  description: 'View student information and academic activity on LCC Hub.',
};

export default function StudentProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
