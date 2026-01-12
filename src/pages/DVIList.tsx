import { useState } from "react";
import { useLocation } from "wouter";
import { useLedger } from "@/contexts/LedgerContext";
import { trpc } from "@/lib/trpc";
import { 
  Plus, Search, CheckSquare, Loader2,
  AlertCircle, CheckCircle2, Clock, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function DVIList() {
  const [, navigate] = useLocation();
  const { activeLedgerId } = useLedger();
  const [searchQuery, setSearchQuery] = useState("");

  // Note: This would need a ledger-wide DVI list endpoint
  // For now, showing placeholder structure
  const isLoading = false;
  const inspections: any[] = [];

  const statusConfig = {
    in_progress: {
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      icon: Clock,
      label: "In Progress",
      glow: "shadow-[0_0_20px_rgba(250,204,21,0.3)]"
    },
    completed: {
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      icon: CheckCircle2,
      label: "Completed",
      glow: "shadow-[0_0_20px_rgba(52,211,153,0.3)]"
    },
    shared: {
      color: "text-primary",
      bg: "bg-primary/10",
      icon: Share2,
      label: "Shared",
      glow: "shadow-[0_0_20px_oklch(var(--primary)/0.3)]"
    },
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[200px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-white mb-3">
              Inspection <span className="text-primary italic">Protocol.</span>
            </h1>
            <p className="text-white/50 font-medium text-lg">
              Digital vehicle inspection management and customer approval workflow
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <Input
              placeholder="Search inspections, vehicles, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-16 pl-16 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-2xl font-medium text-base"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : inspections.length === 0 ? (
          <Card className="border-none glass p-16 text-center rounded-[3rem]">
            <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto mb-6">
              <CheckSquare size={40} className="text-white/20" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">No Inspections Yet</h3>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              Digital Vehicle Inspections (DVIs) are created from individual jobs. Navigate to a job to start an inspection.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate("/trades/jobs")}
                variant="outline"
                className="h-14 px-10 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold"
              >
                View Jobs
              </Button>
              <Button
                onClick={() => navigate("/trades/dashboard")}
                className="h-14 px-10 rounded-2xl font-bold"
              >
                Go to Dashboard
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6">
            {inspections.map((inspection) => {
              const status = statusConfig[inspection.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <Card
                  key={inspection.id}
                  onClick={() => navigate(`/trades/jobs/${inspection.jobId}/dvi`)}
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
                          <div className="text-white/30 font-mono text-sm">#{inspection.inspectionNumber}</div>
                        </div>

                        <h3 className="text-2xl font-black text-white mb-2 group-hover:text-primary transition-colors">
                          {inspection.vehicleRego || "Vehicle Inspection"}
                        </h3>

                        <div className="flex items-center gap-6 text-white/50 text-sm font-medium">
                          {inspection.customerName && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              {inspection.customerName}
                            </div>
                          )}
                          {inspection.createdAt && (
                            <div className="flex items-center gap-2">
                              <Clock size={14} />
                              {new Date(inspection.createdAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-12 p-8 rounded-[2rem] glass border border-primary/20">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={28} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2">DVI Workflow</h3>
              <p className="text-white/60 font-medium leading-relaxed">
                Digital Vehicle Inspections are created from the job detail page. Navigate to an active job, 
                then use the "Start DVI" button to begin a comprehensive vehicle inspection with photo/video capture.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
