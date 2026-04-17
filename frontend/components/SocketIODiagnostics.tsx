'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocketIO } from './providers/SocketIOProvider';

export const SocketIODiagnostics = () => {
  const auth = useAuth();
  const socketIO = useSocketIO();
  const [mounted, setMounted] = useState(false);
  const [debug, setDebug] = useState({
    userId: 'loading...',
    isConnected: false,
    status: 'checking',
    timestamp: '00:00:00',
  });

  // Only update after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Update immediately
    setDebug({
      userId: auth?.user?.id || 'NOT LOADED',
      isConnected: socketIO.getConnectionStatus(),
      status: socketIO.getConnectionStatus() ? 'CONNECTED' : 'DISCONNECTED',
      timestamp: new Date().toLocaleTimeString(),
    });

    // Check connection every second
    const interval = setInterval(() => {
      setDebug({
        userId: auth?.user?.id || 'NOT LOADED',
        isConnected: socketIO.getConnectionStatus(),
        status: socketIO.getConnectionStatus() ? 'CONNECTED' : 'DISCONNECTED',
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [auth, socketIO]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  const testNotification = () => {
    console.log('📤 Test emit:', {
      userId: auth?.user?.id,
      connected: socketIO.getConnectionStatus(),
    });
  };

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 text-white p-4 rounded-lg font-mono text-sm max-w-sm z-40">
      <h3 className="font-bold mb-2">Socket.IO Debug</h3>
      <div className="space-y-1">
        <div>
          User ID:{' '}
          <span className={auth?.user?.id ? 'text-green-400' : 'text-red-400'}>
            {debug.userId}
          </span>
        </div>
        <div>
          Status:{' '}
          <span className={debug.isConnected ? 'text-green-400' : 'text-red-400'}>
            {debug.status}
          </span>
        </div>
        <div className="text-gray-400 text-xs">{debug.timestamp}</div>
        <button
          onClick={testNotification}
          className="mt-2 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          Test
        </button>
      </div>
    </div>
  );
};
