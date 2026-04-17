'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { telemedicineService, TelemedicineSession } from '@/lib/services/telemedicineService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Info, FileText, Activity, Loader2, Sparkles, AlertCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Script from 'next/script';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function VideoRoomPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [session, setSession] = useState<TelemedicineSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
       loadSession();
    }
  }, [id]);

  const loadSession = async () => {
    try {
      const data = await telemedicineService.getSession(id as string);
      setSession(data);
    } catch (err) {
      toast.error('Failed to load session details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJitsiLoad = () => {
    if (!jitsiContainerRef.current || !id || !user) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: `HealthSenseAI-${id}`,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: `${user.role === 'doctor' ? 'Dr. ' : ''}${user.firstName} ${user.lastName}`,
        email: user.email,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fims-whiteboard', 'hangup', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
          'security'
        ],
      },
      configOverwrite: {
        disableDeepLinking: true,
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
    
    api.addEventListener('videoConferenceLeft', () => {
      toast.info('Meeting ended');
      router.back();
    });

    setJitsiApi(api);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      <Script 
        src="https://meet.jit.si/external_api.js" 
        onLoad={handleJitsiLoad}
      />

      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400 hover:text-white">
            <ChevronLeft />
          </Button>
          <div>
            <h1 className="font-bold flex items-center gap-2">
              Telemedicine Session
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            </h1>
            <p className="text-xs text-slate-400">ID: {id}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center gap-2 text-xs text-teal-400 bg-teal-400/10 px-3 py-1 rounded-full border border-teal-400/20">
              <Activity className="w-3 h-3" /> Encrypted Connection
           </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 bg-black relative" ref={jitsiContainerRef}>
          {!jitsiApi && (
             <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                <p className="text-slate-400">Initializing secure room...</p>
             </div>
          )}
        </div>

        {/* Sidebar for AI Panel */}
        <div className="w-80 md:w-96 border-l border-slate-800 bg-slate-900 overflow-y-auto hidden lg:flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              AI Insights
            </h2>
            <Badge variant="outline" className="text-[10px] text-teal-400 border-teal-400/20">BETA</Badge>
          </div>

          <div className="flex-1 p-6 space-y-6">
            <section className="space-y-3">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                 <FileText className="w-4 h-4" />
                 SOAP Notes
               </h3>
               <Card className="bg-slate-800/50 border-slate-700">
                 <CardContent className="p-4">
                    {session?.summary?.soapNotes ? (
                       <p className="text-sm leading-relaxed text-slate-200">{session.summary.soapNotes}</p>
                    ) : (
                       <div className="flex flex-col items-center justify-center py-8 text-center gap-2 opacity-50">
                          <AlertCircle className="w-8 h-8 mb-2" />
                          <p className="text-xs italic">AI is listening... Notes will be generated during and after the session.</p>
                       </div>
                    )}
                 </CardContent>
               </Card>
            </section>

            <section className="space-y-3">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                 <Info className="w-4 h-4" />
                 Action Items
               </h3>
               <div className="space-y-2">
                  {session?.summary?.actionItems?.map((item, i) => (
                    <div key={i} className="flex gap-2 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-100">
                       <span className="font-bold text-teal-400">•</span>
                       {item}
                    </div>
                  )) || (
                    <p className="text-xs text-slate-500 italic px-2">No items yet.</p>
                  )}
               </div>
            </section>
          </div>

          <div className="p-6 border-t border-slate-800 bg-slate-800/30">
             <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300 leading-relaxed shadow-inner">
                <strong>Disclaimer:</strong> AI insights are provided for assistance only. Medical decisions should be verified by a qualified professional.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
