'use client';

import { useState, useEffect } from 'react';
import { Student, Notification } from '@/types';
import { useQuery } from '@tanstack/react-query';

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
    const timer = setTimeout(() => checkStudent(), 0);
    window.addEventListener('storage', checkStudent);
    window.addEventListener('local-storage-update', checkStudent);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', checkStudent);
      window.removeEventListener('local-storage-update', checkStudent);
    };
  }, []);

  return { student, isLoading };
}

export function useNotificationsQuery(enabled = true) {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/student/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      return data.notifications || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 15, // 15 minutes (fallback)
    refetchOnWindowFocus: false,
    enabled,
  });
}

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

export function useStudentQuery() {
  return useQuery<Student | null>({
    queryKey: ['student-data'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/student/me');
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            localStorage.setItem('student_data', JSON.stringify(result.data));
            window.dispatchEvent(new Event('local-storage-update'));
            return result.data as Student;
          }
        } else if (res.status === 401 || res.status === 404) {
          // Clear local storage if unauthorized or student not found
          localStorage.removeItem('student_data');
          window.dispatchEvent(new Event('local-storage-update'));
        }
      } catch (err) {
        console.error('Error in useStudentQuery:', err);
      }
      return null;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });
}
