'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doctorService, DoctorProfile } from '@/lib/services/doctorService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { RoleGuard } from '@/components/common/RoleGuard';

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<DoctorProfile>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    speciality: '',
    qualifications: [],
    bio: '',
    licenseNumber: '',
  });
  const [newQual, setNewQual] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.getProfile(user!.id);
      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to load profile (might not exist yet)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await doctorService.updateProfile(user.id, profile);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const addQualification = () => {
    if (newQual && !profile.qualifications.includes(newQual)) {
      setProfile({ ...profile, qualifications: [...profile.qualifications, newQual] });
      setNewQual('');
    }
  };

  const removeQualification = (q: string) => {
    setProfile({
      ...profile,
      qualifications: profile.qualifications.filter((item) => item !== q),
    });
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
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctor Profile</h1>
          <p className="text-slate-500 text-lg">Manage your professional information and credentials.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="md:col-span-2 border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>Tell your patients about your experience and speciality.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={profile.firstName} disabled className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={profile.lastName} disabled className="bg-slate-50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="speciality">Medical Speciality</Label>
                <Input
                  id="speciality"
                  placeholder="e.g. Cardiologist"
                  value={profile.speciality}
                  onChange={(e) => setProfile({ ...profile, speciality: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  placeholder="Write a brief professional summary..."
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Qualifications & Degrees</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. MBBS, MD"
                    value={newQual}
                    onChange={(e) => setNewQual(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addQualification()}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addQualification}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.qualifications.map((q) => (
                    <Badge key={q} variant="secondary" className="pl-3 pr-1 py-1 gap-1 text-sm bg-teal-50 text-teal-700 hover:bg-teal-100 border-none">
                      {q}
                      <button onClick={() => removeQualification(q)} className="p-0.5 hover:bg-teal-200 rounded-full">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {profile.qualifications.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No qualifications added yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t border-slate-100 dark:border-slate-800 pt-6">
              <Button onClick={handleSave} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-8">
            <Card className="border-none shadow-xl bg-teal-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <CardHeader>
                <CardTitle>License & Identity</CardTitle>
                <CardDescription className="text-teal-100">Verification details for patients.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber" className="text-white">Medical License Number</Label>
                  <Input
                    id="licenseNumber"
                    className="bg-white/10 border-white/20 text-white placeholder:text-teal-200"
                    placeholder="e.g. LIC-12345678"
                    value={profile.licenseNumber}
                    onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
                  />
                </div>
                <p className="text-xs text-teal-100">
                  Your license will be cross-referenced with regional health boards for verification.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Preview Card</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-teal-50 flex items-center justify-center font-bold text-2xl text-teal-600">
                    {profile.lastName[0] || 'D'}
                  </div>
                  <div>
                    <p className="font-bold text-lg">Dr. {profile.lastName || 'Doctor'}</p>
                    <p className="text-teal-600 text-sm font-medium">{profile.speciality || 'Speciality'}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1">
                   {profile.qualifications.slice(0, 3).map(q => (
                     <Badge key={q} variant="outline" className="text-[10px] py-0">{q}</Badge>
                   ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
