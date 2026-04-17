'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorService, WeeklySlot } from '@/lib/services/doctorService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Trash2, Plus, Loader2, Save, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { RoleGuard } from '@/components/common/RoleGuard';
import { Badge } from '@/components/ui/badge';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [weeklySlots, setWeeklySlots] = useState<WeeklySlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<{ date: string }[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadAvailability();
    }
  }, [user?.id]);

  const loadAvailability = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.getAvailability(user!.id);
      if (data) {
        setWeeklySlots(data.weeklySlots || []);
        setBlockedDates(data.blockedDates || []);
      }
    } catch (err) {
      console.error('Failed to load availability');
    } finally {
      setIsLoading(false);
    }
  };

  const addSlot = () => {
    setWeeklySlots([...weeklySlots, { dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' }]);
  };

  const updateSlot = (index: number, field: keyof WeeklySlot, value: string) => {
    const updated = [...weeklySlots];
    updated[index] = { ...updated[index], [field]: value };
    setWeeklySlots(updated);
  };

  const removeSlot = (index: number) => {
    setWeeklySlots(weeklySlots.filter((_, i) => i !== index));
  };

  const addBlockedDate = () => {
    if (newBlockedDate && !blockedDates.some(d => d.date === newBlockedDate)) {
      setBlockedDates([...blockedDates, { date: newBlockedDate }]);
      setNewBlockedDate('');
    }
  };

  const removeBlockedDate = (date: string) => {
    setBlockedDates(blockedDates.filter(d => d.date !== date));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await doctorService.updateAvailability(user.id, { weeklySlots, blockedDates });
      toast.success('Availability updated successfully');
    } catch (err) {
      toast.error('Failed to update availability');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['doctor']}>
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Availability Settings</h1>
            <p className="text-slate-500 text-lg">Define your working hours and days off.</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700 text-white min-w-[140px]">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>Set your recurring weekly working hours.</CardDescription>
              </div>
              <Button onClick={addSlot} variant="outline" size="sm" className="text-teal-600 border-teal-100 hover:bg-teal-50">
                <Plus className="w-4 h-4 mr-1" /> Add Slot
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {weeklySlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <Clock className="w-12 h-12 mb-4 opacity-20" />
                  <p>No working hours defined yet.</p>
                  <Button onClick={addSlot} variant="link" className="text-teal-600 mt-2">
                    Click to add your first slot
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {weeklySlots.map((slot, index) => (
                    <div key={index} className="flex flex-wrap md:flex-nowrap items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 group">
                      <div className="w-full md:w-40">
                        <Select
                          value={slot.dayOfWeek}
                          onValueChange={(v) => updateSlot(index, 'dayOfWeek', v)}
                        >
                          <SelectTrigger className="bg-white dark:bg-slate-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS.map(day => (
                              <SelectItem key={day} value={day}>{day}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                          className="bg-white dark:bg-slate-900"
                        />
                        <span className="text-slate-400">to</span>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                          className="bg-white dark:bg-slate-900"
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSlot(index)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>These hours will be used as a template to generate your bookable slots for patients.</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  Vacations & Days Off
                </CardTitle>
                <CardDescription>Block specific dates where you're unavailable.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={newBlockedDate}
                    onChange={(e) => setNewBlockedDate(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addBlockedDate} variant="secondary" size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {blockedDates.map((d) => (
                    <div key={d.date} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm">
                      <span className="font-medium">{new Date(d.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBlockedDate(d.date)}
                        className="h-7 w-7 text-slate-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {blockedDates.length === 0 && (
                    <p className="text-center py-8 text-slate-400 italic text-sm">No dates blocked.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-teal-50 dark:bg-teal-900/10">
              <CardHeader>
                 <CardTitle className="text-sm font-bold text-teal-800 dark:text-teal-400">Pro Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-teal-700 dark:text-teal-300">
                  Patients can only book sessions during your defined weekly slots. Make sure to update your blocked dates if you take a sudden leave!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
