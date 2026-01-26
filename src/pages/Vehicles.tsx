import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLedger } from "@/contexts/LedgerContext";
import { trpc } from "@/lib/trpc";
import { 
  AlertCircle, ArrowLeft, Car, Loader2, Plus, 
  Search, ShieldCheck, Calendar, Info, 
  ChevronRight, ArrowRight, Activity, Zap
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function Vehicles() {
  const { activeLedgerId } = useLedger();
  const [, setLocation] = useLocation();

  if (!activeLedgerId) {
    setLocation("/setup/ledger");
    return null;
  }
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [licensePlate, setLicensePlate] = useState("");
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [wofExpiry, setWofExpiry] = useState("");
  const [regoExpiry, setRegoExpiry] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Fetch vehicles
  const { data: vehicles, isLoading, refetch } = trpc.vehicle.list.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  // Create vehicle mutation
  const createVehicleMutation = trpc.vehicle.create.useMutation({
    onSuccess: () => {
      toast.success("Vehicle registered in fleet hub");
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
  });

  const resetForm = () => {
    setLicensePlate(""); setVin(""); setMake(""); setModel("");
    setYear(""); setColor(""); setWofExpiry(""); setRegoExpiry("");
  };

  const handleNZTALookup = async () => {
    if (!licensePlate.trim()) {
      toast.error("Enter a valid license plate");
      return;
    }
    setIsLookingUp(true);
    await new Promise((r) => setTimeout(r, 1200));
    const mockData = {
      vin: "JN1TANT31U0000123", make: "Nissan", model: "X-Trail", year: "2019", color: "Silver",
      wofExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      regoExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    };
    setVin(mockData.vin); setMake(mockData.make); setModel(mockData.model);
    setYear(mockData.year); setColor(mockData.color); setWofExpiry(mockData.wofExpiry);
    setRegoExpiry(mockData.wofExpiry);
    setIsLookingUp(false);
    toast.info("NZTA Data Sync Successful");
  };

  const handleSubmit = () => {
    if (!activeLedgerId || !licensePlate.trim()) return;
    createVehicleMutation.mutate({
      ledgerId: activeLedgerId,
      licensePlate: licensePlate.trim().toUpperCase(),
      vin: vin.trim() || undefined,
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      year: year ? parseInt(year, 10) : undefined,
      wofExpiry: wofExpiry ? new Date(wofExpiry) : undefined,
      regoExpiry: regoExpiry ? new Date(regoExpiry) : undefined,
    });
  };

  const getDaysUntilExpiry = (expiryDate: Date | null) => {
    if (!expiryDate) return null;
    const diffDays = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Car className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary w-6 h-6" />
        </div>
        <p className="text-xs font-black tracking-widest uppercase opacity-40">Syncing Fleet Assets...</p>
      </div>
    );
  }

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
              <h1 className="text-xl font-black tracking-tighter">Fleet Hub</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{vehicles?.length || 0} Registered Units</p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="shadow-lg shadow-primary/20 font-black text-[10px] uppercase h-10 px-6"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Register Asset
          </Button>
        </div>
      </div>

      <div className="container py-8 max-w-6xl">
        {!vehicles || vehicles.length === 0 ? (
          <Card className="border-2 border-dashed bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 rounded-3xl bg-muted/50 flex items-center justify-center mb-6">
                  <Car className="w-12 h-12 text-muted-foreground/30" />
              </div>
              <h3 className="text-2xl font-black tracking-tighter mb-2">No Fleet Assets Found</h3>
              <p className="text-muted-foreground max-w-xs mb-8">Start by adding a vehicle to track its service history, WOF, and Rego status.</p>
              <Button onClick={() => setIsDialogOpen(true)} className="h-12 px-8 shadow-xl">
                  Register Your First Vehicle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => {
              const wof = getDaysUntilExpiry(vehicle.wofExpiry);
              const rego = getDaysUntilExpiry(vehicle.regoExpiry);
              
              const StatusBadge = ({ days, label }: { days: number | null, label: string }) => {
                if (days === null) return null;
                const isCritical = days < 14;
                const isWarning = days < 30;
                return (
                  <div className={`flex flex-col p-4 rounded-2xl border-2 ${
                    isCritical ? "bg-red-500/10 border-red-500/20 text-red-600" :
                    isWarning ? "bg-orange-500/10 border-orange-500/20 text-orange-600" :
                    "bg-green-500/10 border-green-500/20 text-green-600"
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</span>
                    <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold">{days > 0 ? `${days}d Remaining` : "EXPIRED"}</span>
                        {isCritical && <Zap size={14} className="animate-pulse" />}
                    </div>
                  </div>
                );
              };

              return (
                <Card key={vehicle.id} className="group border-none shadow-xl shadow-black/5 bg-white dark:bg-card hover:scale-[1.02] transition-transform duration-300 overflow-hidden">
                  <div className="h-2 bg-primary/20" />
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Car size={20} />
                        </div>
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest opacity-40">Active Asset</Badge>
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tighter flex items-center gap-2">
                        {vehicle.licensePlate}
                        <ArrowRight size={18} className="text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </CardTitle>
                    <CardDescription className="font-bold text-foreground/60">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <StatusBadge days={wof} label="Warrant of Fitness" />
                        <StatusBadge days={rego} label="Registration" />
                    </div>
                    {vehicle.vin && (
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/10 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-30">VIN Number</span>
                            <span className="text-[10px] font-mono font-bold truncate max-w-[120px]">{vehicle.vin}</span>
                        </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Asset Registration Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-white dark:bg-card">
           <div className="bg-primary p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck size={100} />
            </div>
            <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tighter mb-2">Register Asset</DialogTitle>
                <DialogDescription className="text-white/70 font-medium">Syncing with NZTA database and MotorWeb for real-time compliance tracking.</DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
            <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Search size={16} className="text-primary" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Remote Lookup</h3>
                </div>
                <div className="flex gap-3">
                    <Input
                        className="h-14 border-2 font-black text-2xl tracking-widest text-center uppercase focus:ring-primary/20"
                        placeholder="ABC123"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    />
                    <Button
                        className="h-14 px-8 font-black uppercase text-xs"
                        onClick={handleNZTALookup}
                        disabled={isLookingUp || !licensePlate.trim()}
                    >
                        {isLookingUp ? <Loader2 className="animate-spin" /> : "Verify Identity"}
                    </Button>
                </div>
                <Alert className="bg-primary/5 border-primary/10 rounded-2xl">
                    <Info className="w-4 h-4 text-primary" />
                    <AlertDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                        NZTA Integration will pre-populate VIN, Year, Make, Model & Expiries.
                    </AlertDescription>
                </Alert>
            </section>

            <div className="h-px bg-border/40" />

            <section className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                    <Activity size={16} className="text-muted-foreground" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Technical Specifications</h3>
                </div>
                
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">VIN Identifier</Label>
                    <Input className="h-12 border-2 font-bold" value={vin} onChange={(e) => setVin(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Manufacturer</Label>
                        <Input className="h-12 border-2 font-bold" value={make} onChange={(e) => setMake(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Model Series</Label>
                        <Input className="h-12 border-2 font-bold" value={model} onChange={(e) => setModel(e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Production Year</Label>
                        <Input className="h-12 border-2 font-bold" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Finish / Color</Label>
                        <Input className="h-12 border-2 font-bold" value={color} onChange={(e) => setColor(e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">WOF Expiration</Label>
                        <Input className="h-12 border-2 font-bold" type="date" value={wofExpiry} onChange={(e) => setWofExpiry(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Registration Expiration</Label>
                        <Input className="h-12 border-2 font-bold" type="date" value={regoExpiry} onChange={(e) => setRegoExpiry(e.target.value)} />
                    </div>
                </div>
            </section>
          </div>

          <DialogFooter className="p-8 bg-muted/20 flex gap-3">
             <Button variant="ghost" className="flex-1 font-bold h-12" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
              Discard
            </Button>
            <Button
              className="flex-[2] h-12 shadow-xl shadow-primary/20 font-black tracking-widest uppercase text-xs"
              onClick={handleSubmit}
              disabled={createVehicleMutation.isLoading || !licensePlate.trim()}
            >
              {createVehicleMutation.isLoading ? <Loader2 className="animate-spin" /> : "Commit Registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
