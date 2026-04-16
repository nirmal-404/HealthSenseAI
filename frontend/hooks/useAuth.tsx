'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface User {
  id: string;
  userId?: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<User | null>;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getDashboardPathByRole = (role?: User['role']) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'doctor') return '/doctor/dashboard';
  if (role === 'patient') return '/patient/dashboard';
  return '/';
};

const fetchCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response?.data?.data as User;
};

const parseStoredUser = (rawUser: string | null): User | null => {
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser();
      localStorage.setItem('user', JSON.stringify(currentUser));
      setUser(currentUser);
      return currentUser;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const currentUser = await refreshUser();
          if (!currentUser) {
            const fallbackUser = parseStoredUser(localStorage.getItem('user'));
            if (fallbackUser) {
              setUser(fallbackUser);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [refreshUser]);

  const login = async (data: any) => {
    try {
      const response = await api.post('/auth/login', data);
      const { accessToken, user: loggedInUser } = response.data.data;
      localStorage.setItem('accessToken', accessToken);

      let currentUser = loggedInUser as User;
      const refreshedUser = await refreshUser();
      if (refreshedUser) {
        currentUser = refreshedUser;
      } else {
        currentUser = loggedInUser;
        localStorage.setItem('user', JSON.stringify(currentUser));
        setUser(currentUser);
      }

      toast.success('Sign in successful!');

      router.push(getDashboardPathByRole(currentUser?.role));
    } catch (err: any) {
      if (!err?.response) {
        toast.error('Cannot connect to backend. Start API Gateway (50000) and User Service (50009), then try again.');
      } else if (err?.response?.status === 408 || err?.response?.status === 504) {
        toast.error('Login request timed out. Please check API Gateway and User Service are both running.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to sign in');
      }
      throw err;
    }
  };

  const register = async (data: any) => {
    try {
      await api.post('/auth/register', data);
      toast.success('Registration successful! Please check your email to verify.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
      toast.info('Logged out successfully');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
