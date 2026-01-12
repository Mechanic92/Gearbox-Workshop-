import React, { useState } from 'react';
import { 
  Car, 
  History, 
  CreditCard, 
  Calendar, 
  FileText, 
  ChevronRight, 
  ShieldCheck, 
  Download, 
  Star,
  Wrench,
  CheckCircle2,
  Clock,
  ArrowRight,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Premium Customer Portal
 * "The Digital Garage" - One-stop shop for everything vehicle-related
 */

export default function CustomerPortal() {
  const [activeTab, setActiveTab] = useState<'garage' | 'history' | 'billing'>('garage');

  // Mock data for 2025 aesthetic
  const vehicles = [
    { rego: 'GRB0X1', make: 'Tesla', model: 'Model 3', year: 2024, lastService: '2 Months ago', nextService: 'Dec 2025' },
    { rego: 'WKS0FT', make: 'Audi', model: 'RS6', year: 2023, lastService: '1 Month ago', nextService: 'Nov 2025' }
  ];

  const upcomingAppointments = [
    { date: 'Oct 15, 2025', time: '09:00 AM', service: 'Wheel Alignment', status: 'Confirmed' }
  ];

  const invoices = [
    { id: 'INV-4402', date: 'Sept 20, 2025', amount: 425.00, status: 'Paid', vehicle: 'GRB0X1' },
    { id: 'INV-4391', date: 'Aug 12, 2025', amount: 1250.80, status: 'Overdue', vehicle: 'WKS0FT' }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans antialiased">
      {/* Dynamic Header */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-50">
        <div className="container max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-black italic">G</div>
             <h1 className="text-lg font-black tracking-tighter uppercase italic">My Digital Garage</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 leading-none">Logged in as</p>
                <p className="text-xs font-black uppercase tracking-tight">Chris Stevens</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden cursor-pointer">
                <User className="w-5 h-5 text-neutral-400" />
             </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="container max-w-6xl px-4 flex gap-8">
           {[
             { id: 'garage', label: 'My Garage', icon: Car },
             { id: 'history', label: 'Service History', icon: History },
             { id: 'billing', label: 'Payments', icon: CreditCard }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={cn(
                 "flex items-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative",
                 activeTab === tab.id ? "text-blue-600" : "text-neutral-400 hover:text-neutral-900"
               )}
             >
               <tab.icon className="w-4 h-4" />
               {tab.label}
               {activeTab === tab.id && (
                 <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full shadow-lg shadow-blue-500/50" />
               )}
             </button>
           ))}
        </div>
      </header>

      <main className="container max-w-6xl px-4 py-12 space-y-12">
        
        {activeTab === 'garage' && (
          <>
            {/* Garage Hero */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Your Fleet <br/><span className="text-blue-600">Overview</span></h2>
                <p className="text-neutral-500 font-medium max-w-md">Everything you need to keep your vehicles in peak condition. Track services, inspections, and upcoming bookings.</p>
                <Button className="bg-neutral-900 border-2 border-neutral-900 hover:bg-white hover:text-neutral-900 text-white font-black py-8 px-10 rounded-2xl text-xs uppercase tracking-widest transition-all">
                  Book New Service <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Upcoming Appointment Card */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <Card className="relative bg-white border-none shadow-sm p-8 rounded-[32px] flex items-center justify-between">
                   <div className="space-y-1">
                      <Badge className="bg-blue-600 text-white border-none text-[8px] font-black tracking-widest mb-2">UPCOMING APPOINTMENT</Badge>
                      <h3 className="text-2xl font-black tracking-tighter uppercase italic">{upcomingAppointments[0].service}</h3>
                      <div className="flex items-center gap-4 mt-4">
                         <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                            <span className="text-xs font-bold">{upcomingAppointments[0].date}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-neutral-400" />
                            <span className="text-xs font-bold">{upcomingAppointments[0].time}</span>
                         </div>
                      </div>
                   </div>
                   <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-blue-600" />
                   </div>
                </Card>
              </div>
            </section>

            {/* Vehicle Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {vehicles.map(v => (
                <Card key={v.rego} className="border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[40px] overflow-hidden bg-white group">
                   <div className="p-10 flex flex-col justify-between h-full space-y-8">
                      <div className="flex items-start justify-between">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{v.make} {v.model}</p>
                            <h3 className="text-4xl font-black tracking-tighter uppercase italic">{v.rego}</h3>
                         </div>
                         <div className="w-14 h-14 bg-neutral-50 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                            <Car className="w-7 h-7 text-neutral-900" />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 rounded-3xl bg-neutral-50 border border-neutral-100">
                            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-1">Status</p>
                            <p className="text-xs font-black uppercase tracking-tight text-green-600 flex items-center gap-1">
                               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> All Good
                            </p>
                         </div>
                         <div className="p-4 rounded-3xl bg-neutral-50 border border-neutral-100">
                            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-1">Next Service</p>
                            <p className="text-xs font-black uppercase tracking-tight">{v.nextService}</p>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <Button className="w-full bg-neutral-900 text-white font-black py-6 rounded-2xl text-[10px] uppercase tracking-widest">
                            View Full Report
                         </Button>
                         <Button variant="outline" className="w-full border-2 text-neutral-900 border-neutral-100 hover:border-neutral-900 font-black py-6 rounded-2xl text-[10px] uppercase tracking-widest">
                            Book Maintenance
                         </Button>
                      </div>
                   </div>
                </Card>
              ))}
            </section>
          </>
        )}

        {/**
         * Service History Tab
         */}
        {activeTab === 'history' && (
          <section className="space-y-8 animate-in fade-in duration-500">
             <div className="flex items-end justify-between">
                <div>
                   <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Service <span className="text-blue-600">History</span></h2>
                   <p className="text-neutral-400 font-bold uppercase tracking-widest text-[10px] mt-2">Past Maintenance & Inspections</p>
                </div>
                <Button variant="outline" className="rounded-full px-6 py-6 font-black text-[10px] uppercase tracking-widest border-neutral-200">
                   <Download className="w-4 h-4 mr-2" /> Export PDF
                </Button>
             </div>

             <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="group border-none shadow-sm hover:shadow-lg transition-all rounded-[32px] p-8 flex items-center justify-between bg-white overflow-hidden relative">
                     <div className="flex items-center gap-8 relative z-10">
                        <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex flex-col items-center justify-center text-neutral-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                           <History className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Sept 12, 2025 — Job #4402</p>
                           <h4 className="text-xl font-black tracking-tighter uppercase italic">Major Annual Service & WOF</h4>
                           <div className="flex items-center gap-2">
                              <Badge className="bg-green-500/10 text-green-600 border-none font-black text-[8px] uppercase tracking-widest">Success</Badge>
                              <p className="text-xs font-bold text-neutral-500">Performed on GRB0X1</p>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 relative z-10">
                        <div className="text-right mr-4">
                           <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Total Charged</p>
                           <p className="text-lg font-black tracking-tighter">$842.00</p>
                        </div>
                        <Button variant="outline" className="w-12 h-12 rounded-2xl border-neutral-100 flex items-center justify-center p-0 transition-transform group-hover:translate-x-1">
                           <ChevronRight className="w-5 h-5 text-neutral-900" />
                        </Button>
                     </div>
                  </Card>
                ))}
             </div>
          </section>
        )}

        {/**
         * Billing Tab
         */}
        {activeTab === 'billing' && (
          <section className="space-y-12 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-8 bg-neutral-900 text-white border-none rounded-[32px] shadow-2xl shadow-neutral-900/20">
                   <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Total Outstanding</p>
                   <h3 className="text-5xl font-black tracking-tighter italic mb-4">$1,250.80</h3>
                   <Button className="w-full bg-white text-neutral-900 hover:bg-neutral-100 font-black py-6 rounded-2xl text-[10px] uppercase tracking-widest">
                      Pay All Now
                   </Button>
                </Card>
                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                   <Card className="p-8 bg-blue-600 text-white border-none rounded-[32px] shadow-2xl shadow-blue-500/20">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Total Savings (2025)</p>
                      <h3 className="text-4xl font-black tracking-tighter italic">$242.00</h3>
                      <p className="text-xs font-bold text-white/80 mt-2 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> Gold Member status
                      </p>
                   </Card>
                   <Card className="p-8 bg-white border border-neutral-100 rounded-[32px] shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Saved Payment Method</p>
                      <div className="flex items-center gap-3 mt-4">
                         <div className="w-12 h-8 bg-neutral-100 rounded flex items-center justify-center font-bold text-[8px] uppercase">VISA</div>
                         <p className="text-sm font-black italic uppercase tracking-tighter">•••• 5821</p>
                      </div>
                   </Card>
                </div>
             </div>

             <div className="space-y-6">
                <h3 className="text-xl font-black tracking-tighter uppercase italic">Recent Invoices</h3>
                <div className="space-y-4">
                   {invoices.map(inv => (
                     <div key={inv.id} className="flex flex-col md:flex-row items-center justify-between p-8 bg-white rounded-[32px] shadow-sm border border-neutral-50 hover:border-blue-200 transition-all group">
                        <div className="flex items-center gap-6">
                           <div className={cn(
                             "w-14 h-14 rounded-2xl flex items-center justify-center",
                             inv.status === 'Paid' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                           )}>
                              <FileText className="w-6 h-6" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{inv.id} — {inv.date}</p>
                              <h4 className="text-lg font-black tracking-tighter uppercase italic">Vehicle Maintenance: {inv.vehicle}</h4>
                           </div>
                        </div>
                        <div className="flex items-center gap-8 mt-4 md:mt-0">
                           <div className="text-right">
                              <p className="text-xl font-black tracking-tighter">${inv.amount.toFixed(2)}</p>
                              <Badge className={cn(
                                "mt-1 border-none font-black text-[8px] uppercase tracking-widest",
                                inv.status === 'Paid' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                              )}>{inv.status}</Badge>
                           </div>
                           <Button variant="outline" className="rounded-full w-12 h-12 p-0 border-neutral-100 group-hover:border-neutral-900 group-hover:translate-x-1 transition-all">
                              <Download className="w-4 h-4" />
                           </Button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </section>
        )}
        
      </main>

      {/* Security Footer */}
      <footer className="container max-w-6xl px-4 py-12 border-t border-neutral-200 mt-12">
         <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 text-neutral-400 bg-white px-6 py-3 rounded-full border border-neutral-100 shadow-sm">
               <ShieldCheck className="w-5 h-5 text-green-500" />
               <p className="text-[10px] font-black uppercase tracking-widest">Secure 256-bit Encrypted Connection</p>
            </div>
            <div className="flex gap-8">
               <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 cursor-pointer transition-colors">Safety Portal</span>
               <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 cursor-pointer transition-colors">Privacy Policy</span>
               <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 cursor-pointer transition-colors">Term of Service</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
