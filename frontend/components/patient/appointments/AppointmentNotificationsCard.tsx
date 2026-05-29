'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import axiosInstance from '@/lib/axios';

interface Notification {
  _id: string;
  notificationId: string;
  userId: string;
  type: 'email' | 'sms' | 'push';
  category: string;
  message: string;
  subject?: string;
  recipient: string;
  status: 'sent' | 'failed' | 'pending' | 'queued';
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

type AppointmentNotificationsCardProps = {
  appointmentId: string;
  appointmentDate?: string;
};

export function AppointmentNotificationsCard({
  appointmentId,
  appointmentDate,
}: AppointmentNotificationsCardProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch notifications for this specific appointment
      const response = await axiosInstance.get(`/notifications/appointment/${appointmentId}?limit=50`);

      if (response.data?.success && response.data?.data?.notifications) {
        setNotifications(response.data.data.notifications);
      }
    } catch (err: any) {
      console.error('Error fetching appointment notifications:', err);
      setError(err?.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      sent: 'Sent',
      failed: 'Failed',
      pending: 'Pending',
      queued: 'Queued',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      sent: 'bg-green-50 border-green-200',
      failed: 'bg-red-50 border-red-200',
      pending: 'bg-yellow-50 border-yellow-200',
      queued: 'bg-blue-50 border-blue-200',
    };
    return colors[status] || 'bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-blue-600" />
            Appointment Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-sm text-red-600">⚠️ {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="border-slate-200 bg-slate-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-slate-400" />
            Appointment Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            📭 No notifications for this appointment yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-blue-600" />
            Appointment Notifications ({notifications.length})
          </CardTitle>
        </div>
        <CardDescription>Recent notifications for this appointment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`rounded-lg border p-3 ${getStatusColor(notification.status)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getStatusIcon(notification.status)}</div>
              <div className="flex-1 min-w-0">
                {notification.subject && (
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {notification.subject}
                  </p>
                )}
                <p className="text-sm text-slate-700 line-clamp-2 mt-1">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-600">
                  <span>📧 {notification.type}</span>
                  <span className="font-medium">{getStatusLabel(notification.status)}</span>
                </div>
                {notification.sentAt && (
                  <p className="text-xs text-slate-500 mt-1">
                    Sent: {new Date(notification.sentAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
