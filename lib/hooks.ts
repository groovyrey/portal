'use client';

import { useState, useEffect } from 'react';
import { Student } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useStudent() {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkStudent = () => {
    const data = localStorage.getItem('student_data');
    if (data) {
      try {
        setStudent(JSON.parse(data));
      } catch (e) {
        console.error('Failed to parse student data', e);
        setStudent(null);
      }
    } else {
      setStudent(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkStudent();
    window.addEventListener('storage', checkStudent);
    window.addEventListener('local-storage-update', checkStudent);

    return () => {
      window.removeEventListener('storage', checkStudent);
      window.removeEventListener('local-storage-update', checkStudent);
    };
  }, []);

  return { student, isLoading };
}

export function useStudentQuery() {
  return useQuery({
    queryKey: ['student-data'],
    queryFn: async () => {
      const res = await fetch('/api/student/me');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          localStorage.setItem('student_data', JSON.stringify(result.data));
          window.dispatchEvent(new Event('local-storage-update'));
          return result.data as Student;
        }
      }
      return null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
