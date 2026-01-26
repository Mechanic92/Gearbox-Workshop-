import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Wrench, 
  Users, 
  Car, 
  Calendar, 
  Wallet, 
  Bell, 
  Search, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
  MoreHorizontal,
  LayoutGrid,
  List,
  Target,
  Zap,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLedger } from '@/contexts/LedgerContext';
import { cn } from '@/lib/utils';

/**
 * World-Class 2025 Dashboard
 * High-fidelity, premium workshop management cockpit
 */

export default function Dashboard() {
  const { user } = useAuth();
  const { activeLedgerId } = useLedger();
  const { data: ledger } = trpc.ledger.get.useQuery(
    { id: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] font-sans selection:bg-blue-200 antialiased pb-32">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-2xl border-b border-neutral-100 dark:border-neutral-900">
        <div className="container max-w-[1600px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                   <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tighter leading-none">{ledger?.name?.toUpperCase() || "GEARBOX"} <span className="text-blue-600 italic">2026</span></h1>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">{user?.name || "System"} // Workshop Intelligence</p>
                </div>
             </div>
             <div className="hidden lg:flex items-center bg-neutral-100 dark:bg-neutral-900 rounded-2xl px-4 py-2 border border-transparent focus-within:border-blue-500/50 transition-all w-96">
                <Search className="w-4 h-4 text-neutral-400 mr-3" />
                <input className="bg-transparent border-none text-xs font-bold outline-none w-full" placeholder="Search plates, customers, invoices..." />
                <span className="text-[10px] font-black text-neutral-400 bg-white dark:bg-black px-1.5 py-0.5 rounded shadow-sm">⌘K</span>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 p-1 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-neutral-900 text-white rounded-xl shadow-lg">Overview</button>
                <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors">Analytics</button>
                <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors">Bay View</button>
             </div>
             <div className="w-11 h-11 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex items-center justify-center relative hover:shadow-lg transition-all cursor-pointer">
                <Bell className="w-5 h-5" />
                <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black" />
             </div>
             <div className="w-11 h-11 bg-neutral-900 text-white rounded-2xl flex items-center justify-center font-black tracking-tighter italic shadow-xl shadow-neutral-900/20 cursor-pointer">JS</div>
          </div>
        </div>
      </header>

      <main className="container max-w-[1600px] px-6 py-10 space-y-10">
        
        {/* Metric Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: 'Today Revenue', value: '$4,250.00', change: '+12.5%', icon: Wallet, color: 'blue' },
             { label: 'Active Jobs', value: '18', change: '85% Capacity', icon: Wrench, color: 'emerald' },
             { label: 'New Work Auth', value: '12', change: 'avg $240/ea', icon: Shield, color: 'indigo' },
             { label: 'Growth', value: '+24%', change: 'vs last month', icon: TrendingUp, color: 'rose' }
           ].map((metric, i) => (
             <Card key={i} className="group border-none shadow-xl shadow-black/5 bg-white dark:bg-neutral-900 p-8 rounded-[36px] overflow-hidden relative border-b-4 border-transparent hover:border-blue-600 transition-all duration-500">
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity rotate-12">
                   <metric.icon className="w-32 h-32" />
                </div>
                <div className="flex items-start justify-between relative z-10">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">{metric.label}</p>
                      <h3 className="text-4xl font-black tracking-tighter uppercase italic">{metric.value}</h3>
                      <div className="flex items-center gap-2 mt-4 text-[10px] font-black uppercase tracking-widest">
                         <span className={cn(
                           "px-2 py-1 rounded-lg",
                           metric.color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                         )}>{metric.change}</span>
                         <span className="text-neutral-400">{metric.label.toLowerCase().includes('jobs') ? 'Bays full' : 'Real-time'}</span>
                      </div>
                   </div>
                   <div className={cn(
                     "w-14 h-14 rounded-3xl flex items-center justify-center shadow-lg transform group-hover:-rotate-12 transition-transform",
                     metric.color === 'blue' ? 'bg-blue-600 text-white shadow-blue-500/20' :
                     metric.color === 'emerald' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                     metric.color === 'rose' ? 'bg-rose-500 text-white shadow-rose-500/20' :
                     'bg-neutral-900 text-white shadow-neutral-900/20'
                   )}>
                      <metric.icon className="w-7 h-7" />
                   </div>
                </div>
             </Card>
           ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           
           {/* Active Workload Dashboard */}
           <div className="lg:col-span-8 space-y-8">
              <div className="flex items-end justify-between px-2">
                 <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Live Workload</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-2">Managing 8 bays across 1 location</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-2xl h-12 px-6 font-black text-[10px] uppercase tracking-widest border-neutral-100 hover:border-neutral-900">
                       <Filter className="w-3.5 h-3.5 mr-2" /> Filter
                    </Button>
                    <Button className="rounded-2xl h-12 px-6 bg-neutral-900 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-neutral-900/20">
                       <Plus className="w-3.5 h-3.5 mr-2" /> New Job
                    </Button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[1, 2, 3, 4].map(idx => (
                   <Card key={idx} className="border-none shadow-xl shadow-black/5 bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden group">
                      <div className="p-8">
                         <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                               <div className="w-14 h-14 bg-neutral-50 dark:bg-neutral-800 rounded-2xl flex flex-col items-center justify-center font-black italic text-neutral-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm border border-neutral-100">
                                  <Car className="w-7 h-7" />
                               </div>
                               <div>
                                  <h4 className="text-xl font-black tracking-tighter uppercase italic">ABC-12{idx}</h4>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Tesla Model 3 • John S.</p>
                               </div>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[8px] uppercase tracking-widest px-3 py-1">In Progress</Badge>
                         </div>

                         <div className="space-y-6">
                            <div className="p-5 bg-neutral-50 dark:bg-neutral-800 rounded-[24px] border border-neutral-100 dark:border-neutral-700">
                               <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-2">Current Activity</p>
                               <p className="text-sm font-bold truncate italic leading-tight">Brake pad replacement and sensor calibration...</p>
                               <div className="mt-4 flex items-center justify-between">
                                  <div className="flex -space-x-3">
                                     {[1, 2].map(u => (
                                       <div key={u} className="w-8 h-8 rounded-xl bg-neutral-200 border-2 border-white dark:border-neutral-800 flex items-center justify-center text-[10px] font-black">M</div>
                                     ))}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                     <div className="w-2 h-2 rounded-full bg-blue-500" />
                                     <p className="text-[10px] font-black uppercase tracking-widest">65% Done</p>
                                  </div>
                               </div>
                               <div className="mt-2 w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600 w-[65%]" />
                               </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                               <Button variant="outline" className="flex-1 rounded-2xl py-6 font-black text-[9px] uppercase tracking-widest border-neutral-100 hover:border-neutral-900">
                                  Report
                               </Button>
                               <Button className="flex-1 rounded-2xl py-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase tracking-widest border-none shadow-lg shadow-blue-500/20">
                                  Invoice
                               </Button>
                            </div>
                         </div>
                      </div>
                   </Card>
                 ))}
              </div>
           </div>

           {/* Performance Analytics Sidebar */}
           <div className="lg:col-span-4 space-y-8">
              <div className="flex items-end justify-between px-2">
                 <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Insights</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-2">AI-Powered Optimization</p>
                 </div>
                 <button className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline transition-all">View All</button>
              </div>

              <div className="space-y-6">
                 {/* Efficiency Widget */}
                 <Card className="border-none shadow-2xl shadow-blue-900/5 bg-gradient-to-br from-blue-700 to-indigo-900 text-white p-8 rounded-[40px] overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 pointer-events-none">
                       <Zap className="w-48 h-48" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-8 flex items-center gap-2">
                       <Target className="w-3 h-3" /> Workshop Velocity
                    </p>
                    <h3 className="text-5xl font-black tracking-tighter italic mb-2">94%</h3>
                    <p className="text-xs font-bold leading-relaxed opacity-80 max-w-xs mb-8 italic">Your shop is operating at peak efficiency today. Estimated checkout time is 12 mins below average.</p>
                    <div className="flex gap-3">
                       <div className="flex-1 p-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/5">
                          <p className="text-[8px] font-black uppercase tracking-widest text-white/60 mb-1">DVI Upsell</p>
                          <p className="text-xl font-black tracking-tighter">+$1,450</p>
                       </div>
                       <div className="flex-1 p-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/5">
                          <p className="text-[8px] font-black uppercase tracking-widest text-white/60 mb-1">Bay Speed</p>
                          <p className="text-xl font-black tracking-tighter">42m/job</p>
                       </div>
                    </div>
                 </Card>

                 {/* Recent Activity Feed */}
                 <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-neutral-900 rounded-[40px] p-8">
                    <h4 className="text-lg font-black tracking-tighter uppercase italic mb-8">Recent Activity</h4>
                    <div className="space-y-8 relative before:absolute before:inset-0 before:left-3 before:border-l before:border-neutral-100 dark:before:border-neutral-800 before:top-4 before:bottom-4">
                       {[
                         { title: 'Payment Received', desc: 'INV-4421 cleared by Chris S.', time: '2m ago', icon: Wallet },
                         { title: 'New Booking', desc: 'Online portal booking for ABC-123', time: '15m ago', icon: Calendar },
                         { title: 'DVI Completed', desc: 'Inspection approved for Audi RS6', time: '1h ago', icon: Wrench },
                         { title: 'Inventory Alert', desc: 'Castrol 5W-30 low in stock', time: '3h ago', icon: Zap }
                       ].map((item, id) => (
                         <div key={id} className="relative pl-10 group">
                            <div className="absolute left-0 top-1 w-6 h-6 bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-500">
                               <item.icon className="w-3 h-3 group-hover:text-white" />
                            </div>
                            <div className="space-y-0.5">
                               <div className="flex items-center justify-between">
                                  <h5 className="text-xs font-black uppercase tracking-tight">{item.title}</h5>
                                  <span className="text-[9px] font-bold text-neutral-400">{item.time}</span>
                               </div>
                               <p className="text-[10px] font-bold text-neutral-500 italic">{item.desc}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                    <Button variant="link" className="w-full mt-10 text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-blue-600 transition-all">
                       View Full System Audit
                    </Button>
                 </Card>
              </div>
           </div>

        </div>

      </main>

    </div>
  );
}

