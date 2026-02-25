import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLedger } from "@/contexts/LedgerContext";
import { trpc } from "@/lib/trpc";
import { 
  Building2, Car, FileText, Loader2, Plus, Wrench, 
  TrendingUp, Clock, CheckCircle2, AlertCircle, 
  ChevronRight, Calendar, ArrowUpRight, X, Users, BarChart3,
  Search, Filter, LayoutGrid, Activity, Package, Bot
} from "lucide-react";
import { useLocation } from "wouter";
import { LedgerSwitcher } from "@/components/LedgerSwitcher";
import { toast } from "sonner";
import React, { useState } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function TradesDashboard() {
  const { user } = useAuth();
  const { activeLedgerId, activeLedgerType } = useLedger();
  const [, setLocation] = useLocation();
  const [ledgerSwitcherOpen, setLedgerSwitcherOpen] = useState(false);

  const { data: ledger } = trpc.ledger.get.useQuery(
    { id: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const { data: jobs, isLoading: jobsLoading } = trpc.job.list.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const { data: vehicles } = trpc.vehicle.list.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const { data: aiInsights, isLoading: insightsLoading } = trpc.ai.getExecutiveInsights.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );
  
  const { data: automationActions } = trpc.automation.getRecentActions.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const resolveJobStatusKey = (status: unknown) => {
    const raw = typeof status === "string" ? status.trim().toUpperCase() : "";
    if (raw === "NEW") return "NEW";
    if (raw === "IN_PROGRESS" || raw === "IN PROGRESS") return "IN_PROGRESS";
    if (raw === "WAITING_APPROVAL" || raw === "WAITING APPROVAL") return "WAITING_APPROVAL";
    if (raw === "COMPLETED") return "COMPLETED";
    if (raw === "CLOSED") return "CLOSED";
    if (raw === "CANCELLED" || raw === "CANCELED") return "CANCELLED";
    return "NEW";
  };

  const statusConfig: Record<string, any> = {
    NEW: { color: "text-blue-400", bg: "bg-blue-400/10", icon: FileText, label: "New" },
    IN_PROGRESS: { color: "text-primary", bg: "bg-primary/10", icon: Wrench, label: "In Progress" },
    WAITING_APPROVAL: { color: "text-amber-400", bg: "bg-amber-400/10", icon: Clock, label: "Awaiting Action" },
    COMPLETED: { color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2, label: "Completed" },
    CLOSED: { color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2, label: "Closed" },
    CANCELLED: { color: "text-red-400", bg: "bg-red-400/10", icon: X, label: "Cancelled" },
  };

  if (activeLedgerId === null) {
     setLocation("/setup/ledger");
     return null;
  }

  if (jobsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-6">
        <Activity className="animate-pulse text-primary w-12 h-12" />
        <p className="text-[10px] font-black text-muted-foreground tracking-[0.4em] uppercase">Synchronizing Systems...</p>
      </div>
    );
  }

  const activeJobs = jobs?.filter((j) => resolveJobStatusKey(j.status) === "IN_PROGRESS") || [];

  return (
    <div className="min-h-screen bg-background text-white pb-32">
       {/* Background Subtle Gradient */}
       <div className="fixed inset-0 pointer-events-none opacity-20">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
       </div>

       <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12 relative z-10">
          <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-primary rounded-full" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Operational Protocol</p>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
                Workflow <span className="text-primary">Queue.</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
               <LedgerSwitcher />
               <Button 
                  onClick={() => setLocation("/trades/jobs/new")}
                  className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
               >
                  <Plus size={18} className="mr-2" strokeWidth={3} />
                  New Job
               </Button>
            </div>
          </header>

          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-10">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                    { label: "Active Revenue", value: `$${(activeJobs.reduce((acc, j) => acc + (parseFloat(j.quotedPrice as any) || 0), 0)).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
                    { label: "Workshop Load", value: `${activeJobs.length} Units`, icon: Activity, color: "text-primary" },
                    { label: "New Auth", value: jobs?.filter(j => j.status === "WAITING_APPROVAL").length || 0, icon: Clock, color: "text-amber-400" },
                    { label: "Asset Count", value: vehicles?.length || 0, icon: Car, color: "text-blue-400" }
                 ].map((m, i) => (
                    <Card key={i} className="bg-card/30 border-white/5 backdrop-blur-xl rounded-[2rem] p-6 hover:bg-card/50 transition-colors">
                       <m.icon size={20} className={cn("mb-4", m.color)} />
                       <p className="text-2xl font-black tracking-tighter text-white">{m.value}</p>
                       <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">{m.label}</p>
                    </Card>
                 ))}
              </div>

              {/* Workflow Protocol */}
              <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                      <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Primary Workflow Protocol</h2>
                      <Button variant="link" onClick={() => setLocation("/trades/jobs")} className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary p-0 h-auto">
                        View Full Ledger
                      </Button>
                  </div>

                  <div className="grid gap-4">
                    {activeJobs.map((job) => {
                      const status = statusConfig[resolveJobStatusKey(job.status)] || statusConfig.IN_PROGRESS;
                      const StatusIcon = status.icon;

                      return (
                        <Card 
                          key={job.id} 
                          className="group bg-card/20 border-white/5 backdrop-blur-md hover:bg-card/40 transition-all cursor-pointer rounded-[2rem]"
                          onClick={() => setLocation(`/trades/jobs/${job.id}`)}
                        >
                          <div className="p-6 flex items-center justify-between gap-6">
                             <div className="flex items-center gap-6 flex-1 min-w-0">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5", status.bg, status.color)}>
                                   <StatusIcon size={24} />
                                </div>
                                <div className="min-w-0">
                                   <div className="flex items-center gap-3 mb-1">
                                      <span className="text-[10px] font-mono font-black text-white/20 uppercase tracking-widest">#{job.jobNumber}</span>
                                      <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-current", status.bg, status.color)}>
                                        {status.label}
                                      </span>
                                   </div>
                                   <h3 className="text-xl font-black text-white truncate group-hover:text-primary transition-colors italic uppercase">{job.description}</h3>
                                   <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{job.customerName || "Service Walk-in"}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-10">
                                <div className="text-right hidden sm:block">
                                   <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Quoted Value</p>
                                   <p className="text-2xl font-black text-white italic tracking-tighter">${(parseFloat(job.quotedPrice as any) || 0).toLocaleString()}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/10 group-hover:bg-primary group-hover:text-black transition-all">
                                   <ChevronRight size={18} />
                                </div>
                             </div>
                          </div>
                        </Card>
                      );
                    })}
                    {activeJobs.length === 0 && (
                      <div className="py-20 text-center glass rounded-[3rem] border-dashed border-2 border-white/5">
                         <Wrench size={32} className="mx-auto text-white/5 mb-4" />
                         <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">No active operational units</p>
                      </div>
                    )}
                  </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-10">
               {/* AI Intelligence Card */}
               <Card className="bg-gradient-to-br from-primary/10 to-transparent border-white/5 rounded-[2.5rem] p-8 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Bot size={100} />
                  </div>
                  <div className="relative space-y-6">
                    <div className="flex items-center gap-3">
                       <Bot size={16} className="text-primary" />
                       <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Neural Insights</h3>
                    </div>
                    {insightsLoading ? (
                       <div className="space-y-4">
                          {[1, 2].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}
                       </div>
                    ) : (
                       <div className="space-y-6">
                          {aiInsights?.insights.slice(0, 2).map((insight: any, i: number) => (
                             <div key={i} className="space-y-2">
                                <h4 className="text-[11px] font-black text-white uppercase tracking-tight flex items-center gap-2 italic">
                                   <div className={cn("w-1.5 h-1.5 rounded-full", insight.type === 'opportunity' ? "bg-emerald-500" : "bg-blue-500")} />
                                   {insight.title}
                                </h4>
                                <p className="text-[11px] text-white/50 leading-relaxed font-medium">{insight.description}</p>
                             </div>
                          ))}
                       </div>
                    )}
                  </div>
               </Card>

               {/* Automation Events */}
               <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 px-2">Operational Events</h3>
                  <div className="space-y-3">
                     {automationActions?.slice(0, 3).map((act: any) => (
                        <div key={act.id} className="p-4 rounded-2xl bg-card/20 border border-white/5 hover:bg-card/40 transition-colors">
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-[8px] font-black text-primary uppercase tracking-widest">{act.type}</span>
                              <span className="text-[8px] font-bold text-white/10 uppercase">Recap</span>
                           </div>
                           <p className="text-[11px] font-black text-white uppercase italic tracking-tight">{act.action}</p>
                           <p className="text-[10px] text-white/30 truncate uppercase tracking-tighter mt-1">{act.result}</p>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Quick Commands */}
               <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" onClick={() => setLocation("/bookings")} className="h-12 rounded-xl bg-card/5 border-white/5 font-black uppercase tracking-widest text-[9px] hover:bg-primary transition-all">
                    Access Scheduler
                  </Button>
                  <Button variant="outline" onClick={() => setLocation("/trades/inventory")} className="h-12 rounded-xl bg-card/5 border-white/5 font-black uppercase tracking-widest text-[9px] hover:bg-primary transition-all">
                    Review Stock List
                  </Button>
               </div>
            </div>
          </div>
       </div>
    </div>
  );
}
