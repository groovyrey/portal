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

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useNotificationsQuery(isOpen);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');

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
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
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
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;
    try {
      const res = await fetch('/api/student/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearAll' }),
      });
      if (res.ok) {
        queryClient.setQueryData(['notifications'], []);
        toast.success('All notifications cleared');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-rose-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
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
        <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === 'unread' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${
                activeTab === 'unread' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === 'all' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All
          </button>
        </div>

        {filteredNotifications.length > 0 && (
          <div className="flex items-center justify-between mb-6 px-1">
            {activeTab === 'unread' ? (
              <button 
                onClick={markAllRead}
                className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors uppercase tracking-widest"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            ) : (
              <div />
            )}
            <button 
              onClick={clearAll}
              className="text-[10px] font-black text-rose-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors uppercase tracking-widest"
            >
              <Trash2 className="h-3 w-3" />
              Clear all
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-100 flex gap-4">
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
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {activeTab === 'unread' ? 'You&apos;re all caught up!' : 'No notifications yet'}
            </h3>
            <p className="text-sm text-slate-500">
              {activeTab === 'unread' 
                ? 'Check the "All" tab to see your past notifications.' 
                : 'When you get notifications, they&apos;ll show up here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif: any) => (
              <div 
                key={notif.id}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                  notif.isRead 
                    ? 'bg-white border-slate-100 hover:border-slate-200' 
                    : 'bg-blue-50/50 border-blue-100 hover:border-blue-200 ring-1 ring-blue-100/50'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`mt-0.5 shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    notif.isRead ? 'bg-slate-100' : 'bg-white shadow-sm'
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className={`text-sm font-bold truncate ${
                        notif.isRead ? 'text-slate-700' : 'text-slate-900'
                      }`}>
                        {notif.title}
                      </h4>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {getTimeAgo(notif.createdAt)}
                        </span>
                        {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all group-hover:opacity-100 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                          title="Delete notification"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className={`text-xs leading-relaxed line-clamp-2 ${
                      notif.isRead ? 'text-slate-500' : 'text-slate-600'
                    }`}>
                      {notif.message}
                    </p>
                    
                    {notif.link && (
                      <Link 
                        href={notif.link}
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        View details
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
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
