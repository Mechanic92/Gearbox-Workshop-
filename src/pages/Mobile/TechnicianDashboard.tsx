import React from 'react';
import { 
  Scan, 
  Camera, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  ChevronRight, 
  Menu, 
  Bell, 
  User,
  LayoutGrid,
  Filter,
  Search,
  Plus,
  Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Technician Mobile View
 * Optimized for smartphone use in the workshop.
 * Features: QR Scanning, Quick Photo Capture, Job Timer.
 */

export default function TechnicianMobile() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-blue-200 antialiased pb-24 touch-none">
      
      {/* Mobile Sticky Header */}
      <header className="sticky top-0 z-50 bg-neutral-900/90 backdrop-blur-xl border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-blue-500/30">G</div>
            <h1 className="text-sm font-black uppercase tracking-tighter italic">Gearbox <span className="text-blue-500">Tech</span></h1>
         </div>
         <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-neutral-400" />
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
               <User className="w-4 h-4 text-neutral-400" />
            </div>
         </div>
      </header>

      <main className="px-6 py-8 space-y-8">
         
         {/* Tech Greetings */}
         <section>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Thursday, Oct 12</p>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Hi, <br/>Mike Smith</h2>
         </section>

         {/* Stats Bar */}
         <section className="grid grid-cols-3 gap-4">
            {[
              { label: 'Active', val: '04', color: 'blue' },
              { label: 'Done', val: '12', color: 'emerald' },
              { label: 'SLA', val: '98%', color: 'indigo' }
            ].map(stat => (
              <div key={stat.label} className="bg-neutral-800 p-4 rounded-2xl border border-neutral-700 shadow-xl">
                 <p className="text-[7px] font-black uppercase tracking-widest text-neutral-500 mb-1">{stat.label}</p>
                 <p className={cn("text-xl font-black italic", `text-${stat.color}-500`)}>{stat.val}</p>
              </div>
            ))}
         </section>

         {/* Scan to Start Job - HUGE Call to action */}
         <section>
            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white h-24 rounded-[32px] flex flex-col items-center justify-center gap-1 shadow-2xl shadow-blue-500/40 border-none transition-all active:scale-95">
               <Scan className="w-8 h-8" />
               <span className="text-[10px] font-black uppercase tracking-widest">Scan Vehicle QR to Start</span>
            </Button>
         </section>

         {/* Active Jobs List */}
         <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xs font-black uppercase tracking-widest italic flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-neutral-500" /> My Workspace
               </h3>
               <span className="text-[9px] font-bold text-neutral-500">04 JOBS ASSIGNED</span>
            </div>

            <div className="space-y-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[32px] opacity-0 group-hover:opacity-10 transition-opacity" />
                    <Card className="relative bg-neutral-800 border border-neutral-700 rounded-[32px] overflow-hidden">
                       <CardContent className="p-6 space-y-4">
                          <div className="flex items-start justify-between">
                             <div className="flex gap-4">
                                <div className="w-12 h-12 bg-neutral-700 rounded-2xl flex items-center justify-center text-neutral-400">
                                   <Car className="w-6 h-6" />
                                </div>
                                <div>
                                   <h4 className="text-lg font-black tracking-tighter uppercase italic leading-none">ABC-12{i}</h4>
                                   <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mt-2">Audi RS6 Performance</p>
                                </div>
                             </div>
                             <div className="flex flex-col items-end">
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black tracking-widest mb-1 px-2 py-0.5">READY</Badge>
                                <p className="text-[9px] font-bold text-neutral-500 italic">Job #440{i}</p>
                             </div>
                          </div>

                          <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-700/50">
                             <div className="flex items-center justify-between mb-2">
                                <p className="text-[8px] font-black uppercase tracking-widest text-neutral-500 italic">Scheduled Service</p>
                                <div className="flex items-center gap-1">
                                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                   <p className="text-[8px] font-black uppercase tracking-widest text-blue-500">45m REMAINING</p>
                                </div>
                             </div>
                             <p className="text-[10px] font-bold text-neutral-300 leading-relaxed italic">Oil service, brake inspection, and full vehicle diagnostics scan...</p>
                          </div>

                          <div className="flex gap-2">
                             <Button className="flex-1 bg-white text-black font-black text-[9px] uppercase tracking-widest h-12 rounded-xl">
                                START TIMER
                             </Button>
                             <Button className="w-12 h-12 bg-neutral-700 text-white rounded-xl flex items-center justify-center p-0 border-none">
                                <Camera className="w-5 h-5" />
                             </Button>
                             <Button className="w-12 h-12 bg-neutral-700 text-white rounded-xl flex items-center justify-center p-0 border-none">
                                <ChevronRight className="w-5 h-5" />
                             </Button>
                          </div>
                       </CardContent>
                    </Card>
                 </div>
               ))}
            </div>
         </section>

      </main>

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-neutral-900/80 backdrop-blur-2xl border-t border-neutral-800 px-6 py-4 flex items-center justify-between z-50">
         <div className="flex flex-col items-center gap-1 text-blue-500">
            <LayoutGrid className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-widest">Dashboard</span>
         </div>
         <div className="flex flex-col items-center gap-1 text-neutral-500">
            <Filter className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-widest">Inventory</span>
         </div>
         <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center -mt-10 shadow-xl shadow-blue-500/30 border-4 border-neutral-900 active:scale-90 transition-transform">
            <Plus className="w-6 h-6 text-white" />
         </div>
         <div className="flex flex-col items-center gap-1 text-neutral-500">
            <Search className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-widest">Search</span>
         </div>
         <div className="flex flex-col items-center gap-1 text-neutral-500">
            <Menu className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-widest">Settings</span>
         </div>
      </nav>

    </div>
  );
}
