import { useState } from "react";
import { useLocation } from "wouter";
import { useLedger } from "@/contexts/LedgerContext";
import { trpc } from "@/lib/trpc";
import { 
  Plus, Search, Filter, Wrench, Clock, 
  CheckCircle2, XCircle, FileText, Loader2,
  ArrowRight, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

  const statusConfig = {
    quoted: { 
      color: "text-blue-400", 
      bg: "bg-blue-400/10", 
      icon: FileText, 
      label: "Quoted",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]"
    },
    in_progress: { 
      color: "text-primary", 
      bg: "bg-primary/10", 
      icon: Wrench, 
      label: "In Progress",
      glow: "shadow-[0_0_20px_oklch(var(--primary)/0.3)]"
    },
    completed: { 
      color: "text-emerald-400", 
      bg: "bg-emerald-400/10", 
      icon: CheckCircle2, 
      label: "Completed",
      glow: "shadow-[0_0_20px_rgba(52,211,153,0.3)]"
    },
    cancelled: { 
      color: "text-red-400", 
      bg: "bg-red-400/10", 
      icon: XCircle, 
      label: "Cancelled",
      glow: "shadow-[0_0_20px_rgba(248,113,113,0.3)]"
    },
  };

  const filteredJobs = jobs.filter(job => 
    job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[200px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-white mb-3">
              Workflow <span className="text-primary italic">Protocol.</span>
            </h1>
            <p className="text-white/50 font-medium text-lg">
              Active job management and execution tracking
            </p>
          </div>
          <Button
            onClick={() => navigate("/trades/jobs/new")}
            className="h-16 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_0_40px_oklch(var(--primary)/0.3)] hover:scale-105 transition-transform"
          >
            <Plus size={20} className="mr-2" />
            New Job
          </Button>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <Input
              placeholder="Search jobs, customers, job numbers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-16 pl-16 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-2xl font-medium text-base"
            />
          </div>
          <Button
            variant="outline"
            className="h-16 px-8 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold"
          >
            <Filter size={20} className="mr-2" />
            Filter
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="border-none glass p-16 text-center rounded-[3rem]">
            <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Wrench size={40} className="text-white/20" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">No Jobs Found</h3>
            <p className="text-white/50 mb-8">
              {searchQuery ? "Try adjusting your search criteria" : "Create your first job to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => navigate("/trades/jobs/new")}
                className="h-14 px-10 rounded-2xl font-bold"
              >
                <Plus size={18} className="mr-2" />
                Create First Job
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredJobs.map((job) => {
              const status = statusConfig[job.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <Card
                  key={job.id}
                  onClick={() => navigate(`/trades/jobs/${job.id}`)}
                  className={cn(
                    "border-none glass hover:bg-white/10 transition-all duration-500 cursor-pointer rounded-[2rem] overflow-hidden group",
                    status.glow
                  )}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={cn("px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest", status.bg, status.color)}>
                            <StatusIcon size={14} className="inline mr-2" />
                            {status.label}
                          </div>
                          <div className="text-white/30 font-mono text-sm">#{job.jobNumber}</div>
                        </div>

                        <h3 className="text-2xl font-black text-white mb-2 group-hover:text-primary transition-colors">
                          {job.description}
                        </h3>

                        <div className="flex items-center gap-6 text-white/50 text-sm font-medium">
                          {job.customerName && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              {job.customerName}
                            </div>
                          )}
                          {job.createdAt && (
                            <div className="flex items-center gap-2">
                              <Clock size={14} />
                              {new Date(job.createdAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-4">
                        <div className="text-right">
                          <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">
                            Quoted
                          </div>
                          <div className="text-3xl font-black text-white flex items-center gap-2">
                            <DollarSign size={24} className="text-primary" />
                            {(parseFloat(job.quotedPrice as any) || 0).toFixed(2)}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          className="h-12 px-6 rounded-xl bg-white/5 hover:bg-primary/20 font-bold group-hover:bg-primary group-hover:text-black transition-all"
                        >
                          View Details
                          <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
