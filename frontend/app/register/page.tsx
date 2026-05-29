'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
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
    role: 'patient', // Default role
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
      return; // Should show toast error
    }
    setIsLoading(true);
    try {
      await register(formData);
    } catch (err) {
      // Error handled by toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#e8edf6] p-3 md:p-5">
      <div className="mx-auto h-full w-full max-w-6xl overflow-hidden rounded-2xl border border-[#d6deea] bg-white shadow-[0_22px_60px_rgba(35,61,130,0.2)] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid h-full lg:grid-cols-[1.05fr_1.35fr]">
          <aside className="hidden h-full overflow-y-auto lg:flex flex-col bg-[#2f4fcb] text-white">
            <div className="h-[48%] min-h-[220px]">
              <img
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80"
                alt="Healthcare"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex-1 p-6 xl:p-7">
              <div className="mb-6 flex items-center gap-3">
                <p className="text-[2rem] font-semibold tracking-tight">
                  HealthSense<span className="text-[#9ef2e8]">AI</span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-[#2646c3] p-5 xl:p-6">
                <p className="text-base font-semibold text-blue-100">Create your</p>
                <p className="mt-1 text-3xl font-bold leading-tight xl:text-4xl">HealthSenseAI</p>
                <p className="text-3xl font-bold leading-tight xl:text-4xl">Patient Account</p>
                <p className="mt-3 text-sm leading-relaxed text-blue-100 xl:text-base">
                  Join our cloud-based hospital platform and manage your care experience in one place.
                </p>
              </div>
            </div>
          </aside>

          <section className="flex h-full items-start overflow-y-auto bg-white px-6 py-6 md:px-10 md:py-7 lg:items-center lg:px-12">
            <div className="mx-auto w-full max-w-2xl">
              <div className="mb-6 space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Register</h1>
                <p className="text-slate-500">Create your account to start using HealthSenseAI.</p>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">First Name</Label>
                  <Input id="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} required className="h-10 rounded-xl border-[#d8dfeb] bg-[#eef2fa] text-slate-900 placeholder:text-slate-400 caret-slate-900 [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#eef2fa]" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} required className="h-10 rounded-xl border-[#d8dfeb] bg-[#eef2fa] text-slate-900 placeholder:text-slate-400 caret-slate-900 [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#eef2fa]" />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                  <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required className="h-10 rounded-xl border-[#d8dfeb] bg-[#eef2fa] text-slate-900 placeholder:text-slate-400 caret-slate-900 [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#eef2fa]" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-slate-700">Phone Number</Label>
                  <Input id="phoneNumber" placeholder="+1234567890" value={formData.phoneNumber} onChange={handleChange} required className="h-10 rounded-xl border-[#d8dfeb] bg-[#eef2fa] text-slate-900 placeholder:text-slate-400 caret-slate-900 [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#eef2fa]" />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-700">Date of Birth</Label>
                  <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required className="h-10 rounded-xl border-[#d8dfeb] bg-[#eef2fa] text-slate-900 caret-slate-900 [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#eef2fa]" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="gender" className="text-sm font-medium text-slate-700">Gender</Label>
                  <Select onValueChange={(v) => handleSelectChange(v, 'gender')} defaultValue={formData.gender}>
                    <SelectTrigger id="gender" className="h-10 rounded-xl border-[#d8dfeb] bg-[#eef2fa] text-slate-900">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5 md:col-span-2">
                  <Label htmlFor="address" className="text-sm font-medium text-slate-700">Address</Label>
                  <Input id="address" placeholder="123 Main Street" value={formData.address} onChange={handleChange} required className="h-10 rounded-xl border-[#d8dfeb] bg-[#eef2fa] text-slate-900 placeholder:text-slate-400 caret-slate-900 [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#eef2fa]" />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <Input id="password" type="password" value={formData.password} onChange={handleChange} required className="h-10 rounded-xl border-[#d8dfeb] bg-[#eef2fa] text-slate-900 placeholder:text-slate-400 caret-slate-900 [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#eef2fa]" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required className="h-10 rounded-xl border-[#d8dfeb] bg-[#eef2fa] text-slate-900 placeholder:text-slate-400 caret-slate-900 [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#eef2fa]" />
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-[#3559d5] text-white hover:bg-[#2d4db9] md:col-span-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Sign Up'
                  )}
                </Button>

                <p className="text-center text-sm text-slate-500 md:col-span-2">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-[#3559d5] hover:text-[#2a47ad] transition-colors">
                    Sign In
                  </Link>
                </p>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
