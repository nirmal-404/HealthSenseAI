import { useCallback, useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';

export interface Notification {
  _id: string;
  notificationId: string;
  userId: string;
  type: 'email' | 'sms' | 'push';
  category: string;
  message: string;
  subject?: string;
  recipient: string;
  status: 'sent' | 'failed' | 'pending' | 'queued';
  retryCount: number;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  queued: number;
}

export interface UserPreferences {
  _id?: string;
  preferenceId?: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  appointmentNotifications: boolean;
  paymentNotifications: boolean;
  reminderNotifications: boolean;
  prescriptionNotifications: boolean;
  verificationNotifications: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Hook to manage notifications
 * Provides methods to fetch, send, and manage user notifications
 */
export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user's notifications
   */
  const fetchNotifications = useCallback(async (limit = 50, offset = 0) => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(
        `/notifications/user/${userId}?limit=${limit}&offset=${offset}`
      );
      
      if (response.data.success) {
        setNotifications(response.data.data?.notifications || []);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch notifications';
      setError(errorMsg);
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Get notification by ID
   */
  const getNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await axiosInstance.get(
        `/notifications/${notificationId}`
      );
      
      if (response.data.success) {
        return response.data.data?.notification;
      }
    } catch (err) {
      console.error('Failed to fetch notification:', err);
    }
  }, []);

  /**
   * Send notification immediately
   */
  const sendNotification = useCallback(async (payload: {
    userId: string;
    type: 'email' | 'sms' | 'push';
    recipient: string;
    subject?: string;
    message: string;
    category: string;
    templateName?: string;
    templateVariables?: Record<string, any>;
  }) => {
    try {
      setError(null);
      const response = await axiosInstance.post(`/notifications/send`, payload);
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to send notification';
      setError(errorMsg);
      console.error('Failed to send notification:', err);
      throw err;
    }
  }, []);

  /**
   * Send bulk notifications
   */
  const sendBulkNotifications = useCallback(async (payload: {
    userIds: string[];
    type: 'email' | 'sms' | 'push';
    category: string;
    subject?: string;
    message: string;
  }) => {
    try {
      setError(null);
      const response = await axiosInstance.post(
        `/notifications/send-bulk`,
        payload
      );
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to send bulk notifications';
      setError(errorMsg);
      console.error('Failed to send bulk notifications:', err);
      throw err;
    }
  }, []);

  /**
   * Fetch notification statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const response = await axiosInstance.get(`/notifications/stats`);
      
      if (response.data.success) {
        setStats(response.data.data?.stats || null);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch stats';
      setError(errorMsg);
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  /**
   * Update user notification preferences
   */
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    try {
      setError(null);
      const response = await axiosInstance.put(
        `/notifications/preferences/${userId}`,
        updates
      );
      
      if (response.data.success) {
        setPreferences(response.data.data?.preference || null);
        return response.data.data?.preference;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update preferences';
      setError(errorMsg);
      console.error('Failed to update preferences:', err);
      throw err;
    }
  }, [userId]);

  /**
   * Fetch user notification preferences
   */
  const fetchPreferences = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    try {
      setError(null);
      const response = await axiosInstance.get(
        `/notifications/preferences/${userId}`
      );
      
      if (response.data.success) {
        setPreferences(response.data.data?.preference || null);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch preferences';
      setError(errorMsg);
      console.error('Failed to fetch preferences:', err);
    }
  }, [userId]);

  /**
   * Retry failed notifications
   */
  const retryFailedNotifications = useCallback(async () => {
    try {
      setError(null);
      const response = await axiosInstance.post(`/notifications/retry-failed`, {});
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to retry notifications';
      setError(errorMsg);
      console.error('Failed to retry notifications:', err);
      throw err;
    }
  }, []);

  /**
   * Auto-refresh notifications on component mount
   */
  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchPreferences]);

  return {
    // State
    notifications,
    stats,
    preferences,
    loading,
    error,

    // Methods
    fetchNotifications,
    getNotification,
    sendNotification,
    sendBulkNotifications,
    fetchStats,
    updatePreferences,
    fetchPreferences,
    retryFailedNotifications,
  };
};
