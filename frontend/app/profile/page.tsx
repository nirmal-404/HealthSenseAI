'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { KeyRound, ShieldAlert, Trash2, User, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully. Please log in again.');
      logout(); // Logout after password change for security
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    setIsDeletingAccount(true);
    try {
      await api.delete('/auth/delete-account');
      toast.success('Account deleted successfully');
      logout();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (!user) return <div className="p-8 text-center text-slate-500">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-slate-500">Manage your account settings and security preferences.</p>
      </div>

      <div className="grid gap-8">
        {/* Personal Info */}
        <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              <CardTitle className="text-xl">Personal Information</CardTitle>
            </div>
            <CardDescription>Your basic information displayed on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 uppercase tracking-wider">Full Name</Label>
              <p className="text-lg font-medium">{user.firstName} {user.lastName}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 uppercase tracking-wider">Email Address</Label>
              <p className="text-lg font-medium">{user.email}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 uppercase tracking-wider">Role</Label>
              <div className="mt-1">
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 capitalize">
                  {user.role}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-teal-600" />
              <CardTitle className="text-xl">Security</CardTitle>
            </div>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordChange}>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 dark:bg-slate-800/30 mt-4 py-4 flex justify-end">
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Danger Zone */}
        <Card className="border border-red-100 dark:border-red-900/30 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <CardTitle className="text-xl text-red-600">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-red-500/80">Permanent actions that cannot be reversed.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Delete Account</p>
              <p className="text-sm text-slate-500">Once you delete your account, there is no going back. Please be certain.</p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
