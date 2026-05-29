'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeartPulse, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      // Error handled by toast in login function
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-y-auto bg-[#e8edf6] p-3 md:p-5">
      <div className="mx-auto h-full w-full max-w-6xl overflow-hidden rounded-2xl border border-[#d6deea] bg-white shadow-[0_22px_60px_rgba(35,61,130,0.2)] animate-in fade-in zoom-in duration-500">
        <div className="grid h-full lg:grid-cols-[1.05fr_1.35fr]">
          <aside className="hidden h-full overflow-y-auto lg:flex flex-col bg-[#2f4fcb] text-white">
            <div className="h-[48%] min-h-[220px]">
              <img
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=1200&q=80"
                alt="Doctor"
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
                <p className="text-base font-semibold text-blue-100">Welcome to</p>
                <p className="mt-1 text-3xl font-bold leading-tight xl:text-4xl">HealthSenseAI</p>
                <p className="text-3xl font-bold leading-tight xl:text-4xl">Hospital Management System</p>
                <p className="mt-3 text-sm leading-relaxed text-blue-100 xl:text-base">
                  Cloud-based streamline hospital management with a centralized, user-friendly platform.
                </p>
              </div>
            </div>
          </aside>

          <section className="flex h-full items-start overflow-y-auto bg-white px-6 py-6 md:px-12 md:py-8 lg:items-center lg:px-14">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-6 space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Login</h1>
                <p className="text-slate-500">Enter your credentials to login to your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl border-[#d8dfeb] bg-[#eef2fa] text-slate-900 placeholder:text-slate-400 caret-slate-900 [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#eef2fa]"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl border-[#d8dfeb] bg-[#eef2fa] text-slate-900 placeholder:text-slate-400 caret-slate-900 [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#eef2fa]"
                  />
                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-[#3559d5] hover:text-[#2a47ad] transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-[#3559d5] text-white hover:bg-[#2d4db9]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <p className="text-center text-sm text-slate-500">
                  Don't have an account?{' '}
                  <Link href="/register" className="font-semibold text-[#3559d5] hover:text-[#2a47ad] transition-colors">
                    Sign Up
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
