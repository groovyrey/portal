'use client';

import { useEffect, createContext, useContext, useState, useRef } from 'react';
import Ably from 'ably';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';

const RealtimeContext = createContext<{ 
  activePostId: string | null; 
  setActivePostId: (id: string | null) => void;
  onlineUsers: Set<string>;
}>({
  activePostId: null,
  setActivePostId: () => {},
  onlineUsers: new Set(),
});

export const useRealtime = () => useContext(RealtimeContext);

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const ablyRef = useRef<Ably.Realtime | null>(null);

  useEffect(() => {
    const checkLogin = (isInitial = false) => {
      const data = localStorage.getItem('student_data');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.id !== studentId) {
          setStudentId(parsed.id);
          // Only invalidate if it's not the initial mount to avoid double-fetching
          if (!isInitial) {
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            queryClient.invalidateQueries({ queryKey: ['student-data'] });
          }
        }
      } else if (studentId) {
        setStudentId(null);
      }
    };

    const handleUpdate = () => checkLogin(false);

    checkLogin(true);
    window.addEventListener('local-storage-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('local-storage-update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [queryClient, studentId]);

  useEffect(() => {
    // Initialize Ably once
    if (!ablyRef.current) {
      ablyRef.current = new Ably.Realtime({ 
        authUrl: '/api/ably/auth',
        closeOnUnload: true
      });

      ablyRef.current.connection.on('connected', () => {
        console.log('Ably Connected');
        toast.success('Real-time connection established', {
          description: 'You will receive live updates from the community.',
          duration: 3000,
        });
      });

      ablyRef.current.connection.on('failed', () => {
        console.error('Ably Connection Failed');
        toast.error('Real-time connection failed', {
          description: 'Live updates may be delayed. Try reloading if the issue persists.',
        });
      });
      
      ablyRef.current.connection.on('closed', () => {
        console.log('Ably Connection Closed');
      });
    }

    const ably = ablyRef.current;
    const communityChannel = ably.channels.get('community');
    const studentChannel = studentId ? ably.channels.get(`student-${studentId}`) : null;

    const onUpdate = (message: any) => {
      const { type, postId, userName } = message.data;
      
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });

      if (postId && activePostId === postId.toString()) {
        queryClient.invalidateQueries({ queryKey: ['comments', activePostId] });
      }

      if (type === 'POST_CREATED' && window.location.pathname !== '/community') {
        toast.info(`New post by ${userName || 'a student'}`, {
          description: 'A new post has been shared in the community.',
          action: {
            label: 'View',
            onClick: () => window.location.href = '/community'
          },
          duration: 5000,
        });
      }

      if (type === 'GLOBAL_NOTIFICATION_RELOAD') {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    };

    const onStudentUpdate = (message: any) => {
      const { type, notification } = message.data;
      if (type === 'SYNC_COMPLETE') {
        queryClient.invalidateQueries({ queryKey: ['student-data'] });
        toast.success('Your data has been updated in the background.', {
          description: 'Latest records from the portal are now visible.',
          duration: 3000,
        });
      }

      if (type === 'NOTIFICATION_RECEIVED' && notification) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        toast.info(notification.title, {
          description: notification.message,
          action: notification.link ? {
            label: 'View',
            onClick: () => window.location.href = notification.link
          } : undefined,
          duration: 5000,
        });
      }
    };

    communityChannel.subscribe('update', onUpdate);
    if (studentChannel) studentChannel.subscribe('update', onStudentUpdate);

    // Presence logic
    if (studentId) {
      communityChannel.presence.enter();
    }

    const updatePresence = async () => {
      try {
        const members = await communityChannel.presence.get();
        const clientIds = members
          .filter(m => m.clientId && m.clientId !== 'anonymous')
          .map(m => m.clientId!);
        setOnlineUsers(new Set(clientIds));
      } catch (err) {
        console.error('Failed to fetch presence:', err);
      }
    };

    communityChannel.presence.subscribe(['enter', 'leave', 'present'], updatePresence);
    updatePresence();

    return () => {
      communityChannel.unsubscribe('update', onUpdate);
      if (studentChannel) studentChannel.unsubscribe('update', onStudentUpdate);
      communityChannel.presence.unsubscribe(['enter', 'leave', 'present'], updatePresence);
      if (studentId) communityChannel.presence.leave();
    };
  }, [queryClient, studentId, activePostId]);

  useEffect(() => {
    return () => {
      if (ablyRef.current) {
        ablyRef.current.close();
        ablyRef.current = null;
      }
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ activePostId, setActivePostId, onlineUsers }}>
      {children}
    </RealtimeContext.Provider>
  );
}
