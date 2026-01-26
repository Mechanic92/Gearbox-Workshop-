import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useLedger } from "@/contexts/LedgerContext";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, Calculator, Loader2, Sparkles, 
  Wrench, User, Phone, Mail, Car, TrendingUp,
  ChevronRight, ArrowRight, Zap, Target
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const JOB_TEMPLATES = [
  { id: "oil_change", name: "Oil Change & Filter", description: "Standard oil change with filter replacement", estimatedHours: 0.5, typicalParts: 80 },
  { id: "brake_service", name: "Brake Service (Front)", description: "Replace front brake pads and resurface rotors", estimatedHours: 2.0, typicalParts: 250 },
  { id: "brake_service_full", name: "Brake Service (Full)", description: "Replace all brake pads and resurface all rotors", estimatedHours: 3.5, typicalParts: 450 },
  { id: "wof_inspection", name: "WOF Inspection", description: "Warrant of Fitness inspection", estimatedHours: 0.75, typicalParts: 0 },
  { id: "full_service", name: "Full Service", description: "Comprehensive vehicle service including fluids, filters, and inspection", estimatedHours: 2.5, typicalParts: 200 },
  { id: "timing_belt", name: "Timing Belt Replacement", description: "Replace timing belt and water pump", estimatedHours: 4.0, typicalParts: 350 },
  { id: "clutch_replacement", name: "Clutch Replacement", description: "Replace clutch kit including pressure plate and release bearing", estimatedHours: 6.0, typicalParts: 600 },
  { id: "diagnostic", name: "Diagnostic & Repair", description: "Diagnose issue and perform necessary repairs", estimatedHours: 1.0, typicalParts: 0 },
];

