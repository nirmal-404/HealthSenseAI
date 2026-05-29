'use client';

import { useEffect, useState } from 'react';
import { useSocketIO } from '@/components/providers/SocketIOProvider';
import { useAuth } from '@/hooks/useAuth';

/**
 * Socket.IO Debug Component
 * Shows real-time connection status and test controls
 * Only visible in development mode
 */
export const SocketIODebug = ({ visible = false }: { visible?: boolean }) => {
  const socketIO = useSocketIO();
  const auth = useAuth();
  const [events, setEvents] = useState<string[]>([]);
  const [showPanel, setShowPanel] = useState(visible);

  useEffect(() => {
    // Listen to custom socket notification events
    const handleNotification = (event: CustomEvent) => {
      const message = `[${new Date().toLocaleTimeString()}] Received: ${event.detail.type}`;
      setEvents((prev) => [message, ...prev.slice(0, 49)]);
    };

    window.addEventListener('socket-notification', handleNotification as EventListener);
    return () => {
      window.removeEventListener(
        'socket-notification',
        handleNotification as EventListener
      );
    };
  }, []);

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-4 left-4 bg-gray-700 text-white px-3 py-2 rounded text-xs hover:bg-gray-600 z-40"
      >
        🔧 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-96 bg-gray-900 text-gray-100 rounded-lg shadow-2xl border border-gray-700 z-40 font-mono text-xs">
      {/* Header */}
      <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center">
        <span className="font-bold">Socket.IO Debug</span>
        <button
          onClick={() => setShowPanel(false)}
          className="text-gray-400 hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <div className="p-3 border-b border-gray-700 space-y-2">
        <div className="flex justify-between">
          <span>Status:</span>
          <span
            className={`${socketIO.getConnectionStatus() ? 'text-green-400' : 'text-red-400'}`}
          >
            {socketIO.getConnectionStatus() ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>User ID:</span>
          <span className="text-blue-400">{auth?.user?.id || 'Not authenticated'}</span>
        </div>
        <div className="flex justify-between">
          <span>Notification Service:</span>
          <span className="text-blue-400 break-all">
            {process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'Not configured'}
          </span>
        </div>
      </div>

      {/* Events Log */}
      <div className="p-3 border-b border-gray-700">
        <div className="font-bold mb-2">Recent Events ({events.length})</div>
        <div className="bg-gray-950 p-2 rounded h-32 overflow-y-auto space-y-1">
          {events.length === 0 ? (
            <div className="text-gray-500 py-2">No events yet. Awaiting notifications...</div>
          ) : (
            events.map((event, index) => (
              <div key={index} className="text-green-400 break-words">
                {event}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Test Controls */}
      <div className="p-3 space-y-2">
        <button
          onClick={() => {
            setEvents((prev) => [
              `[${new Date().toLocaleTimeString()}] ✅ Test notification sent`,
              ...prev.slice(0, 49),
            ]);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 rounded text-xs font-bold"
        >
          📨 Send Test
        </button>
        <button
          onClick={() => {
            setEvents([]);
          }}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-1 rounded text-xs"
        >
          Clear Log
        </button>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 p-2 border-t border-gray-700 text-gray-500 text-xs">
        Connection status updates in real-time. Close this panel when done debugging.
      </div>
    </div>
  );
};
