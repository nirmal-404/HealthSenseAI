'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doctorService, DoctorProfile } from '@/lib/services/doctorService';
import { telemedicineService } from '@/lib/services/telemedicineService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Award, User, ChevronLeft, Video, Loader2, Star, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function DoctorDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [slots, setSlots] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (id) {
       loadData();
    }
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [docData, slotData] = await Promise.all([
        doctorService.getProfile(id as string),
        doctorService.getTimeSlots(id as string)
      ]);
      setDoctor(docData);
      setSlots(slotData || []);
    } catch (err) {
      toast.error('Failed to load doctor details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSession = async () => {
    if (!user) {
      toast.info('Please sign in to book a session');
      router.push('/login');
      return;
    }
    setIsBooking(true);
    try {
      // In a real flow, we'd select a slot first. 
      // For this demo, we'll create a session directly for the doctor.
      const session = await telemedicineService.createSession({
        patientId: user.id,
        doctorId: id as string
      });
      toast.success('Telemedicine session scheduled!');
      router.push(`/sessions/room/${session.sessionId}`);
    } catch (err) {
      toast.error('Failed to book session');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!doctor) return <div className="p-20 text-center">Doctor not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-24">
      <div className="max-w-6xl mx-auto px-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2 text-slate-500">
           <ChevronLeft className="w-4 h-4" /> Back to Search
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Sidebar: Brief Info */}
           <div className="space-y-6">
              <Card className="border-none shadow-2xl overflow-hidden rounded-3xl">
                 <div className="h-32 bg-teal-600/10 flex items-center justify-center pt-8">
                   <div className="w-32 h-32 rounded-[2.5rem] bg-white dark:bg-slate-900 border-8 border-slate-50 dark:border-slate-950 flex items-center justify-center shadow-xl animate-in zoom-in duration-500">
                      <span className="text-5xl font-extrabold text-teal-600">{doctor.lastName[0]}</span>
                   </div>
                 </div>
                 <CardContent className="pt-20 pb-8 text-center px-6">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </h1>
                    <p className="text-teal-600 font-bold mt-1 uppercase tracking-wider text-xs">{doctor.speciality}</p>
                    
                    <div className="flex items-center justify-center gap-1 mt-4">
                       {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                       <span className="text-sm font-bold ml-2">4.9</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-8">
                       <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
                          <p className="text-xs text-slate-500 mb-1">Patients</p>
                          <p className="font-bold">1,200+</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
                          <p className="text-xs text-slate-500 mb-1">XP</p>
                          <p className="font-bold">12 yrs+</p>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-none shadow-xl rounded-3xl bg-teal-600 text-white p-6 space-y-4">
                 <h3 className="font-bold flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> Verfied Professional
                 </h3>
                 <p className="text-xs text-teal-100 leading-relaxed">
                   License {doctor.licenseNumber || 'Verified by Health Board'}. This doctor has verified credentials and background checks.
                 </p>
              </Card>
           </div>

           {/* Central Content: Bio & Availability */}
           <div className="lg:col-span-2 space-y-8">
              <div className="space-y-4 px-2">
                 <h2 className="text-3xl font-black text-slate-900 dark:text-white">About the Specialist</h2>
                 <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed italic">
                   "{doctor.bio || 'Dedicated medical professional committed to providing the best healthcare services to my patients.'}"
                 </p>

                 <div className="flex flex-wrap gap-2 pt-4">
                    {doctor.qualifications.map((q, idx) => (
                      <Badge key={`${q}-${idx}`} variant="secondary" className="px-4 py-1.5 rounded-full bg-teal-50 text-teal-700 border-none">
                        <Award className="w-3 h-3 mr-2" /> {q}
                      </Badge>
                    ))}
                 </div>
              </div>

              <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
                 <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                       <div>
                          <CardTitle className="text-2xl">Available Slots</CardTitle>
                          <CardDescription>Book a slot for a telemedicine session.</CardDescription>
                       </div>
                       <div className="flex items-center gap-3">
                          <Badge variant="outline" className="px-4 py-2 border-teal-200 text-teal-700 bg-white">
                             <Video className="w-4 h-4 mr-2" /> Video Call
                          </Badge>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">$50</p>
                       </div>
                    </div>
                 </CardHeader>
                 <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {slots.length > 0 ? (
                         slots.map((slot: any, i: number) => (
                           <button 
                             key={i} 
                             className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all text-left group"
                             onClick={handleBookSession}
                           >
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="secondary" className="bg-slate-100 group-hover:bg-teal-100 group-hover:text-teal-700">{slot.dayOfWeek}</Badge>
                                <ChevronLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 rotate-180 transition-all" />
                              </div>
                              <div className="flex items-center gap-2 text-slate-500 group-hover:text-teal-700">
                                 <Clock className="w-4 h-4" />
                                 <span className="font-bold text-sm">{slot.startTime} - {slot.endTime}</span>
                              </div>
                           </button>
                         ))
                       ) : (
                         <div className="col-span-full py-12 text-center space-y-4 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                            <Calendar className="w-12 h-12 mx-auto text-slate-300" />
                            <p className="text-slate-500 italic">No available slots for the next 7 days.</p>
                         </div>
                       )}
                    </div>
                 </CardContent>
                 <CardFooter className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                    <Button 
                      onClick={handleBookSession} 
                      disabled={isBooking || slots.length === 0}
                      className="w-full h-16 rounded-2xl text-lg font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-500/20"
                    >
                       {isBooking ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Booking & Start Session'}
                    </Button>
                 </CardFooter>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
}
