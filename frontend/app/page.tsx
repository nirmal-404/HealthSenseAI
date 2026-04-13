import Navbar from '@/components/common/navbar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeartPulse, ShieldCheck, Zap, Activity } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-100/50 dark:bg-teal-900/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-emerald-100/50 dark:bg-emerald-900/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <div className="inline-flex items-center rounded-full border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 px-4 py-1.5 text-sm font-medium text-teal-700 dark:text-teal-300 animate-in fade-in slide-in-from-top duration-700">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              Next-Gen Medical Platform is Live
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700">
              AI-Powered Healthcare <br />
              <span className="text-teal-600">Tailored to You</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
               Experience seamless medical management, intelligent symptom checking, and instant consultations with HealthSense AI.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-200 dark:shadow-none">
                  Get Started for Free
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2">
                  Explore Services
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-24 animate-in fade-in zoom-in duration-1000 delay-300">
            {[
              { title: 'Secure Privacy', desc: 'End-to-end encrypted medical data storage.', icon: ShieldCheck, color: 'text-blue-600' },
              { title: 'Instant Care', desc: 'Get matched with specialists in minutes.', icon: Zap, color: 'text-orange-500' },
              { title: 'AI Diagnostics', desc: 'Advanced symptom checking algorithms.', icon: Activity, color: 'text-teal-600' },
              { title: 'Global Network', desc: 'Access healthcare from anywhere in the world.', icon: HeartPulse, color: 'text-rose-500' },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xl hover:shadow-teal-100 dark:hover:shadow-none transition-all duration-300 md:translate-y-[var(--y)]"
                style={{ '--y': i % 2 === 0 ? '0' : '2rem' } as React.CSSProperties}
              >
                <div className={`h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
