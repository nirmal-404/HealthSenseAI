'use client';

import React from 'react';
import { RoleGuard } from '@/components/common/RoleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Users, Activity, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DoctorDashboard() {
  const { user } = useAuth();

  const stats = [
    { title: 'Appointments', value: '12', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Patients', value: '1,240', icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
    { title: 'Urgent Cases', value: '3', icon: Activity, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Avg. Wait Time', value: '15m', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <RoleGuard allowedRoles={['doctor']}>
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, Dr. {user?.lastName}</h1>
            <p className="text-slate-500 text-lg">Here's what's happening in your clinic today.</p>
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            View Today's Schedule
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-2xl`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <Card className="lg:col-span-2 border-none shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>You have 5 more appointments today.</CardDescription>
              </div>
              <Button variant="ghost" className="text-teal-600 text-xs gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Alice Freeman', time: '10:30 AM', type: 'General Checkup', status: 'Confirmed' },
                  { name: 'Robert Fox', time: '11:15 AM', type: 'Follow-up', status: 'Delayed' },
                  { name: 'Sarah Miller', time: '01:45 PM', type: 'Consultation', status: 'Pending' },
                ].map((apt, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                        {apt.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{apt.name}</p>
                        <p className="text-xs text-slate-500">{apt.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{apt.time}</p>
                      <p className={`text-xs ${apt.status === 'Confirmed' ? 'text-green-600' : apt.status === 'Delayed' ? 'text-red-600' : 'text-orange-600'}`}>
                        {apt.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Link href="/doctor/profile" className="w-full">
                <Button variant="outline" className="justify-start gap-2 h-12 w-full border-dashed hover:border-teal-400 hover:bg-teal-50/50">
                  <Users className="w-4 h-4 text-teal-600" /> Manage Profile
                </Button>
              </Link>
              <Link href="/doctor/sessions" className="w-full">
                <Button variant="outline" className="justify-start gap-2 h-12 w-full border-dashed hover:border-orange-400 hover:bg-orange-50/50">
                  <Activity className="w-4 h-4 text-orange-600" /> Telemedicine Sessions
                </Button>
              </Link>
              <Link href="/doctor/availability" className="w-full">
                <Button variant="outline" className="justify-start gap-2 h-12 w-full border-dashed hover:border-blue-400 hover:bg-blue-50/50">
                  <Clock className="w-4 h-4 text-blue-600" /> Set Working Hours
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}

import Link from 'next/link';
