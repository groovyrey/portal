import { Metadata } from 'next';
import { getOfferedSubjects } from '@/lib/data-service';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const subjectCode = decodeURIComponent(params.id);
  const subjects = await getOfferedSubjects();
  const subject = subjects.find(s => s.code === subjectCode);
  
  if (!subject) {
    return {
      title: subjectCode || 'Subject Detail',
      description: 'Detailed information about this academic subject.',
    };
  }

  return {
    title: `${subject.code}: ${subject.description}`,
    description: `Subject details for ${subject.description} (${subject.code}).`,
  };
}

export default function SubjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
