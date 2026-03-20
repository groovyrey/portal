import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal Assistant',
  description: 'Interact with your intelligent AI academic assistant.',
};

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
