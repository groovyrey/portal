import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Financial Accounts',
  description: 'View your student balance, payment history, and financial records.',
};

export default function AccountsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
