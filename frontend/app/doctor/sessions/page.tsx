'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { telemedicineService, TelemedicineSession } from '@/lib/services/telemedicineService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Calendar, User, Clock, Loader2, ChevronRight, Play } from 'lucide-react';
import { RoleGuard } from '@/components/common/RoleGuard';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function DoctorSessionsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<TelemedicineSession[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadSessions();
    }
  }, [user?.id]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await telemedicineService.getDoctorSessions(user!.id);
      if (data) {
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'scheduled');
  const pastSessions = sessions.filter(s => s.status === 'completed');

  return (
    <RoleGuard allowedRoles={['doctor']}>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Telemedicine Sessions</h1>
            <p className="text-slate-500 text-lg">Manage and join your virtual consultations.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/20 rounded-2xl text-teal-700 dark:text-teal-300 text-sm font-medium">
             <Video className="w-4 h-4" />
             {activeSessions.length} Upcoming / Active
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Upcoming & Live
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSessions.length === 0 ? (
              <Card className="md:col-span-2 lg:col-span-3 border-none shadow-sm py-12 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/50">
                <Video className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500">No active or scheduled sessions found.</p>
              </Card>
            ) : (
              activeSessions.map((session, idx) => (
                <Card key={`${session.sessionId}-${idx}`} className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                  <div className={`h-1.5 w-full ${session.status === 'active' ? 'bg-red-500' : 'bg-teal-500'}`} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={session.status === 'active' ? 'destructive' : 'secondary'} className="rounded-full px-3">
                        {session.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono">ID: {session.sessionId.slice(0, 8)}</span>
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                       <User className="w-5 h-5 text-slate-400" />
                       Patient {session.patientId.slice(0, 5)}...
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                       <Calendar className="w-4 h-4" />
                       Scheduled for Today
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                       <Clock className="w-4 h-4" />
                       {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0">
                    <Link href={`/sessions/room/${session.sessionId}`}>
                      <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white group-hover:scale-[1.02] transition-transform">
                        <Play className="w-4 h-4 mr-2 fill-current" /> Join Meeting
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {pastSessions.length > 0 && (
          <div className="space-y-6 pt-8">
            <h2 className="text-xl font-bold">Past Sessions & Notes</h2>
            <div className="grid grid-cols-1 gap-4">
               {pastSessions.map((session, idx) => (
                 <Card key={`${session.sessionId}-${idx}`} className="border-none shadow-sm hover:bg-slate-50/50 transition-colors">
                   <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                           <Video className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold">Consultation with {session.patientId.slice(0, 8)}</p>
                          <p className="text-xs text-slate-500">Completed on {new Date().toLocaleDateString()}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <Link href={`/sessions/room/${session.sessionId}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            View Summary
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon">
                           <ChevronRight className="w-4 h-4" />
                        </Button>
                     </div>
                   </CardContent>
                 </Card>
               ))}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
