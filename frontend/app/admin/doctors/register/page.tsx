'use client';

import React, { useState } from 'react';
import { RoleGuard } from '@/components/common/RoleGuard';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Loader2, ClipboardList } from 'lucide-react';

export default function AdminDoctorRegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: 'male',
    address: '',
    role: 'doctor', // Force doctor role
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/register', formData);
      toast.success('Doctor registered successfully! Verification email sent.');
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        dateOfBirth: '',
        gender: 'male',
        address: '',
        role: 'doctor',
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="bg-teal-600 p-3 rounded-2xl text-white shadow-lg shadow-teal-200 dark:shadow-none">
            <UserPlus className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Register New Doctor</h1>
            <p className="text-slate-500">Add a medical professional to the HealthSenseAI network.</p>
          </div>
        </div>

        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-600" />
              <CardTitle>Doctor Credentials & Info</CardTitle>
            </div>
            <CardDescription>All fields are required for professional verification.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Dr. James" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Wilson" value={formData.lastName} onChange={handleChange} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input id="email" type="email" placeholder="james.wilson@healthsense.ai" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input id="phoneNumber" placeholder="+1234567890" value={formData.phoneNumber} onChange={handleChange} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select onValueChange={(v) => handleSelectChange(v, 'gender')} defaultValue={formData.gender}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Professional Address / Clinic Address</Label>
                <Input id="address" placeholder="Central Hospital, Suite 402" value={formData.address} onChange={handleChange} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="grid gap-2">
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Temporary Password</Label>
                  <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 dark:bg-slate-800/20 py-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white min-w-[150px]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register Doctor'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </RoleGuard>
  );
}
