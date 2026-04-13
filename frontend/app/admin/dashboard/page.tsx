'use client';

import React from 'react';
import { RoleGuard } from '@/components/common/RoleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { ShieldCheck, UserPlus, Users, Activity, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuth();

  const platformStats = [
    { title: 'Total Users', value: '5,672', delta: '+12%', icon: Users },
    { title: 'Active Doctors', value: '48', delta: '+2', icon: Activity },
    { title: 'Platform Health', value: '99.9%', delta: 'Stable', icon: ShieldCheck },
    { title: 'Monthly Revenue', value: '$12,450', delta: '+8%', icon: BarChart3 },
  ];

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Control Center</h1>
            <p className="text-slate-500 text-lg">Managing HealthSenseAI platform infrastructure and staff.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin/doctors/register">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                <UserPlus className="w-4 h-4" /> Register Doctor
              </Button>
            </Link>
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" /> Platform Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {platformStats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 overflow-hidden group">
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between z-10 relative">
                  <div>
                    <p className="text-sm font-medium text-slate-500 group-hover:text-teal-600 transition-colors uppercase tracking-tight">{stat.title}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    <p className="text-xs text-green-500 font-medium mt-1">{stat.delta} <span className="text-slate-400">vs last month</span></p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl group-hover:bg-teal-50 group-hover:scale-110 transition-all duration-300">
                    <stat.icon className="w-8 h-8 text-teal-600" />
                  </div>
                </div>
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-teal-50/50 dark:bg-teal-900/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
            <CardTitle>Management Overview</CardTitle>
            <CardDescription>Monitor clinical activity and user growth across the ecosystem.</CardDescription>
          </CardHeader>
          <CardContent className="p-12 text-center text-slate-400">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Platform Activity Analytics will appear here.</p>
            <p className="text-sm">Real-time data synchronization is active.</p>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
