'use client';

import { useEffect, createContext, useContext, useState, useRef } from 'react';
import Ably from 'ably';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';

const RealtimeContext = createContext<{ activePostId: string | null; setActivePostId: (id: string | null) => void }>({
  activePostId: null,
  setActivePostId: () => {},
});

export const useRealtime = () => useContext(RealtimeContext);

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const ablyRef = useRef<Ably.Realtime | null>(null);

  useEffect(() => {
    const checkLogin = () => {
      const data = localStorage.getItem('student_data');
      if (data) {
        const parsed = JSON.parse(data);
        setStudentId(parsed.id);
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      } else {
        setStudentId(null);
      }
    };
    checkLogin();
    window.addEventListener('local-storage-update', checkLogin);
    window.addEventListener('storage', checkLogin);
    return () => {
      window.removeEventListener('local-storage-update', checkLogin);
      window.removeEventListener('storage', checkLogin);
    };
  }, [queryClient]);

  useEffect(() => {
    // Initialize Ably once
    if (!ablyRef.current) {
      ablyRef.current = new Ably.Realtime({ 
        authUrl: '/api/ably/auth',
        closeOnUnload: true
      });

      ablyRef.current.connection.on('connected', () => {
        console.log('Ably Connected');
      });

      ablyRef.current.connection.on('failed', () => {
        console.error('Ably Connection Failed');
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
    };

    const onStudentUpdate = (message: any) => {
      const { type } = message.data;
      if (type === 'SYNC_COMPLETE') {
        queryClient.invalidateQueries({ queryKey: ['student-data'] });
        toast.success('Your data has been updated in the background.', {
          description: 'Latest records from the portal are now visible.',
          duration: 3000,
        });
      }
    };

    communityChannel.subscribe('update', onUpdate);
    if (studentChannel) studentChannel.subscribe('update', onStudentUpdate);

    return () => {
      communityChannel.unsubscribe('update', onUpdate);
      if (studentChannel) studentChannel.unsubscribe('update', onStudentUpdate);
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
    <RealtimeContext.Provider value={{ activePostId, setActivePostId }}>
      {children}
    </RealtimeContext.Provider>
  );
}
