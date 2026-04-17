'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSocketNotifications, PushNotification } from '@/hooks/useSocketNotifications';
import { useAuth } from '@/hooks/useAuth';

interface SocketIOContextType {
  isConnected: boolean;
  subscribe: (eventType: string, callback: Function) => () => void;
  unsubscribe: (eventType: string, callback?: Function) => void;
  getConnectionStatus: () => boolean;
}

const SocketIOContext = createContext<SocketIOContextType | undefined>(
  undefined
);

export const useSocketIO = (): SocketIOContextType => {
  const context = useContext(SocketIOContext);
  if (!context) {
    throw new Error('useSocketIO must be used within SocketIOProvider');
  }
  return context;
};

interface SocketIOProviderProps {
  children: ReactNode;
  enabled?: boolean;
  debug?: boolean;
}

export const SocketIOProvider: React.FC<SocketIOProviderProps> = ({
  children,
  enabled = true,
  debug = false,
}) => {
  const auth = useAuth();
  const userId = auth?.user?.id;

  const { isConnected, subscribe, unsubscribe, getConnectionStatus } =
    useSocketNotifications(userId, {
      enabled,
      autoReconnect: true,
      debug,
    });

  const value: SocketIOContextType = {
    isConnected,
    subscribe,
    unsubscribe,
    getConnectionStatus,
  };

  return (
    <SocketIOContext.Provider value={value}>
      {children}
    </SocketIOContext.Provider>
  );
};
