'use client';

import React, { useEffect, useState } from 'react';
import { doctorService, DoctorProfile } from '@/lib/services/doctorService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin, Star, Filter, Heart, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const SPECIALITIES = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist', 
  'Pediatrician', 'Psychiatrist', 'Orthopedic', 'Gynecologist'
];

export default function DoctorSearchPage() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState({ name: '', speciality: '' });

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.searchDoctors(query);
      setDoctors(data || []);
    } catch (err) {
      console.error('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero Search Section */}
      <div className="bg-teal-600 pt-32 pb-48 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[40%] h-full bg-white/5 skew-x-12 -mr-32" />
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-8">
           <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
             Find Your Perfect <br />
             <span className="text-teal-200">Doctor Partner</span>
           </h1>
           
           <div className="bg-white dark:bg-slate-900 p-2 rounded-3xl shadow-2xl flex flex-col md:flex-row items-stretch gap-2">
             <div className="flex-1 flex items-center px-4 gap-2 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
               <Search className="w-5 h-5 text-slate-400" />
               <Input 
                 placeholder="Search by name..." 
                 className="border-none shadow-none focus-visible:ring-0 text-lg py-6"
                 value={query.name}
                 onChange={(e) => setQuery({ ...query, name: e.target.value })}
                 onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
               />
             </div>
             <div className="flex-1 flex items-center px-4 gap-2">
               <Filter className="w-5 h-5 text-teal-600" />
               <select 
                 className="w-full bg-transparent border-none focus:ring-0 text-slate-600 dark:text-slate-300 py-4 appearance-none"
                 value={query.speciality}
                 onChange={(e) => setQuery({ ...query, speciality: e.target.value })}
               >
                 <option value="">All Specialities</option>
                 {SPECIALITIES.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
             </div>
             <Button onClick={handleSearch} className="rounded-2xl bg-teal-600 hover:bg-teal-700 text-white px-8 h-auto py-4 md:py-0">
               Search Now
             </Button>
           </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-20 grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Filters Sidebar */}
         <div className="hidden lg:block space-y-6">
            <Card className="border-none shadow-xl sticky top-24">
               <CardHeader>
                  <CardTitle className="text-lg">Specialities</CardTitle>
               </CardHeader>
               <CardContent className="space-y-2">
                  {SPECIALITIES.map(s => (
                    <button 
                      key={s} 
                      onClick={() => { setQuery({ ...query, speciality: s }); handleSearch(); }}
                      className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors ${query.speciality === s ? 'bg-teal-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                    >
                      {s}
                    </button>
                  ))}
               </CardContent>
            </Card>
         </div>

         {/* Grid */}
         <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
               <p className="text-slate-500 font-medium">Showing {doctors.length} results</p>
               <Button variant="ghost" size="sm" className="text-slate-500">Sort by: Recommended</Button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                 <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
                 <p className="text-slate-400">Loading top specialists...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 anim-in-stagger">
                {doctors.map((doctor, idx) => (
                  <Card key={`${doctor.email}-${idx}`} className="border-none shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                    <CardContent className="p-0">
                       <div className="p-6 pb-2 flex items-start justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-20 h-20 rounded-3xl bg-teal-50 flex items-center justify-center shadow-inner relative group-hover:bg-teal-100 transition-colors">
                                <span className="text-3xl font-extrabold text-teal-600">{doctor.lastName[0]}</span>
                                <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full" />
                             </div>
                             <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                                  Dr. {doctor.firstName} {doctor.lastName}
                                </h3>
                                <p className="text-teal-600 font-semibold text-sm">{doctor.speciality}</p>
                                <div className="flex items-center gap-1 mt-1">
                                   <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                   <span className="text-xs font-bold">4.9</span>
                                   <span className="text-xs text-slate-400">(120+ reviews)</span>
                                </div>
                             </div>
                          </div>
                          <Button variant="ghost" size="icon" className="rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors">
                             <Heart className="w-5 h-5" />
                          </Button>
                       </div>
                       
                       <div className="px-6 py-4 flex flex-wrap gap-1.5">
                          {doctor.qualifications.slice(0, 3).map((q, qIdx) => (
                            <Badge key={`${q}-${qIdx}`} variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] py-0 px-2 font-medium">
                              {q}
                            </Badge>
                          ))}
                       </div>

                       <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-slate-50 dark:border-slate-800 bg-slate-50/30">
                          <div className="flex items-center gap-1 text-slate-500 text-xs">
                             <MapPin className="w-3 h-3" /> Online / In-person
                          </div>
                          <Link href={`/doctors/${doctor.doctorId || doctor.email}`}>
                            <Button className="h-10 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs group">
                               View Profile <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                       </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {doctors.length === 0 && !isLoading && (
              <div className="text-center py-32 space-y-4 bg-white dark:bg-slate-900 rounded-3xl shadow-xl">
                 <Search className="w-16 h-16 mx-auto text-slate-200" />
                 <h2 className="text-2xl font-bold">No Doctors Found</h2>
                 <p className="text-slate-500">Try adjusting your filters or search terms.</p>
                 <Button onClick={() => { setQuery({ name: '', speciality: '' }); handleSearch(); }} variant="link" className="text-teal-600">
                   Clear all filters
                 </Button>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
