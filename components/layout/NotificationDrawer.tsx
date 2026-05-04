'use client';

import React from 'react';
import Drawer from './Drawer';
import { 
  CheckCheck, 
  Trash2, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Clock,
  ExternalLink,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Skeleton from '../ui/Skeleton';
import { useNotificationsQuery } from '@/lib/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Notification } from '@/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useNotificationsQuery(isOpen);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    variant: 'destructive' | 'default';
    icon: React.ReactNode;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: '',
    variant: 'default',
    icon: null
  });

  const filteredNotifications = notifications.filter((n: Notification) => 
    activeTab === 'all' ? true : !n.isRead
  );

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/student/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'markRead' }),
      });
      if (res.ok) {
        queryClient.setQueryData(['notifications'], (prev: Notification[] | undefined) => 
          prev?.map((n: Notification) => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/student/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      if (res.ok) {
        queryClient.setQueryData(['notifications'], (prev: Notification[] | undefined) => 
          prev?.map((n: Notification) => ({ ...n, isRead: true }))
        );
        toast.success('Updated');
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const confirmMarkAllRead = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Mark all as read',
      message: 'Mark all notifications as read?',
      onConfirm: markAllRead,
      confirmText: 'Mark all read',
      variant: 'default',
      icon: <CheckCheck className="h-5 w-5 text-primary" />
    });
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch('/api/student/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'delete' }),
      });
      if (res.ok) {
        queryClient.setQueryData(['notifications'], (prev: Notification[] | undefined) => 
          prev?.filter((n: Notification) => n.id !== id)
        );
        toast.success('Deleted');
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const confirmDelete = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete notification',
      message: 'Delete this notification? This cannot be undone.',
      onConfirm: () => deleteNotification(id),
      confirmText: 'Delete',
      variant: 'destructive',
      icon: <Trash2 className="h-5 w-5 text-destructive" />
    });
  };

  const clearAll = async () => {
    try {
      const res = await fetch('/api/student/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearAll' }),
      });
      if (res.ok) {
        queryClient.setQueryData(['notifications'], []);
        toast.success('Cleared');
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const confirmClearAll = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Clear all',
      message: 'This will delete all notifications. This cannot be undone.',
      onConfirm: clearAll,
      confirmText: 'Clear all',
      variant: 'destructive',
      icon: <Trash2 className="h-5 w-5 text-destructive" />
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Notifications"
    >
      <div className="flex flex-col h-full">
        <Tabs defaultValue="unread" className="w-full mb-6" onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <Badge variant="default" className="ml-2 h-4 px-1 text-[10px] min-w-[16px] flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredNotifications.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-1">
            {activeTab === 'unread' ? (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={confirmMarkAllRead}
                className="text-xs h-8 text-primary hover:text-primary hover:bg-primary/5 px-2"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-2 shrink-0" />
                <span className="truncate">Mark all read</span>
              </Button>
            ) : (
              <div />
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={confirmClearAll}
              className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/5 px-2"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2 shrink-0" />
              <span className="truncate">Clear all</span>
            </Button>
          </div>
        )}

        <Dialog 
          open={confirmConfig.isOpen} 
          onOpenChange={(open) => !open && setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-full ${confirmConfig.variant === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                  {confirmConfig.icon}
                </div>
                <DialogTitle>{confirmConfig.title}</DialogTitle>
              </div>
              <DialogDescription>
                {confirmConfig.message}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}>
                Cancel
              </Button>
              <Button variant={confirmConfig.variant} onClick={confirmConfig.onConfirm}>
                {confirmConfig.confirmText}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Full Notification View Dialog */}
        <Dialog 
          open={!!selectedNotif} 
          onOpenChange={(open) => !open && setSelectedNotif(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            {selectedNotif && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`p-3 rounded-full ${
                      selectedNotif.type === 'error' ? 'bg-destructive/10' : 
                      selectedNotif.type === 'success' ? 'bg-emerald-500/10' : 
                      selectedNotif.type === 'warning' ? 'bg-amber-500/10' : 
                      'bg-primary/10'
                    }`}>
                      {getIcon(selectedNotif.type)}
                    </div>
                    <div>
                      <DialogTitle className="text-left">{selectedNotif.title}</DialogTitle>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(selectedNotif.createdAt)}
                      </p>
                    </div>
                  </div>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm leading-relaxed text-foreground">
                    {selectedNotif.message}
                  </p>
                </div>
                <DialogFooter className="flex flex-col gap-2">
                  {selectedNotif.link ? (
                    <Button asChild className="w-full">
                      <Link 
                        href={selectedNotif.link}
                        onClick={() => {
                          setSelectedNotif(null);
                          onClose();
                        }}
                      >
                        View Details
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setSelectedNotif(null)} className="w-full">
                      Close
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border flex gap-4">
                <Skeleton className="h-10 w-10 shrink-0" variant="rounded" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" variant="text" />
                    <Skeleton className="h-3 w-12" variant="text" />
                  </div>
                  <Skeleton className="h-3 w-full" variant="text" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {activeTab === 'unread' && notifications.length > 0 
                ? 'All caught up!' 
                : 'No notifications'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {activeTab === 'unread' && notifications.length > 0
                ? 'Check the "All" tab.' 
                : 'When you get notifications, they\'ll show up here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif: Notification) => (
              <div 
                key={notif.id}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
                className={`group relative p-3 sm:p-4 rounded-lg border transition-all cursor-pointer ${
                  notif.isRead 
                    ? 'bg-card border-border hover:bg-accent/50' 
                    : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                }`}
              >
                <div className="flex gap-3 sm:gap-4">
                  <div className={`mt-0.5 shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center ${
                    notif.isRead ? 'bg-muted' : 'bg-background border border-primary/10'
                  }`}>
                    {/* Scale down icon slightly for mobile */}
                    {React.cloneElement(getIcon(notif.type) as React.ReactElement<any>, { className: "h-4 w-4 sm:h-5 sm:w-5" })}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3 mb-1">
                      <h4 className={`text-sm font-semibold break-words leading-tight ${
                        notif.isRead ? 'text-foreground' : 'text-primary'
                      }`}>
                        {notif.title}
                      </h4>
                      <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {getTimeAgo(notif.createdAt)}
                        </span>
                        {!notif.isRead && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(notif.id);
                          }}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed break-words line-clamp-2 mb-2">
                      {notif.message}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNotif(notif);
                          if (!notif.isRead) markAsRead(notif.id);
                        }}
                        className="p-0 h-auto text-xs text-primary font-semibold"
                      >
                        Read More
                      </Button>
                      
                      {notif.link && (
                        <Link 
                          href={notif.link}
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                        >
                          <span className="truncate max-w-[120px] sm:max-w-none">View Details</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
