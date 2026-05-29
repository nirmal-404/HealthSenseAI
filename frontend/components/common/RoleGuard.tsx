'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('patient' | 'doctor' | 'admin')[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const isUnauthorized = Boolean(user && !allowedRoles.includes(user.role));

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (isUnauthorized) {
        // Redirect to a default page or show unauthorized
        router.replace('/');
      }
    }
  }, [loading, isAuthenticated, isUnauthorized, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eff4fc] p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#dce5f2] bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">Session required</h2>
          <p className="mt-2 text-sm text-slate-600">Please sign in to continue.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-lg bg-[#3559d5] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d4db9]"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eff4fc] p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#dce5f2] bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">Access not allowed</h2>
          <p className="mt-2 text-sm text-slate-600">Your account role cannot open this page.</p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-lg bg-[#3559d5] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d4db9]"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
