'use client';

import { useState, useEffect } from 'react';
import { Student } from '@/types';
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

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { student } = useStudent();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setRegistration(reg);
      
      const sub = await reg.pushManager.getSubscription();
      setSubscription(sub);
      setIsSubscribed(!!sub);

      if (sub && student?.id) {
        // Sync with backend if student is logged in
        syncSubscriptionWithBackend(student.id, sub);
      }
    } catch (err) {
      console.error('Service worker registration failed:', err);
    }
  }

  async function syncSubscriptionWithBackend(userId: string, sub: PushSubscription) {
    try {
      await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription: sub })
      });
    } catch (err) {
      console.error('Failed to sync push subscription:', err);
    }
  }

  async function subscribe() {
    if (!registration || !student?.id) return;

    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key is not set');
        return;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      setSubscription(sub);
      setIsSubscribed(true);
      await syncSubscriptionWithBackend(student.id, sub);
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
    }
  }

  async function unsubscribe() {
    if (!subscription || !student?.id) return;

    try {
      await subscription.unsubscribe();
      
      await fetch('/api/push-subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: student.id, 
          endpoint: subscription.endpoint 
        })
      });

      setSubscription(null);
      setIsSubscribed(false);
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    }
  }

  return { isSupported, isSubscribed, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
