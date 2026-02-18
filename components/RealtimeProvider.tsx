'use client';

import { useEffect, createContext, useContext, useState } from 'react';
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

  useEffect(() => {
    // Ably Realtime Setup
    const ably = new Ably.Realtime({ authUrl: '/api/ably/auth' });
    const channel = ably.channels.get('community');

    channel.subscribe('update', (message) => {
      const { type, postId, userName } = message.data;
      
      // Invalidate the main feed cache globally
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });

      // If the interaction is for the currently selected post (in any drawer/modal), invalidate its comments too
      if (postId && activePostId === postId.toString()) {
        queryClient.invalidateQueries({ queryKey: ['comments', activePostId] });
      }

      // If it's a new post and we're NOT on the community page, show a toast
      if (type === 'POST_CREATED' && pathname !== '/community') {
        toast.info(`New post by ${userName || 'a student'}`, {
          description: 'A new post has been shared in the community.',
          action: {
            label: 'View',
            onClick: () => window.location.href = '/community'
          },
          duration: 5000,
        });
      }
    });

    return () => {
      channel.unsubscribe();
      ably.close();
    };
  }, [queryClient, pathname, activePostId]);

  return (
    <RealtimeContext.Provider value={{ activePostId, setActivePostId }}>
      {children}
    </RealtimeContext.Provider>
  );
}
