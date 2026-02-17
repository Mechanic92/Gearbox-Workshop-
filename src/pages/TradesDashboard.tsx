import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLedger } from "@/contexts/LedgerContext";
import { trpc } from "@/lib/trpc";
import { 
  Building2, Car, FileText, Loader2, Plus, Wrench, 
  TrendingUp, Clock, CheckCircle2, AlertCircle, 
  ChevronRight, Calendar, ArrowUpRight, X, Users, BarChart3,
  Search, Filter, LayoutGrid, Zap, Package
} from "lucide-react";
import { useLocation } from "wouter";
import { LedgerSwitcher } from "@/components/LedgerSwitcher";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";


export default function TradesDashboard() {
  const { user } = useAuth();
  const { activeLedgerId, activeLedgerType } = useLedger();
  const { data: ledger } = trpc.ledger.get.useQuery(
    { id: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );
  const [, setLocation] = useLocation();
  const [ledgerSwitcherOpen, setLedgerSwitcherOpen] = useState(false);

  const resolveJobStatusKey = (status: unknown) => {
    const raw = typeof status === "string" ? status : "";
    const normalized = raw.trim().toUpperCase();
    if (normalized === "NEW") return "NEW";
    if (normalized === "IN_PROGRESS" || normalized === "IN PROGRESS") return "IN_PROGRESS";
    if (normalized === "WAITING_APPROVAL" || normalized === "WAITING APPROVAL") return "WAITING_APPROVAL";
    if (normalized === "COMPLETED") return "COMPLETED";
    if (normalized === "CLOSED") return "CLOSED";
    if (normalized === "CANCELLED" || normalized === "CANCELED") return "CANCELLED";
    if (normalized === "QUOTED" || normalized === "DRAFT") return "QUOTED";
    return "NEW";
  };

  // Wait for ledger context to initialize from localStorage
  if (activeLedgerId === null || activeLedgerType === null) {
    // Not loaded yet - show loading
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-6">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-white/5 border-t-primary rounded-full animate-spin" />
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary w-8 h-8 fill-primary" />
        </div>
        <p className="text-sm font-black text-muted-foreground animate-pulse tracking-[0.4em] uppercase">Loading Dashboard...</p>
      </div>
    );
  }

  if (activeLedgerType !== "trades") {
    setLocation("/setup/ledger");
    return null;
  }

  const { data: jobs, isLoading: jobsLoading } = trpc.job.list.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const { data: vehicles } = trpc.vehicle.list.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const { data: stats } = trpc.analytics.getDashboardStats.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const { data: aiInsights } = trpc.ai.getExecutiveInsights.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const activeJobs = jobs?.filter((j) => resolveJobStatusKey((j as any).status) === "IN_PROGRESS") || [];
  const completedJobs = jobs?.filter((j) => resolveJobStatusKey((j as any).status) === "COMPLETED") || [];
  const quotedJobs = jobs?.filter((j) => resolveJobStatusKey((j as any).status) === "NEW") || [];

  if (jobsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-6">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-white/5 border-t-primary rounded-full animate-spin" />
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary w-8 h-8 fill-primary" />
        </div>
        <p className="text-sm font-black text-muted-foreground animate-pulse tracking-[0.4em] uppercase">Synchronizing Systems...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-32 overflow-x-hidden">
      {/* Universal Command Header */}
      <header className="sticky top-0 z-30 glass shadow-2xl">
        <div className="container py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-card text-foreground flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] group hover:scale-110 transition-transform">
                <Zap size={28} className="fill-current" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">{ledger?.name?.toUpperCase() || "COMMAND CENTER"}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_oklch(var(--primary))]" />
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">GEARBOX 2026 // {user?.name}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <Button 
                variant="ghost" 
                className="hidden md:flex font-black uppercase tracking-widest text-[10px] hover:bg-card/5 border border-white/10 rounded-xl px-6 h-12"
                onClick={() => setLedgerSwitcherOpen(true)}
             >
                Switch Identity
             </Button>
             <Button 
                className="shadow-[0_15px_30px_rgba(0,0,0,0.3)] bg-card text-foreground hover:bg-primary hover:text-white transition-all duration-500 font-black uppercase tracking-widest text-[10px] rounded-xl px-8 h-12"
                onClick={() => setLocation("/trades/jobs/new")}
             >
                <Plus className="w-4 h-4 mr-2" strokeWidth={3} /> Register Job
             </Button>
          </div>
          <LedgerSwitcher open={ledgerSwitcherOpen} onOpenChange={setLedgerSwitcherOpen} />
        </div>
      </header>

      <div className="container py-12 space-y-16">
        {/* AI Executive Insights */}
        {aiInsights && aiInsights.insights.length > 0 && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-1000">
             <div className="glass rounded-[3rem] p-8 border-l-4 border-primary overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Zap className="w-48 h-48 text-primary" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                   <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/20">
                      <Zap className="w-8 h-8 text-primary fill-current" />
                   </div>
                   <div className="flex-1 space-y-4">
                      <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Executive Intelligence Briefing</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {aiInsights.insights.map((insight: any, idx: number) => (
                            <div key={idx} className="flex-1 min-w-[300px] flex items-center justify-between gap-6 p-6 rounded-3xl bg-card/5 border border-white/5 group/insight">
                               <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                     <p className="text-sm font-black uppercase italic tracking-tighter text-white">{insight.title}</p>
                                     {insight.impact === 'high' && <Badge className="bg-red-500 text-white border-none text-[8px] uppercase tracking-widest font-black animate-pulse">Critical Input</Badge>}
                                  </div>
                                  <p className="text-xs text-white/50 font-medium leading-relaxed">{insight.description}</p>
                               </div>
                               <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-10 rounded-xl font-black text-[9px] uppercase tracking-widest border-white/10 group-hover/insight:bg-primary group-hover/insight:text-white transition-all"
                                onClick={() => {
                                    if (insight.type === 'maintenance') {
                                        toast.info("Initializing Predictive Maintenance Scan...");
                                        // Logic to navigate or trigger scan
                                    } else {
                                        toast.success("Command Executed: Syncing with Accounting Node");
                                    }
                                }}
                               >
                                   {insight.type === 'maintenance' ? 'Command' : 'Engage'}
                               </Button>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </section>
        )}

        {/* KPI Scorecards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                { label: "Active Operations", val: stats?.activeOperations ?? 0, icon: Wrench, color: "text-primary", bg: "bg-primary/10", tag: "Live" },
                { label: "Pending Approval", val: stats?.pendingQuotes ?? 0, icon: FileText, color: "text-blue-400", bg: "bg-blue-400/10", tag: "Quotes" },
                { label: "Inventory Alert", val: stats?.lowStockItems ?? 0, icon: Package, color: "text-amber-400", bg: "bg-amber-400/10", tag: "Low Stock" }
            ].map((stat, i) => (
                <div key={i} className="group relative p-[1px] rounded-[2.5rem] bg-card/5 hover:bg-gradient-to-br from-white/20 to-transparent transition-all duration-500 premium-shadow">
                    <Card className="border-none glass-dark rounded-[2.4rem] overflow-hidden">
                        <CardContent className="p-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5", stat.bg, stat.color)}>
                                    <stat.icon size={28} />
                                </div>
                                <span className={cn("text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full", stat.bg, stat.color)}>
                                    {stat.tag}
                                </span>
                            </div>
                            <div className="text-7xl font-black tracking-tighter text-white group-hover:scale-105 transition-transform duration-700 origin-left">{stat.val.toString().padStart(2, '0')}</div>
                            <p className="text-xs font-black text-white/30 uppercase tracking-[0.2em] mt-4">{stat.label}</p>
                        </CardContent>
                    </Card>
                </div>
            ))}
        </section>


        <div className="grid lg:grid-cols-3 gap-16">
          {/* Work Intel Feed */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between px-4">
                <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white flex items-center gap-3">
                    <Zap className="w-6 h-6 text-primary fill-primary" />
                    System Feed
                </h2>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0 hover:bg-card/5"><Search size={18} /></Button>
                    <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0 hover:bg-card/5"><Filter size={18} /></Button>
                </div>
            </div>

            {!jobs || jobs.length === 0 ? (
               <div className="py-24 text-center glass rounded-[4rem] border-2 border-dashed border-white/5">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-card/5 flex items-center justify-center mx-auto mb-8 border border-white/10">
                        <Wrench className="w-10 h-10 text-white/20" />
                    </div>
                    <h3 className="text-3xl font-black tracking-tighter text-white mb-3 italic">System Idle.</h3>
                    <p className="text-muted-foreground font-medium max-w-xs mx-auto mb-10">Initialize your first operational sequence to begin tracking.</p>
                    <Button onClick={() => setLocation("/trades/jobs/new")} className="h-16 px-12 rounded-full bg-card text-foreground font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all">
                        Launch Initial Sequence
                    </Button>
               </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {jobs.slice(0, 8).map((job) => {
                        const statusConfig = {
                            NEW: { color: "text-blue-400", bg: "bg-blue-400/10", icon: FileText, label: "New" },
                            IN_PROGRESS: { color: "text-primary", bg: "bg-primary/10", icon: Wrench, label: "In Progress" },
                            WAITING_APPROVAL: { color: "text-blue-400", bg: "bg-blue-400/10", icon: FileText, label: "Waiting Approval" },
                            COMPLETED: { color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2, label: "Completed" },
                            CLOSED: { color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2, label: "Closed" },
                            CANCELLED: { color: "text-red-400", bg: "bg-red-400/10", icon: X, label: "Cancelled" },
                        };
                        const statusKey = resolveJobStatusKey((job as any).status) as keyof typeof statusConfig;
                        const config = statusConfig[statusKey] || statusConfig.IN_PROGRESS;
                        
                        return (
                            <div 
                                key={job.id} 
                                className="group relative glass hover:bg-card/5 transition-all duration-500 cursor-pointer rounded-[2.5rem] overflow-hidden border-none"
                                onClick={() => setLocation(`/trades/jobs/${job.id}`)}
                            >
                                <div className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                                    <div className="flex items-start gap-6">
                                        <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center border border-white/5", config.bg, config.color)}>
                                            <config.icon size={32} strokeWidth={2.5} />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black tracking-[0.2em] opacity-30 text-white">#{job.jobNumber}</span>
                                                <span className={cn("text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full", config.bg, config.color)}>
                                                    {config.label}
                                                </span>
                                            </div>
                                            <h4 className="text-2xl font-black tracking-tighter text-white group-hover:text-primary transition-colors italic">{job.description}</h4>
                                            <div className="flex items-center gap-2 text-white/40">
                                                <Users size={14} className="text-primary" />
                                                <span className="text-xs font-black uppercase tracking-widest">{job.customerName || "External Node"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-4 border-t sm:border-t-0 border-white/5 pt-6 sm:pt-0">
                                        <div className="text-4xl font-black tracking-tighter text-white group-hover:scale-110 transition-transform">
                                            ${((job.quotedPrice as any) as number).toLocaleString()}
                                        </div>
                                        <Button variant="ghost" className="rounded-full w-10 h-10 p-0 hover:bg-primary hover:text-white transition-all">
                                            <ChevronRight size={20} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-12">
            <div className="glass rounded-[3rem] p-8 space-y-8 premium-shadow">
                <header className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Fleet Intelligence</h3>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_oklch(var(--emerald-500))]" />
                </header>
                
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/20">
                        <Car size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-5xl font-black tracking-tighter text-white">{(vehicles?.length || 0).toString().padStart(2, '0')}</div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Active Assets</p>
                    </div>
                </div>
                
                <Button 
                    className="w-full h-16 rounded-2xl bg-card/5 border border-white/10 font-bold hover:bg-primary hover:border-primary transition-all duration-500 text-xs uppercase tracking-widest"
                    onClick={() => setLocation("/trades/vehicles/new")}
                >
                    Register Asset
                </Button>
            </div>

            <div className="glass rounded-[3rem] p-8 space-y-8">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Quick Access</h3>
                <div className="grid grid-cols-1 gap-4">
                    {[
                        { label: "Revenue Matrix", icon: BarChart3, path: "/trades/reports", desc: "Financial Intelligence" },
                        { label: "Bookings Hub", icon: Calendar, path: "/bookings", desc: "Operational Schedule" },
                    ].map((btn, i) => (
                        <button 
                            key={i}
                            onClick={() => setLocation(btn.path)}
                            className="flex items-center gap-4 p-5 rounded-[2rem] bg-card/5 hover:bg-primary group transition-all duration-500 text-left"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-card/5 flex items-center justify-center group-hover:bg-card/20 transition-colors">
                                <btn.icon size={20} className="text-white group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-white uppercase tracking-tight">{btn.label}</p>
                                <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold group-hover:text-foreground/60">{btn.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
