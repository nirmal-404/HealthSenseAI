'use client';

import { useEffect, useState, useRef } from 'react';
import { useSocketIO } from './providers/SocketIOProvider';
import { Bell, Check, AlertCircle, Info, X } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  icon: 'success' | 'error' | 'info' | 'warning';
  timestamp: Date;
  appointmentId?: string;
}

export const RealtimeNotificationBell = () => {
  // Helper function to determine icon type
  const getIconType = (type: string): 'success' | 'error' | 'info' | 'warning' => {
    if (type?.includes('booked') || type?.includes('confirmed')) return 'success';
    if (type?.includes('rejected')) return 'error';
    if (type?.includes('completed')) return 'success';
    return 'info';
  };

  // Helper function to get icon component
  const getIcon = (iconType: 'success' | 'error' | 'info' | 'warning') => {
    switch (iconType) {
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Helper function to get border color
  const getBorderColor = (icon: 'success' | 'error' | 'info' | 'warning') => {
    switch (icon) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
      default:
        return 'border-l-blue-500';
    }
  };

  const socketIO = useSocketIO();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toastNotifications, setToastNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  // Use a ref to a Set for tracking recently processed notifications
  const processedNotificationsRef = useRef<Set<string>>(new Set());
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    
    console.log('🔔 RealtimeNotificationBell mounted');
    
    const unsubscribe = socketIO.subscribe('notification', (notification: any) => {
      console.log('📲 [NOTIFICATION RECEIVED] Raw:', notification.appointmentId, notification.type);
      
      // Create a unique key for this notification
      const notificationKey = `${notification.appointmentId}-${notification.type}-${notification.title}`;
      
      // Check if this exact notification was already processed recently
      if (processedNotificationsRef.current.has(notificationKey)) {
        console.warn('⚠️  [DUPLICATE BLOCKED] Key:', notificationKey);
        return;
      }
      
      // Mark this notification as processed
      processedNotificationsRef.current.add(notificationKey);
      console.log('✅ [ACCEPTED] Key:', notificationKey, '| Set size:', processedNotificationsRef.current.size);
      
      // Schedule cleanup of this key after 2 seconds
      setTimeout(() => {
        processedNotificationsRef.current.delete(notificationKey);
        console.log('🧹 [CLEANUP] Removed key from dedup set');
      }, 2000);
      
      const newNotification: NotificationItem = {
        id: `${Date.now()}-${Math.random()}`,
        type: notification.type || 'info',
        title: notification.title || 'Notification',
        message: notification.message || 'New notification',
        icon: getIconType(notification.type),
        timestamp: new Date(),
        appointmentId: notification.appointmentId,
      };

      console.log('📝 [CREATING] Notification object, appointmentId:', newNotification.appointmentId);
      
      setNotifications((prev) => {
        console.log('📊 [STATE] Current notifications:', prev.length, 'Adding new one');
        return [newNotification, ...prev];
      });
      
      // Also add to toast for temporary display (5 seconds)
      setToastNotifications((prev) => [newNotification, ...prev]);
      setTimeout(() => {
        setToastNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
      }, 5000);
    });

    return () => {
      console.log('🧹 Unmounting notification bell');
      unsubscribe();
    };
  }, [socketIO]);

  // Function to delete a notification
  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Function to clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Bell Icon in Header */}
      <div className="fixed right-4 top-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <div>
                <h3 className="font-semibold text-lg">Notifications</h3>
                {notifications.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {notifications.length} message{notifications.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-l-4 group ${getBorderColor(notification.icon)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {getIcon(notification.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 break-all">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          title="Delete notification"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Clear All button */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <button
                  onClick={clearAllNotifications}
                  className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <div className="fixed right-4 top-20 space-y-2 z-40 pointer-events-none">
        {toastNotifications.slice(0, 2).map((notification) => (
          <div
            key={notification.id}
            className={`animate-in slide-in-from-top-2 duration-300 bg-white dark:bg-gray-800 rounded-lg border-l-4 p-4 shadow-lg pointer-events-auto ${getBorderColor(notification.icon)}`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                {getIcon(notification.icon)}
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {notification.title}
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

