'use client';

import { useState } from 'react';
import { useAppointmentNotifications } from '@/hooks/useAppointmentSubscriptions';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * Appointment Testing Component
 * Helps test the Socket.IO integration by simulating appointment events
 */
export const AppointmentTestPanel = () => {
  const auth = useAuth();
  const { latestNotification, isConnected } = useAppointmentNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const testBookAppointment = async () => {
    if (!auth?.user?.id) {
      toast.error('Not authenticated', {
        description: 'Please log in first to test appointments',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/appointments/book`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            patientId: auth.user.id,
            doctorId: 'doctor-test-123',
            appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            startTime: '10:00',
            endTime: '10:30',
            appointmentType: 'video',
            symptoms: 'Test appointment for Socket.IO integration',
          }),
        }
      );

      if (response.ok) {
        toast.success('Appointment booked!', {
          description: 'Check for real-time notification via Socket.IO...',
        });
      } else {
        toast.error('Failed to book appointment', {
          description: `HTTP ${response.status}`,
        });
      }
    } catch (error: any) {
      toast.error('Error booking appointment', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-lg border border-blue-200 dark:border-indigo-800">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span>🧪 Appointment Testing</span>
            <span
              className={`px-2 py-1 text-xs font-bold rounded ${isConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}
            >
              {isConnected ? 'Socket Connected' : 'Socket Disconnected'}
            </span>
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Test real-time push notifications for appointment events
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 p-3 rounded-md text-sm">
          <p className="font-semibold mb-1">📋 How to test:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Click "Book Test Appointment" button</li>
            <li>Watch for real-time toast notification</li>
            <li>Check the notification bell in the header</li>
            <li>Verify email/SMS also sent</li>
          </ol>
        </div>

        {/* Book Appointment Button */}
        <button
          onClick={testBookAppointment}
          disabled={isLoading || !auth?.user?.id}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Booking...
            </>
          ) : (
            <>
              <span>📅</span>
              Book Test Appointment
            </>
          )}
        </button>

        {/* Latest Notification */}
        {latestNotification && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-green-500">
            <div className="text-sm">
              <p className="font-semibold text-gray-900 dark:text-white">
                Last Notification Received:
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                <span className="font-mono text-xs">
                  Type: {latestNotification.type}
                </span>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-mono text-xs">
                  Title: {latestNotification.title}
                </span>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-mono text-xs">
                  Message: {latestNotification.message}
                </span>
              </p>
              <p className="text-gray-500 dark:text-gray-500 mt-2 text-xs">
                {new Date(latestNotification.data?.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Status Information */}
        <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold">Authenticated:</span>
            <span className={auth?.user?.id ? 'text-green-600' : 'text-red-600'}>
              {auth?.user?.id ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">User ID:</span>
            <span className="font-mono text-xs">{auth?.user?.id || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Notification Service:</span>
            <span className="font-mono text-xs break-all">
              {process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'Not set'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
