'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

/**
 * Admin Notifications Page
 * Full page view of all admin-related notifications with filtering and management options
 */
export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const { notifications, loading, fetchNotifications } = useNotifications(user?.id);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      void fetchNotifications(100);
    }
  }, [user?.id, fetchNotifications]);

  const filteredNotifications = notifications.filter((notif) => {
    if (filterStatus && notif.status !== filterStatus) return false;
    if (filterCategory && notif.category !== filterCategory) return false;
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system':
        return { icon: '⚙️', label: 'System' };
      case 'security':
        return { icon: '🔒', label: 'Security' };
      case 'alert':
        return { icon: '🚨', label: 'Alert' };
      case 'report':
        return { icon: '📊', label: 'Report' };
      case 'user':
        return { icon: '👤', label: 'User' };
      case 'doctor':
        return { icon: '👨‍⚕️', label: 'Doctor' };
      case 'patient':
        return { icon: '👥', label: 'Patient' };
      case 'audit':
        return { icon: '📋', label: 'Audit' };
      default:
        return { icon: '📧', label: 'Notification' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'sent':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          label: 'Sent',
        };
      case 'failed':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          label: 'Failed',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          label: 'Pending',
        };
      case 'queued':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          label: 'Queued',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          label: 'Unknown',
        };
    }
  };

  const unreadCount = notifications.filter(
    (n) => n.status === 'pending' || n.status === 'queued'
  ).length;

  const stats = {
    total: notifications.length,
    sent: notifications.filter((n) => n.status === 'sent').length,
    failed: notifications.filter((n) => n.status === 'failed').length,
    pending: notifications.filter((n) => n.status === 'pending' || n.status === 'queued').length,
  };

  const uniqueCategories = Array.from(new Set(notifications.map((n) => n.category)));

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-[#1f2a44]">Notifications</h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage and view all system, security, and administrative notifications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#e2eaf6] bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Total</p>
          <p className="text-2xl font-bold text-[#1f2a44] mt-1">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-[#e2eaf6] bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Sent</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.sent}</p>
        </div>
        <div className="rounded-xl border border-[#e2eaf6] bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Unread</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-[#e2eaf6] bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Failed</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="rounded-xl border border-[#e2eaf6] bg-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1f2a44]">Filters</h2>
          <button
            onClick={() => {
              void fetchNotifications(100);
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[#dce5f2] px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#f8fbff] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Status Filter */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            {['all', 'sent', 'pending', 'failed', 'queued'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status === 'all' ? null : status)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  (status === 'all' && filterStatus === null) || filterStatus === status
                    ? 'bg-[#7c3aed] text-white'
                    : 'bg-[#f0f3f9] text-slate-700 hover:bg-[#e5eaf7]'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Category</p>
          <div className="flex flex-wrap gap-2">
            {['all', ...uniqueCategories].map((category) => {
              const categoryConfig = getCategoryIcon(category);
              return (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category === 'all' ? null : category)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    (category === 'all' && filterCategory === null) || filterCategory === category
                      ? 'bg-[#7c3aed] text-white'
                      : 'bg-[#f0f3f9] text-slate-700 hover:bg-[#e5eaf7]'
                  }`}
                >
                  <span>{categoryConfig.icon}</span>
                  {categoryConfig.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-xl border border-[#e2eaf6] bg-white overflow-hidden">
        {loading && filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
              <p className="mt-2 text-slate-600">Loading notifications...</p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-slate-600">
                {notifications.length === 0
                  ? 'No notifications yet'
                  : 'No notifications match your filters'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#f0f3f9]">
            {filteredNotifications.map((notification: Notification) => {
              const categoryConfig = getCategoryIcon(notification.category);
              const statusConfig = getStatusConfig(notification.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={notification.notificationId}
                  className="p-4 transition hover:bg-[#f8fbff]"
                >
                  <div className="flex items-start gap-4">
                    {/* Category Icon */}
                    <div className="mt-1 text-2xl">{categoryConfig.icon}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-[#1f2a44]">
                            {notification.subject || 'Notification'}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                        </div>
                        <div className={`shrink-0 rounded-full p-2 ${statusConfig.bgColor}`}>
                          <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-medium capitalize transition ${statusConfig.bgColor} ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {notification.type === 'email' ? '📧' : '📱'} {notification.type}
                        </span>
                        <span>
                          {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                          {new Date(notification.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
