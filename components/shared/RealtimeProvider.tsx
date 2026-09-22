'use client';

import { useEffect, createContext, useContext, useState, useRef } from 'react';
import Ably from 'ably';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface MemberStatus {
  isOnline: boolean;
}

const RealtimeContext = createContext<{
  onlineMembers: Map<string, MemberStatus>;
}>({
  onlineMembers: new Map(),
});

export const useRealtime = () => useContext(RealtimeContext);

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [onlineMembers, setOnlineMembers] = useState<Map<string, MemberStatus>>(new Map());
  const ablyRef = useRef<Ably.Realtime | null>(null);

  useEffect(() => {
    const checkLogin = (isInitial = false) => {
      const data = localStorage.getItem('student_data');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.id !== studentId) {
          setStudentId(parsed.id);
          if (!isInitial) {
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
    // Only initialize Ably if we have a studentId (logged in)
    if (!studentId) {
      if (ablyRef.current) {
        ablyRef.current.close();
        ablyRef.current = null;
      }
      return;
    }

    // Initialize Ably once
    if (!ablyRef.current) {
      ablyRef.current = new Ably.Realtime({ 
        authUrl: '/api/ably/auth',
        closeOnUnload: true,
        recover: (lastConnectionDetails, cb) => {
            // Optional recovery logic
            cb(true);
        }
      });
    }

    const ably = ablyRef.current;

    // Connectivity Monitoring
    const handleStateChange = (stateChange: Ably.ConnectionStateChange) => {
      console.log(`[Ably] Connection state: ${stateChange.current}`);
      if (stateChange.current === 'failed' || stateChange.current === 'disconnected') {
        if (stateChange.reason?.code === 40140 || stateChange.reason?.code === 40141) {
             console.warn('[Ably] Token expired, re-authenticating...');
             ably.auth.authorize();
        }
      }
    };

    ably.connection.on(handleStateChange);
    const presenceChannel = ably.channels.get('community');
    const studentChannel = studentId ? ably.channels.get(`student-${studentId}`) : null;

    // Presence Logic
    const updatePresenceData = async () => {
      try {
        const members = await presenceChannel.presence.get();
        const memberMap = new Map<string, MemberStatus>();
        
        members.forEach(m => {
          if (m.clientId && m.clientId !== 'anonymous') {
            memberMap.set(m.clientId, {
              isOnline: true
            });
          }
        });
        
        setOnlineMembers(memberMap);
      } catch (err) {
        console.error('Failed to fetch presence:', err);
      }
    };

    const enterPresence = () => {
      presenceChannel.presence.enter({});
    };

    // Update presence data
    if (ably.connection.state === 'connected') {
      presenceChannel.presence.update({});
    }

    ably.connection.on('connected', enterPresence);
    presenceChannel.presence.subscribe(['enter', 'leave', 'present', 'update'], updatePresenceData);

    const onStudentUpdate = (message: any) => {
      const { type, notification } = message.data;
      if (type === 'SYNC_COMPLETE') {
        queryClient.invalidateQueries({ queryKey: ['student-data'] });
        toast.success('Your data has been updated in the background.', {
          id: 'sync-complete-toast',
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

    const onNewGrade = (message: any) => {
      queryClient.invalidateQueries({ queryKey: ['student-data'] });
      toast.success('New academic record detected!', {
        description: 'A new grade or report has been posted to your portal.',
        action: {
          label: 'View Grades',
          onClick: () => window.location.href = '/grades'
        },
        duration: 8000,
      });
    };

    if (studentChannel) {
      studentChannel.subscribe('update', onStudentUpdate);
      studentChannel.subscribe('new-grade', onNewGrade);
    }

    return () => {
      // Don't attempt cleanup if we've already closed the connection for Logout
      if (!ablyRef.current) return;

      if (studentChannel) {
        studentChannel.unsubscribe('update', onStudentUpdate);
        studentChannel.unsubscribe('new-grade', onNewGrade);
      }
      presenceChannel.presence.unsubscribe(['enter', 'leave', 'present', 'update'], updatePresenceData);
      ably.connection.off(handleStateChange);
      ably.connection.off('connected', enterPresence);
      if (studentId) presenceChannel.presence.leave();
    };
  }, [queryClient, studentId]);

  useEffect(() => {
    return () => {
      if (ablyRef.current) {
        ablyRef.current.close();
        ablyRef.current = null;
      }
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ onlineMembers }}>
      {children}
    </RealtimeContext.Provider>
  );
}