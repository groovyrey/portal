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

import { messaging } from './db';
import { getToken, onMessage } from 'firebase/messaging';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const { student } = useStudent();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkExistingToken();
    }
  }, [student?.id]);

  async function checkExistingToken() {
    if (!messaging || !student?.id) return;
    try {
      if (Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/sw.js');
        // Wait for service worker to be ready/active
        await navigator.serviceWorker.ready;
        
        const currentToken = await getToken(messaging!, {
          vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          serviceWorkerRegistration: registration
        });
        
        if (currentToken) {
          setToken(currentToken);
          setIsSubscribed(true);
          syncTokenWithBackend(student!.id, currentToken);
        }
      }
    } catch (err) {
      console.error('Error checking existing FCM token:', err);
    }
  }

  async function syncTokenWithBackend(userId: string, fcmToken: string) {
    try {
      await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription: { token: fcmToken } })
      });
    } catch (err) {
      console.error('Failed to sync FCM token:', err);
    }
  }

  async function subscribe() {
    toast.error('Web push notifications are temporarily disabled.');
    return;
    
    if (!messaging || !student?.id) {
      console.warn('Messaging or Student ID missing', { messaging: !!messaging, studentId: student?.id });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted. Registering service worker...');
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        
        console.log('Service worker ready. Requesting FCM token...');
        const currentToken = await getToken(messaging!, {
          vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          serviceWorkerRegistration: registration
        });

        if (currentToken) {
          console.log('FCM Token received:', currentToken);
          setToken(currentToken);
          setIsSubscribed(true);
          await syncTokenWithBackend(student!.id, currentToken);
          toast.success('Notifications enabled!');
        } else {
          console.warn('No registration token available.');
          toast.error('Failed to get notification token.');
        }
      } else {
        console.warn('Notification permission denied:', permission);
        toast.error('Permission denied. Please allow notifications in your browser settings.');
      }
    } catch (err: any) {
      console.error('Failed to subscribe to FCM:', err);
      // Log more details if available
      if (err.message) console.error('Error message:', err.message);
      if (err.code) console.error('Error code:', err.code);
      
      toast.error(`Failed to enable notifications: ${err.message || 'Unknown error'}`);
    }
  }

  async function unsubscribe() {
    if (!token || !student?.id) return;

    try {
      // For simplicity, we just remove it from our backend
      await fetch('/api/push-subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: student.id, 
          endpoint: token // We'll use token as endpoint for deletion
        })
      });

      setToken(null);
      setIsSubscribed(false);
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    }
  }

  return { isSupported, isSubscribed, subscribe, unsubscribe };
}
