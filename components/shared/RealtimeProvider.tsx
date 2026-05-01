'use client';

import { useEffect, createContext, useContext, useState, useRef } from 'react';
import Ably from 'ably';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';

interface MemberStatus {
  isOnline: boolean;
  isStudying?: boolean;
}

const RealtimeContext = createContext<{ 
  activePostId: string | null; 
  setActivePostId: (id: string | null) => void;
  onlineMembers: Map<string, MemberStatus>;
}>({
  activePostId: null,
  setActivePostId: () => {},
  onlineMembers: new Map(),
});

export const useRealtime = () => useContext(RealtimeContext);

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [activePostId, setActivePostId] = useState<string | null>(null);
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
        closeOnUnload: true
      });
    }

    const ably = ablyRef.current;
    const communityChannel = ably.channels.get('community');
    const studentChannel = studentId ? ably.channels.get(`student-${studentId}`) : null;

    // Presence Logic
    
    const updatePresenceData = async () => {
      try {
        const members = await communityChannel.presence.get();
        const memberMap = new Map<string, MemberStatus>();
        
        members.forEach(m => {
          if (m.clientId && m.clientId !== 'anonymous') {
            memberMap.set(m.clientId, {
              isOnline: true,
              isStudying: !!m.data?.isStudying
            });
          }
        });
        
        setOnlineMembers(memberMap);
      } catch (err) {
        console.error('Failed to fetch presence:', err);
      }
    };

    const enterPresence = () => {
      const isStudying = pathname === '/study-mode';
      communityChannel.presence.enter({ isStudying });
    };

    // Update presence data
    if (ably.connection.state === 'connected') {
      const isStudying = pathname === '/study-mode';
      communityChannel.presence.update({ isStudying });
    }

    ably.connection.on('connected', enterPresence);
    communityChannel.presence.subscribe(['enter', 'leave', 'present', 'update'], updatePresenceData);

    const onUpdate = (message: any) => {
      const { type, postId, userName, userId, isLiked, optionId } = message.data;
      
      if (type === 'LIKE_UPDATE') {
        const updater = (old: any) => {
           if (!old || !Array.isArray(old)) return old;
           return old.map((post: any) => {
             if (post.id === postId.toString()) {
               const currentLikes = post.likes || [];
               const newLikes = isLiked 
                 ? [...new Set([...currentLikes, userId])]
                 : currentLikes.filter((id: string) => id !== userId);
               return { ...post, likes: newLikes };
             }
             return post;
           });
        };

        queryClient.setQueriesData({ queryKey: ['community-posts'] }, updater);
        queryClient.setQueriesData({ queryKey: ['user-posts'] }, updater);
        
        queryClient.setQueryData(['post', postId.toString()], (old: any) => {
            if (!old) return undefined;
             const currentLikes = old.likes || [];
             const newLikes = isLiked 
               ? [...new Set([...currentLikes, userId])]
               : currentLikes.filter((id: string) => id !== userId);
             return { ...old, likes: newLikes };
        });
        return;
      }

      if (type === 'VOTE_UPDATE') {
           const updater = (old: any) => {
             if (!old || !Array.isArray(old)) return old;
             return old.map((post: any) => {
               if (post.id === postId.toString() && post.poll) {
                 const newOptions = post.poll.options.map((opt: any) => {
                    if (opt.id === optionId) {
                        return { ...opt, votes: [...new Set([...(opt.votes || []), userId])] };
                    }
                    return opt;
                 });
                 return { ...post, poll: { ...post.poll, options: newOptions } };
               }
               return post;
             });
           };

           queryClient.setQueriesData({ queryKey: ['community-posts'] }, updater);
           queryClient.setQueriesData({ queryKey: ['user-posts'] }, updater);
           
            queryClient.setQueryData(['post', postId.toString()], (old: any) => {
                if (!old || !old.poll) return undefined;
                 const newOptions = old.poll.options.map((opt: any) => {
                    if (opt.id === optionId) {
                        return { ...opt, votes: [...new Set([...(opt.votes || []), userId])] };
                    }
                    return opt;
                 });
                 return { ...old, poll: { ...old.poll, options: newOptions } };
            });
           return;
      }

      // Default behavior for other events
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

    const onProxyStatus = (message: any) => {
      const { type, message: statusMessage } = message.data;
      if (type === 'SESSION_SYNCED') {
          // Use a specific ID to avoid spamming
          toast.success('Session Synced', {
              id: 'proxy-sync-success',
              description: statusMessage,
              duration: 3000,
          });
      } else if (type === 'REFRESH_COMPLETE') {
          toast.info('Cloud Refresh', {
              id: 'proxy-refresh-success',
              description: statusMessage,
              duration: 3000,
          });
      } else if (type === 'SESSION_EXPIRED') {
          toast.error('Session Expired', {
              id: 'proxy-session-expired',
              description: statusMessage,
              duration: 10000,
          });
      }
    };

    communityChannel.subscribe('update', onUpdate);
    if (studentChannel) {
      studentChannel.subscribe('update', onStudentUpdate);
      studentChannel.subscribe('new-grade', onNewGrade);
      studentChannel.subscribe('proxy-status', onProxyStatus);
    }

    return () => {
      // Don't attempt cleanup if we've already closed the connection for Logout
      if (!ablyRef.current) return;

      communityChannel.unsubscribe('update', onUpdate);
      if (studentChannel) {
        studentChannel.unsubscribe('update', onStudentUpdate);
        studentChannel.unsubscribe('new-grade', onNewGrade);
        studentChannel.unsubscribe('proxy-status', onProxyStatus);
      }
      communityChannel.presence.unsubscribe(['enter', 'leave', 'present', 'update'], updatePresenceData);
      ably.connection.off('connected', enterPresence);
      if (studentId) communityChannel.presence.leave();
    };
  }, [queryClient, studentId, activePostId, pathname]);

  useEffect(() => {
    return () => {
      if (ablyRef.current) {
        ablyRef.current.close();
        ablyRef.current = null;
      }
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ activePostId, setActivePostId, onlineMembers }}>
      {children}
    </RealtimeContext.Provider>
  );
}
