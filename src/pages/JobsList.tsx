import { useState } from "react";
import { useLocation } from "wouter";
import { useLedger } from "@/contexts/LedgerContext";
import { trpc } from "@/lib/trpc";
import { 
  Plus, Search, Filter, Wrench, Clock, 
  CheckCircle2, XCircle, FileText, Loader2,
  ArrowRight, DollarSign, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function JobsList() {
  const [, navigate] = useLocation();
  const { activeLedgerId } = useLedger();
  const [searchQuery, setSearchQuery] = useState("");

  if (!activeLedgerId) {
    navigate("/setup/ledger");
    return null;
  }

  const { data: jobs = [], isLoading } = trpc.job.list.useQuery(
    { ledgerId: activeLedgerId },
    { enabled: !!activeLedgerId }
  );

  const statusConfig: Record<string, any> = {
    new: {
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      icon: Clock,
      label: "New",
    },
    quoted: { 
      color: "text-blue-400", 
      bg: "bg-blue-400/10", 
      icon: FileText, 
      label: "Quoted",
    },
    in_progress: { 
      color: "text-primary", 
      bg: "bg-primary/10", 
      icon: Wrench, 
      label: "In Progress",
    },
    waiting_approval: {
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      icon: Clock,
      label: "Awaiting Auth",
    },
    completed: { 
      color: "text-emerald-400", 
      bg: "bg-emerald-400/10", 
      icon: CheckCircle2, 
      label: "Completed",
    },
    closed: {
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      icon: CheckCircle2,
      label: "Closed",
    },
    cancelled: { 
      color: "text-red-400", 
      bg: "bg-red-400/10", 
      icon: XCircle, 
      label: "Cancelled",
    },
  };

  const resolveStatusKey = (status: unknown) => {
    const raw = typeof status === "string" ? status.trim().toLowerCase() : "";
    if (raw === "new") return "new";
    if (raw === "in_progress" || raw === "in progress") return "in_progress";
    if (raw === "waiting_approval" || raw === "waiting approval") return "waiting_approval";
    if (raw === "completed") return "completed";
    if (raw === "closed") return "closed";
    if (raw === "cancelled" || raw === "canceled") return "cancelled";
    if (raw === "quoted" || raw === "draft") return "quoted";
    return "new";
  };

  const filteredJobs = jobs.filter(job => 
    job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-white pb-32">
       <div className="fixed inset-0 pointer-events-none opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,oklch(var(--primary))_0%,transparent_50%)]" />
       </div>

       <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-12 relative z-10">
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-primary rounded-full" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Operational Protocol</p>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
                Workflow <span className="text-primary">Queue.</span>
              </h1>
            </div>
            <Button 
                onClick={() => navigate("/trades/jobs/new")}
                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
            >
                <Plus size={18} className="mr-2" strokeWidth={3} />
                Create Job
            </Button>
          </header>

          <div className="relative mb-10 group">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={20} />
             <Input 
                placeholder="Search jobs, customers, identifiers..."
                className="h-16 pl-16 rounded-2xl bg-card/20 border-white/5 focus:ring-primary/20 text-lg font-medium italic transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>

          {isLoading ? (
             <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Accessing Node Database...</p>
             </div>
          ) : filteredJobs.length === 0 ? (
             <Card className="bg-card/20 border-white/5 rounded-[3rem] p-20 text-center">
                <Wrench size={40} className="mx-auto text-white/10 mb-6" />
                <h3 className="text-xl font-black text-white/60 uppercase tracking-widest italic">No Records Found</h3>
                <p className="text-sm text-white/20 mt-2 font-medium">Try adjusting your filter or create a new operational unit.</p>
             </Card>
          ) : (
             <div className="grid gap-4">
                {filteredJobs.map((job) => {
                   const status = statusConfig[resolveStatusKey(job.status)] || statusConfig.new;
                   const StatusIcon = status.icon;

                   return (
                      <Card 
                         key={job.id} 
                         className="group bg-card/20 border-white/5 hover:bg-card/40 transition-all cursor-pointer rounded-2xl overflow-hidden"
                         onClick={() => navigate(`/trades/jobs/${job.id}`)}
                      >
                         <div className="p-6 flex items-center justify-between gap-6">
                            <div className="flex items-center gap-6 flex-1 min-w-0">
                               <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-white/5", status.bg, status.color)}>
                                  <StatusIcon size={20} />
                               </div>
                               <div className="min-w-0">
                                  <div className="flex items-center gap-3 mb-1">
                                     <span className="text-[10px] font-mono font-black text-white/20 uppercase tracking-widest">#{job.jobNumber}</span>
                                     <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest border-none px-0", status.color)}>
                                       {status.label}
                                     </Badge>
                                  </div>
                                  <h3 className="text-lg font-black text-white truncate group-hover:text-primary transition-colors italic uppercase">{job.description}</h3>
                                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{job.customerName || "Service Walk-in"}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-8">
                               <div className="text-right hidden sm:block">
                                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Value</p>
                                  <p className="text-xl font-black text-white italic tracking-tighter">${(parseFloat(job.quotedPrice as any) || 0).toLocaleString()}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/10 group-hover:bg-primary group-hover:text-black transition-all">
                                   <ChevronRight size={18} />
                                </div>
                            </div>
                         </div>
                      </Card>
                   );
                })}
             </div>
          )}
       </div>
    </div>
  );
}
