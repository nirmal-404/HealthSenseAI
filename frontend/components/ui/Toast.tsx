'use client';

import React, { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

/**
 * Toast Context for global notification state
 */
export const ToastContext = React.createContext<{
  toasts: ToastMessage[];
  addToast: (message: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
} | null>(null);

/**
 * ToastProvider Component
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const toast = { ...message, id };
    setToasts((prev) => [...prev, toast]);

    // Auto-remove after duration (default 5 seconds)
    if (message.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, message.duration || 5000);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast
 */
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return {
    success: (title: string, description?: string) =>
      context.addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      context.addToast({ type: 'error', title, description }),
    info: (title: string, description?: string) =>
      context.addToast({ type: 'info', title, description }),
    warning: (title: string, description?: string) =>
      context.addToast({ type: 'warning', title, description }),
  };
}

/**
 * ToastContainer Component - displays all toasts
 */
function ToastContainer() {
  const context = React.useContext(ToastContext);
  if (!context) return null;

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-sm">
      {context.toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => context.removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

/**
 * ToastItem Component - individual toast
 */
interface ToastItemProps {
  toast: ToastMessage;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const getColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-right-2 ${getColors(
        toast.type
      )}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl font-bold">{getIcon(toast.type)}</span>
        <div className="flex-1">
          <h4 className="font-semibold">{toast.title}</h4>
          {toast.description && (
            <p className="text-sm opacity-90">{toast.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-lg font-bold hover:opacity-75"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
