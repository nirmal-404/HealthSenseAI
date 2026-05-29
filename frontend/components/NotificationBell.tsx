'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotificationBellProps {
  userId?: string;
}

/**
 * NotificationBell Component
 * Displays a bell icon with notification dropdown
 * Auto-refreshes notifications every 30 seconds
 */
export function NotificationBell({ userId }: NotificationBellProps) {
  const { notifications, loading, fetchNotifications } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (userId && open) {
      void fetchNotifications(5);
      
      // Set up auto-refresh while dropdown is open
      const interval = setInterval(() => {
        void fetchNotifications(5);
      }, 15000); // Refresh every 15 seconds while open
      
      setAutoRefreshInterval(interval);
    }

    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        setAutoRefreshInterval(null);
      }
    };
  }, [userId, open, fetchNotifications]);

  // Count unread notifications (status: pending, queued)
  const unreadCount = notifications.filter(
    (n) => n.status === 'pending' || n.status === 'queued'
  ).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'appointment':
        return '📅';
      case 'payment':
        return '💳';
      case 'reminder':
        return '🔔';
      case 'prescription':
        return '💊';
      case 'verification':
        return '✓';
      case 'message':
        return '💬';
      default:
        return '📧';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      case 'queued':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dce5f2] bg-white text-slate-500 transition hover:border-[#bcc9e8] hover:text-slate-700"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 rounded-xl border border-[#dce5f2] bg-white p-0 shadow-lg">
        {/* Header */}
        <div className="border-b border-[#e6edf8] px-4 py-3">
          <h3 className="text-sm font-semibold text-[#1f2a44]">Notifications</h3>
          <p className="text-xs text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-0">
              {notifications.slice(0, 5).map((notification: Notification) => (
                <div
                  key={notification.notificationId}
                  className="border-b border-[#f0f3f9] px-4 py-3 transition hover:bg-[#f8fbff]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg">
                      {getCategoryIcon(notification.category)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="truncate text-sm font-medium text-[#1f2a44]">
                        {notification.subject || 'Notification'}
                      </h4>
                      <p className="line-clamp-2 text-xs text-slate-600 mt-0.5">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={`text-xs font-medium capitalize ${getStatusColor(
                            notification.status
                          )}`}
                        >
                          {notification.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <Link
            href="/patient/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between border-t border-[#e6edf8] px-4 py-3 text-sm font-medium text-[#3460e9] transition hover:bg-[#f8fbff]"
          >
            View all notifications
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
