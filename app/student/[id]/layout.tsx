import { Metadata } from 'next';
import { getStudentProfile } from '@/lib/data-service';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const student = await getStudentProfile(params.id);
  
  if (!student) {
    return {
      title: 'Student Profile',
      description: 'View student information and academic activity.',
    };
  }

  return {
    title: `${student.name} (@${student.id})`,
    description: `Academic profile of ${student.name} (${student.course}) on LCC Hub.`,
  };
}

export default function StudentProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
