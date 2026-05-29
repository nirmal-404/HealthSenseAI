'use client';

import React, { useState } from 'react';
import { useNotifications, Notification } from '@/hooks/useNotifications';

interface NotificationCenterProps {
  userId: string;
}

/**
 * NotificationCenter Component
 * Displays user's notification history and allows managing notification preferences
 */
export function NotificationCenter({ userId }: NotificationCenterProps) {
  const {
    notifications,
    stats,
    preferences,
    loading,
    error,
    fetchNotifications,
    fetchStats,
    updatePreferences,
    retryFailedNotifications,
  } = useNotifications(userId);

  const [activeTab, setActiveTab] = useState<'recent' | 'preferences' | 'stats'>('recent');
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retryFailedNotifications();
      fetchNotifications();
      alert('Retrying failed notifications...');
    } catch (err) {
      alert('Failed to retry notifications');
    } finally {
      setRetrying(false);
    }
  };

  const handlePreferenceChange = async (key: string, value: boolean) => {
    if (!preferences) return;
    
    try {
      await updatePreferences({
        [key]: value,
      } as any);
      alert('Preference updated successfully');
    } catch (err) {
      alert('Failed to update preference');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'queued':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
      default:
        return '📧';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notification Center</h1>
        <p className="text-gray-600">Manage your notifications and preferences</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('recent')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'recent'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Recent Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'stats'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'preferences'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Preferences
        </button>
      </div>

      {/* Recent Notifications Tab */}
      {activeTab === 'recent' && (
        <div>
          <div className="mb-4 flex justify-between">
            <button
              onClick={() => fetchNotifications()}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
            >
              {retrying ? 'Retrying...' : 'Retry Failed'}
            </button>
          </div>

          {loading && !notifications.length ? (
            <p className="text-center text-gray-500 py-8">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No notifications yet</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif: Notification) => (
                <div
                  key={notif.notificationId}
                  className="p-4 border rounded-lg hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{getCategoryIcon(notif.category)}</span>
                        <h3 className="font-semibold text-lg">
                          {notif.subject || notif.message.substring(0, 50)}
                        </h3>
                      </div>
                      <p className="text-gray-700 mb-2">{notif.message}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          {notif.type === 'email' ? '📧 Email' : '📱 SMS'}
                        </span>
                        <span>
                          {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ml-4 ${getStatusBadgeColor(
                        notif.status
                      )}`}
                    >
                      {notif.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div>
          <button
            onClick={fetchStats}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Statistics
          </button>

          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard title="Total" value={stats.total} color="bg-gray-100" />
              <StatCard title="Sent" value={stats.sent} color="bg-green-100" />
              <StatCard title="Failed" value={stats.failed} color="bg-red-100" />
              <StatCard title="Pending" value={stats.pending} color="bg-yellow-100" />
              <StatCard title="Queued" value={stats.queued} color="bg-blue-100" />
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No statistics available</p>
          )}
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div>
          {preferences ? (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Communication Channels</h3>
                <div className="space-y-3">
                  <PreferenceToggle
                    label="Email Notifications"
                    value={preferences.emailEnabled}
                    onChange={(value) => handlePreferenceChange('emailEnabled', value)}
                  />
                  <PreferenceToggle
                    label="SMS Notifications"
                    value={preferences.smsEnabled}
                    onChange={(value) => handlePreferenceChange('smsEnabled', value)}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Notification Types</h3>
                <div className="space-y-3">
                  <PreferenceToggle
                    label="Appointment Notifications"
                    value={preferences.appointmentNotifications}
                    onChange={(value) =>
                      handlePreferenceChange('appointmentNotifications', value)
                    }
                  />
                  <PreferenceToggle
                    label="Payment Notifications"
                    value={preferences.paymentNotifications}
                    onChange={(value) => handlePreferenceChange('paymentNotifications', value)}
                  />
                  <PreferenceToggle
                    label="Reminder Notifications"
                    value={preferences.reminderNotifications}
                    onChange={(value) => handlePreferenceChange('reminderNotifications', value)}
                  />
                  <PreferenceToggle
                    label="Prescription Notifications"
                    value={preferences.prescriptionNotifications}
                    onChange={(value) =>
                      handlePreferenceChange('prescriptionNotifications', value)
                    }
                  />
                  <PreferenceToggle
                    label="Verification Notifications"
                    value={preferences.verificationNotifications}
                    onChange={(value) =>
                      handlePreferenceChange('verificationNotifications', value)
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Loading preferences...</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * StatCard Component
 */
interface StatCardProps {
  title: string;
  value: number;
  color: string;
}

function StatCard({ title, value, color }: StatCardProps) {
  return (
    <div className={`p-4 rounded-lg ${color}`}>
      <p className="text-gray-600 text-sm font-semibold">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/**
 * PreferenceToggle Component
 */
interface PreferenceToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function PreferenceToggle({ label, value, onChange }: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <label className="font-medium text-gray-700">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-green-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
