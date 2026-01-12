import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProfitSpeedometer } from "@/components/ProfitSpeedometer";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, Loader2, Plus, Trash2, 
  Wrench, Package, Cpu, ChevronRight, 
  Receipt, Share2, ClipboardCheck, Clock, TrendingUp
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function JobDetail() {
  const params = useParams<{ id: string }>();
  const jobId = params.id ? parseInt(params.id, 10) : null;
  const [, setLocation] = useLocation();
  const [addCostOpen, setAddCostOpen] = useState(false);

  const { data, isLoading, refetch } = trpc.job.getWithCosts.useQuery(
    { id: jobId! },
    { enabled: !!jobId }
  );

  const addCostMutation = trpc.jobCost.create.useMutation({
    onSuccess: () => {
      refetch();
      setAddCostOpen(false);
      setCostForm({ type: "labor", description: "", quantity: "", unitPrice: "" });
      toast.success("Cost added successfully");
    },
  });

  const deleteCostMutation = trpc.jobCost.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Cost deleted");
    },
  });

  const updateJobMutation = trpc.job.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Job status updated");
    },
  });

  const [costForm, setCostForm] = useState({
    type: "labor" as "labor" | "parts" | "overhead",
    description: "",
    quantity: "",
    unitPrice: "",
  });

  const handleAddCost = () => {
    if (!jobId) return;
    const quantity = parseFloat(costForm.quantity);
    const unitPrice = parseFloat(costForm.unitPrice);
    const totalCost = quantity * unitPrice;

    addCostMutation.mutate({
      jobId,
      type: costForm.type,
      description: costForm.description,
      quantity: costForm.quantity,
      unitPrice: costForm.unitPrice,
      totalCost: totalCost.toFixed(2),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-black tracking-widest uppercase opacity-40">Loading Job Repository...</p>
      </div>
    );
  }

  if (!data) return null;

  const { job, costs, summary } = data;
  const quotedPrice = (job.quotedPrice as any) as number;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background pb-32">
      {/* Premium Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-muted"
              onClick={() => setLocation("/trades/dashboard")}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-xl font-black tracking-tighter">{job.jobNumber}</h1>
                  <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase">
                      Live Environment
                  </div>
              </div>
              <p className="text-xs font-bold text-muted-foreground truncate max-w-[200px]">{job.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
                size="sm" 
                variant="outline" 
                className="hidden sm:flex border-2 font-black text-[10px] uppercase h-9"
                onClick={() => setLocation(`/trades/jobs/${job.id}/invoice`)}
            >
                <Receipt className="w-3.5 h-3.5 mr-2" /> Invoicing
            </Button>
            <Button size="sm" className="font-black text-[10px] uppercase h-9 shadow-lg shadow-primary/20 px-4">
                <Share2 className="w-3.5 h-3.5 mr-2" /> Share
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Intelligence & Status */}
          <div className="space-y-8">
            <ProfitSpeedometer 
                quotedPrice={quotedPrice} 
                totalCosts={summary.totalCost} 
                className="border-none shadow-2xl shadow-black/5 bg-white dark:bg-card"
            />
            
            <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Execution Status</CardTitle>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select 
                    value={job.status} 
                    onValueChange={(v: any) => updateJobMutation.mutate({ id: job.id, status: v })}
                >
                  <SelectTrigger className="w-full h-12 border-2 font-bold bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quoted">Quoted / Estimating</SelectItem>
                    <SelectItem value="in_progress">Currently In Workshop</SelectItem>
                    <SelectItem value="completed">Work Finalized</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <div className="p-4 rounded-2xl bg-muted/20 border border-white dark:border-border/10 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-bold opacity-40 uppercase">Workshop Log</span>
                        <span className="font-mono opacity-60">ID: {job.id}</span>
                    </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card overflow-hidden">
                <div className="bg-primary/5 p-4 border-b border-primary/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                        <ClipboardCheck size={16} />
                    </div>
                    <span className="text-sm font-black text-primary opacity-80 uppercase tracking-widest">Client Identity</span>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Customer</p>
                        <p className="text-lg font-black tracking-tight">{job.customerName || "External Client"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-muted/50 border border-border/20">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Communcation</p>
                            <p className="text-xs font-bold truncate">{job.customerPhone || "Unlisted"}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/50 border border-border/20">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Documented</p>
                            <p className="text-xs font-bold truncate">{job.customerEmail ? "Email Linked" : "No Email"}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card overflow-hidden">
                <div className="bg-blue-500/5 p-4 border-b border-blue-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                            <Cpu size={16} />
                        </div>
                        <span className="text-sm font-black text-blue-600 opacity-80 uppercase tracking-widest">Digital Inspection</span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full"
                        onClick={() => setLocation(`/trades/jobs/${job.id}/dvi`)}
                    >
                        <Plus size={16} className="text-blue-600" />
                    </Button>
                </div>
                <CardContent className="p-6">
                    <DVIArea jobId={job.id} />
                </CardContent>
            </Card>
          </div>

          {/* Center/Right Column: Inventory & Labor */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary" />
                    Resource Allocation
                </h2>
                <Button 
                    size="sm" 
                    className="h-9 shadow-lg shadow-primary/20 font-bold"
                    onClick={() => setAddCostOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" /> Allocate Resource
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-3xl bg-white dark:bg-card shadow-xl shadow-black/5 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-2">
                        <Clock size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Labor Value</span>
                    <span className="text-xl font-black tracking-tighter text-blue-600">${summary.laborCost.toFixed(2)}</span>
                </div>
                <div className="p-6 rounded-3xl bg-white dark:bg-card shadow-xl shadow-black/5 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 mb-2">
                        <Package size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Parts Value</span>
                    <span className="text-xl font-black tracking-tighter text-orange-600">${summary.partsCost.toFixed(2)}</span>
                </div>
                <div className="p-6 rounded-3xl bg-white dark:bg-card shadow-xl shadow-black/5 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-2">
                        <Cpu size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Overhead Cost</span>
                    <span className="text-xl font-black tracking-tighter text-muted-foreground">${summary.overheadCost.toFixed(2)}</span>
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-black/5 bg-white dark:bg-card overflow-hidden">
                <CardContent className="p-0">
                    {costs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground/30 mb-4 border-2 border-dashed border-muted-foreground/20">
                                <Plus size={32} />
                            </div>
                            <h3 className="text-lg font-bold">No registered costs</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Start documenting labor hours and inventory consumption.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {costs.map((cost) => {
                                const typeConfig = {
                                    labor: { bg: "bg-blue-500/10", color: "text-blue-600", icon: Clock },
                                    parts: { bg: "bg-orange-500/10", color: "text-orange-600", icon: Package },
                                    overhead: { bg: "bg-muted", color: "text-muted-foreground", icon: Cpu }
                                };
                                const config = typeConfig[cost.type as keyof typeof typeConfig] || typeConfig.overhead;
                                const Icon = config.icon;

                                return (
                                    <div key={cost.id} className="p-6 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl ${config.bg} flex items-center justify-center ${config.color}`}>
                                                <Icon size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>
                                                        {cost.type}
                                                    </span>
                                                    <span className="text-[10px] font-bold opacity-20">•</span>
                                                    <span className="text-xs font-bold opacity-60">
                                                        {((cost.quantity as any) as number).toFixed(2)} units
                                                    </span>
                                                </div>
                                                <p className="font-bold text-base">{cost.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-0.5">Line Total</p>
                                                <p className="text-xl font-black tracking-tighter">${((cost.totalCost as any) as number).toFixed(2)}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-xl h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                                onClick={() => deleteCostMutation.mutate({ id: cost.id })}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Cost Premium Modal */}
      <Dialog open={addCostOpen} onOpenChange={setAddCostOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-white dark:bg-card">
          <div className="bg-primary p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Wrench size={100} />
            </div>
            <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tighter mb-2">Allocate Resource</DialogTitle>
                <DialogDescription className="text-white/70 font-medium">Document materials and expertise consumed during this service loop.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest opacity-60">Component Type</Label>
                    <Select
                        value={costForm.type}
                        onValueChange={(v: any) => setCostForm({ ...costForm, type: v })}
                    >
                        <SelectTrigger className="h-12 border-2 font-bold focus:ring-primary/20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="labor">Labor Hours</SelectItem>
                            <SelectItem value="parts">Hardware / Parts</SelectItem>
                            <SelectItem value="overhead">Business Overhead</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest opacity-60">Entry Logic</Label>
                    <div className="flex gap-2">
                         <div className="flex-1 px-4 py-3 bg-muted/40 rounded-xl border border-dashed border-border/50 text-xs font-bold text-center">Standard Item</div>
                    </div>
                </div>
            </div>
            
            <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-60">Description of Work / Part</Label>
                <Input
                    className="h-12 border-2 font-bold focus:ring-primary/20"
                    value={costForm.description}
                    onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}
                    placeholder="e.g., Synthetic Oil Filter #Z411"
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-60">Quantity</Label>
                <Input
                  className="h-12 border-2 font-bold"
                  type="number"
                  step="0.01"
                  value={costForm.quantity}
                  onChange={(e) => setCostForm({ ...costForm, quantity: e.target.value })}
                  placeholder="1.0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-60">Unit Price ($)</Label>
                <Input
                  className="h-12 border-2 font-bold"
                  type="number"
                  step="0.01"
                  value={costForm.unitPrice}
                  onChange={(e) => setCostForm({ ...costForm, unitPrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {costForm.quantity && costForm.unitPrice && (
              <div className="p-6 rounded-2xl bg-primary/5 border-2 border-primary/10 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary opacity-60">Projected Line Total</p>
                    <p className="text-3xl font-black tracking-tighter text-primary">
                      ${(parseFloat(costForm.quantity) * parseFloat(costForm.unitPrice)).toFixed(2)}
                    </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white">
                    <TrendingUp size={24} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="flex-1 font-bold h-12" onClick={() => setAddCostOpen(false)}>
              Discard
            </Button>
            <Button
              className="flex-[2] h-12 shadow-xl shadow-primary/20 font-black tracking-widest uppercase text-xs"
              onClick={handleAddCost}
              disabled={!costForm.description || !costForm.quantity || !costForm.unitPrice || addCostMutation.isPending}
            >
              {addCostMutation.isPending ? <Loader2 className="animate-spin" /> : "Commit Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DVIArea({ jobId }: { jobId: number }) {
    const { data: dvis, isLoading } = trpc.dvi.listByJob.useQuery({ jobId });
    const [, setLocation] = useLocation();

    if (isLoading) return <div className="h-20 bg-muted/20 animate-pulse rounded-2xl" />;

    if (!dvis || dvis.length === 0) {
        return (
            <div className="text-center py-4 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No Active Inspection</p>
                <Button 
                    variant="outline" 
                    className="w-full h-10 border-2 font-black text-[10px] uppercase tracking-widest"
                    onClick={() => setLocation(`/trades/jobs/${jobId}/dvi`)}
                >
                    Initialize DVI Loop
                </Button>
            </div>
        );
    }

    const latest = dvis[0];

    return (
        <div className="space-y-4">
             <div className="flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Latest Cycle</p>
                    <p className="text-xs font-black uppercase">{latest.inspectionNumber}</p>
                </div>
                <Badge variant={latest.status === 'shared' ? 'default' : 'secondary'} className="text-[8px] font-black uppercase tracking-widest">
                    {latest.status}
                </Badge>
            </div>
            {latest.shareToken && (
               <div className="p-3 rounded-xl bg-muted/30 border border-border/20 flex items-center justify-between">
                   <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Approval Link Ready</p>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => {
                        const link = `${window.location.origin}/public/dvi/${latest.shareToken}`;
                        navigator.clipboard.writeText(link);
                        toast.success("Client link copied");
                    }}
                   >
                       <Share2 size={12} />
                   </Button>
               </div>
            )}
            <Button 
                className="w-full h-10 font-black text-[10px] uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                onClick={() => setLocation(`/trades/jobs/${jobId}/dvi`)}
            >
                View Audit Trail
            </Button>
        </div>
    );
}
