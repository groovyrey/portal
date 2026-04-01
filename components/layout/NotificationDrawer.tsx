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
import Modal from '../ui/Modal';
import { useNotificationsQuery } from '@/lib/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Notification } from '@/types';

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
    variant: 'rose' | 'blue';
    icon: React.ReactNode;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: '',
    variant: 'blue',
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
        toast.success('All notifications marked as read');
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
      message: 'Are you sure you want to mark all notifications as read?',
      onConfirm: markAllRead,
      confirmText: 'Mark all read',
      variant: 'blue',
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
        toast.success('Notification deleted');
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
      message: 'Are you sure you want to delete this notification? This action cannot be undone.',
      onConfirm: () => deleteNotification(id),
      confirmText: 'Delete',
      variant: 'rose',
      icon: <Trash2 className="h-5 w-5 text-rose-500" />
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
        toast.success('All notifications cleared');
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
      message: 'This will permanently delete all your notifications. This action cannot be undone.',
      onConfirm: clearAll,
      confirmText: 'Clear all',
      variant: 'rose',
      icon: <Trash2 className="h-5 w-5 text-rose-500" />
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-rose-500" />;
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
      <div className="flex flex-col h-full -mt-2">
        <div className="flex p-1 bg-accent rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === 'unread' 
                ? 'bg-card text-primary shadow-sm border border-border/50' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${
                activeTab === 'unread' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-secondary text-muted-foreground'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === 'all' 
                ? 'bg-card text-primary shadow-sm border border-border/50' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
        </div>

        {filteredNotifications.length > 0 && (
          <div className="flex items-center justify-between mb-6 px-1">
            {activeTab === 'unread' ? (
              <button 
                onClick={confirmMarkAllRead}
                className="text-[10px] font-black text-primary hover:opacity-80 flex items-center gap-1.5 transition-colors uppercase tracking-widest"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            ) : (
              <div />
            )}
            <button 
              onClick={confirmClearAll}
              className="text-[10px] font-black text-rose-600 dark:text-rose-400 hover:opacity-80 flex items-center gap-1.5 transition-colors uppercase tracking-widest"
            >
              <Trash2 className="h-3 w-3" />
              Clear all
            </button>
          </div>
        )}

        <Modal
          isOpen={confirmConfig.isOpen}
          onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
          title={
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                confirmConfig.variant === 'rose' ? 'bg-rose-500/10 dark:bg-rose-500/20' : 'bg-primary/10'
              }`}>
                {confirmConfig.icon}
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{confirmConfig.title}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Are you sure?</p>
              </div>
            </div>
          }
        >
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-6 font-medium">
              {confirmConfig.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 px-4 rounded-xl text-[10px] font-black text-muted-foreground bg-accent hover:bg-accent/80 transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={confirmConfig.onConfirm}
                className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black text-white transition-colors uppercase tracking-widest shadow-lg ${
                  confirmConfig.variant === 'rose' 
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' 
                    : 'bg-primary hover:opacity-90 shadow-primary/20'
                }`}
              >
                {confirmConfig.confirmText}
              </button>
            </div>
          </div>
        </Modal>

        {/* Full Notification View Modal */}
        <Modal
          isOpen={!!selectedNotif}
          onClose={() => setSelectedNotif(null)}
          title={
            selectedNotif && (
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest break-words">
                {selectedNotif.title}
              </h3>
            )
          }
        >
          {selectedNotif && (
            <div className="p-6 pt-0 space-y-6">
              <div className="flex items-center justify-between gap-4 pt-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  selectedNotif.type === 'error' ? 'bg-rose-500/10 dark:bg-rose-500/20 shadow-sm shadow-rose-500/10' : 
                  selectedNotif.type === 'success' ? 'bg-emerald-500/10 dark:bg-emerald-500/20 shadow-sm shadow-emerald-500/10' : 
                  selectedNotif.type === 'warning' ? 'bg-amber-500/10 dark:bg-amber-500/20 shadow-sm shadow-amber-500/10' : 
                  'bg-primary/10 shadow-sm shadow-primary/10'
                }`}>
                  {getIcon(selectedNotif.type)}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] flex items-center justify-end gap-1.5">
                    <Clock className="h-3 w-3" />
                    {getTimeAgo(selectedNotif.createdAt)}
                  </p>
                  <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                    selectedNotif.type === 'error' ? 'text-rose-500' : 
                    selectedNotif.type === 'success' ? 'text-emerald-500' : 
                    selectedNotif.type === 'warning' ? 'text-amber-500' : 
                    'text-primary'
                  }`}>
                    {selectedNotif.type}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedNotif.message}
                </p>
              </div>

              <div className="pt-2">
                {selectedNotif.link ? (
                  <Link 
                    href={selectedNotif.link}
                    onClick={() => {
                      setSelectedNotif(null);
                      onClose();
                    }}
                    className="w-full py-4 px-4 rounded-2xl text-[10px] font-black text-white bg-primary hover:opacity-90 transition-all uppercase tracking-[0.2em] shadow-lg shadow-primary/20 flex items-center justify-center gap-2.5 active:scale-95"
                  >
                    View Details
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => setSelectedNotif(null)}
                    className="w-full py-4 px-4 rounded-2xl text-[10px] font-black text-muted-foreground bg-accent hover:bg-accent/80 transition-all uppercase tracking-[0.2em] active:scale-95"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 rounded-2xl border border-border flex gap-4">
                <Skeleton className="h-10 w-10 shrink-0" variant="rounded" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" variant="text" />
                    <Skeleton className="h-3 w-12" variant="text" />
                  </div>
                  <Skeleton className="h-3 w-full" variant="text" />
                  <Skeleton className="h-3 w-2/3" variant="text" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">
              {activeTab === 'unread' && notifications.length > 0 
                ? 'You&apos;re all caught up!' 
                : 'No notifications yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'unread' && notifications.length > 0
                ? 'Check the "All" tab to see your past notifications.' 
                : 'When you get notifications, they&apos;ll show up here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif: Notification) => (
              <div 
                key={notif.id}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                  notif.isRead 
                    ? 'bg-card border-border hover:border-primary/20' 
                    : 'bg-primary/[0.03] dark:bg-primary/[0.05] border-primary/20 dark:border-primary/20 hover:border-primary/30 ring-1 ring-primary/5'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`mt-0.5 shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    notif.isRead ? 'bg-accent' : 'bg-card shadow-sm border border-primary/10'
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className={`text-sm font-bold break-words ${
                        notif.isRead ? 'text-foreground' : 'text-primary'
                      }`}>
                        {notif.title}
                      </h4>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {getTimeAgo(notif.createdAt)}
                        </span>
                        {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]"></div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(notif.id);
                          }}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-all group-hover:opacity-100 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                          title="Delete notification"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className={`text-xs leading-relaxed break-words line-clamp-2 mb-2 ${
                      notif.isRead ? 'text-muted-foreground' : 'text-muted-foreground'
                    }`}>
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNotif(notif);
                          if (!notif.isRead) markAsRead(notif.id);
                        }}
                        className="text-[10px] font-black text-primary hover:opacity-80 flex items-center gap-1.5 transition-colors uppercase tracking-widest"
                      >
                        Read More
                        <Info className="h-3 w-3" />
                      </button>
                      
                      {notif.link && (
                        <Link 
                          href={notif.link}
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                        >
                          View details
                          <ExternalLink className="h-3 w-3" />
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