export default function NewJob() {
  const { activeLedgerId } = useLedger();
  const [, setLocation] = useLocation();

  if (!activeLedgerId) {
    setLocation("/setup/ledger");
    return null;
  }

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [jobNumber, setJobNumber] = useState(`JOB-${Math.floor(Math.random() * 9000) + 1000}`);
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [laborHours, setLaborHours] = useState<string>("");
  const [laborRate, setLaborRate] = useState<string>("80");
  const [estimatedParts, setEstimatedParts] = useState<string>("");
  const [overhead, setOverhead] = useState<string>("50");
  const [profitMargin, setProfitMargin] = useState<string>("30");

  const { data: vehicles } = trpc.vehicle.list.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const createJobMutation = trpc.job.create.useMutation({
    onSuccess: (data) => {
      toast.success("Job initialized in workshop queue");
      setLocation(`/trades/jobs/${data.id}`);
    },
  });

  const calculatedQuote = useMemo(() => {
    const hours = parseFloat(laborHours) || 0;
    const rate = parseFloat(laborRate) || 0;
    const parts = parseFloat(estimatedParts) || 0;
    const overheadCost = parseFloat(overhead) || 0;
    const margin = parseFloat(profitMargin) || 0;
    const laborCost = hours * rate;
    const totalCost = laborCost + parts + overheadCost;
    const quote = totalCost * (1 + margin / 100);
    return { laborCost, partsCost: parts, overheadCost, totalCost, quote, profit: quote - totalCost, profitMargin: totalCost > 0 ? ((quote - totalCost) / quote) * 100 : 0 };
  }, [laborHours, laborRate, estimatedParts, overhead, profitMargin]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = JOB_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setDescription(template.description);
      setLaborHours(template.estimatedHours.toString());
      setEstimatedParts(template.typicalParts.toString());
    }
  };

  const handleSubmit = () => {
    if (!activeLedgerId || !jobNumber.trim() || !description.trim()) return;
    createJobMutation.mutate({
      ledgerId: activeLedgerId,
      jobNumber: jobNumber.trim(),
      description: description.trim(),
      quotedPrice: calculatedQuote.quote.toFixed(2),
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      vehicleId: vehicleId ? parseInt(vehicleId, 10) : undefined,
    });
  };

  if (!activeLedgerId) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background pb-32">
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
              <h1 className="text-xl font-black tracking-tighter">Job Initialization</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">New Service Cycle</p>
            </div>
          </div>
          <Button 
            className="shadow-lg shadow-primary/20 font-black text-xs uppercase h-10 px-8"
            onClick={handleSubmit}
            disabled={createJobMutation.isLoading || !jobNumber.trim() || !description.trim()}
          >
            {createJobMutation.isLoading ? <Loader2 className="animate-spin" /> : <><Zap className="w-4 h-4 mr-2" /> Activate Job</>}
          </Button>
        </div>
      </div>

      <div className="container py-8 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Template Engine */}
                <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card overflow-hidden">
                    <div className="bg-primary/5 p-6 border-b border-primary/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sparkles className="text-primary w-5 h-5" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary/80">Intelligent Templates</h3>
                        </div>
                        <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest text-primary border-primary/20">Auto-Fill Ready</Badge>
                    </div>
                    <CardContent className="p-8">
                        <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                            <SelectTrigger className="h-14 border-2 font-bold px-6 text-lg focus:ring-primary/20 bg-muted/20">
                                <SelectValue placeholder="Select a job blueprint..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                {JOB_TEMPLATES.map((template) => (
                                    <SelectItem key={template.id} value={template.id} className="h-12 font-bold focus:bg-primary/5">
                                        {template.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Core Specifications */}
                <Card className="border-none shadow-2xl shadow-black/5 bg-white dark:bg-card">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">
                            <Wrench className="text-primary" /> Service Specifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Internal Reference ID</Label>
                                <Input className="h-14 border-2 font-black text-xl px-6 focus:ring-primary/20" value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Allocated Asset</Label>
                                <Select value={vehicleId} onValueChange={setVehicleId}>
                                    <SelectTrigger className="h-14 border-2 font-bold px-6 focus:ring-primary/20">
                                        <SelectValue placeholder="Link a vehicle..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicles?.map((vehicle) => (
                                            <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                                {vehicle.licensePlate} • {vehicle.make} {vehicle.model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Work Order Description</Label>
                            <Textarea className="min-h-[140px] border-2 font-medium p-6 focus:ring-primary/20 text-lg" placeholder="Detail the technical requirements and diagnostic notes..." value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Client Profile */}
                <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">
                            <User className="text-primary" /> Client Identity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Legal Name / Business Entity</Label>
                            <Input className="h-12 border-2 font-bold" placeholder="e.g., John Smith" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Communication Line</Label>
                                <Input className="h-12 border-2 font-bold" placeholder="021..." value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Digital Endpoint (Email)</Label>
                                <Input className="h-12 border-2 font-bold" type="email" placeholder="client@domain.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quote Engine / Sidebar */}
            <div className="space-y-8">
                <Card className="border-none shadow-2xl shadow-primary/5 bg-primary p-8 text-white relative overflow-hidden rounded-[2.5rem]">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Calculator size={120} />
                    </div>
                    <div className="relative space-y-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Projected Valuation</p>
                            <h3 className="text-4xl font-black tracking-tighter">${calculatedQuote.quote.toLocaleString()}</h3>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex justify-between items-center text-xs font-bold opacity-60 uppercase tracking-widest">
                                <span>Resource Allocation</span>
                                <span>${calculatedQuote.totalCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold text-green-400 uppercase tracking-widest">
                                <span>Projected Yield</span>
                                <span>${calculatedQuote.profit.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-white/20" />
                            <div className="flex justify-between items-center py-2">
                                <span className="font-black text-sm uppercase tracking-widest">Total Estimate</span>
                                <span className="text-2xl font-black">${calculatedQuote.quote.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/10 border border-white/20">
                                <Target size={16} className="text-white" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{calculatedQuote.profitMargin.toFixed(1)}% Operating Margin</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card p-6 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Valuation Logic</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest opacity-40">Labor Units (H)</Label>
                            <Input type="number" step="0.25" className="h-12 border-2 font-bold text-center" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest opacity-40">Unit Rate ($)</Label>
                            <Input type="number" step="5" className="h-12 border-2 font-bold text-center" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest opacity-40">Parts/Hardware ($)</Label>
                            <Input type="number" className="h-12 border-2 font-bold text-center" value={estimatedParts} onChange={(e) => setEstimatedParts(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest opacity-40">Overhead ($)</Label>
                            <Input type="number" className="h-12 border-2 font-bold text-center" value={overhead} onChange={(e) => setOverhead(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-40">Target Yield (%)</Label>
                        <Input type="number" className="h-12 border-2 font-bold text-center" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} />
                    </div>
                </Card>

                <Button 
                    size="lg" 
                    className="w-full h-16 rounded-[2rem] shadow-xl shadow-primary/20 font-black tracking-widest uppercase text-xs"
                    onClick={handleSubmit}
                    disabled={createJobMutation.isLoading || !jobNumber.trim() || !description.trim()}
                >
                    Initialize Service Loop
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
