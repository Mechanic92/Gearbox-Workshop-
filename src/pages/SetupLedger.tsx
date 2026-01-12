import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLedger } from "@/contexts/LedgerContext";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, ArrowRight, Building2, Check, 
  Loader2, Wrench, Rocket, Zap, Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LedgerType = "trades" | "rental";
type Step = "type" | "details" | "tax" | "complete";

export default function SetupLedger() {
  const { user } = useAuth();
  const { setActiveLedgerId, setActiveLedgerType } = useLedger();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<Step>("type");
  const [ledgerType, setLedgerType] = useState<LedgerType | null>(null);
  const [ledgerName, setLedgerName] = useState("");
  const [gstRegistered, setGstRegistered] = useState(false);
  const [gstBasis, setGstBasis] = useState<"payments" | "invoice">("payments");
  const [gstFrequency, setGstFrequency] = useState<"monthly" | "two_monthly" | "six_monthly">("two_monthly");
  const [aimEnabled, setAimEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Background animation state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const { data: organizations } = trpc.organization.list.useQuery();
  const firstOrgId = organizations?.[0]?.id;

  const createOrgMutation = trpc.organization.create.useMutation();
  const createLedgerMutation = trpc.ledger.create.useMutation({
    onSuccess: async (data) => {
      setActiveLedgerId(data.id);
      setActiveLedgerType(ledgerType!);
      setStep("complete");
      toast.success("Economic environment initialized");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initialize ledger");
    }
  });

  const handleCreateLedger = async () => {
    if (!ledgerName) {
        toast.error("Please enter a ledger entity title");
        return;
    }

    setIsSubmitting(true);
    try {
        let orgId = firstOrgId;
        if (!orgId) {
          try {
            console.log("Attempting to create organization...");
            const org = await createOrgMutation.mutateAsync({
              name: `${user?.name || 'My'}'s Enterprise`,
              subscriptionTier: "professional",
            });
            orgId = org.id;
            console.log("Organization created:", orgId);
          } catch (error) {
            console.error("Organization creation error:", error);
            toast.error("Failed to create organization. Please try again.");
            setIsSubmitting(false);
            return;
          }
        }
        
        console.log("Creating ledger with orgId:", orgId);
        await createLedgerMutation.mutateAsync({
          organizationId: orgId,
          name: ledgerName,
          type: ledgerType!,
          gstRegistered,
          gstBasis: gstRegistered ? gstBasis : undefined,
          gstFilingFrequency: gstRegistered ? gstFrequency : undefined,
          aimEnabled,
        });
        // Success handled in createLedgerMutation.onSuccess
    } catch (error) {
        console.error("Ledger creation error:", error);
        toast.error("Failed to create ledger configuration.");
        setIsSubmitting(false);
    }
  };

  const steps = ["type", "details", "tax", "complete"] as Step[];
  const currentIdx = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden transition-colors duration-1000">
        {/* Spotify-style Dynamic Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div 
                className="absolute w-[800px] h-[800px] rounded-full blur-[150px] opacity-[0.15] transition-all duration-1000"
                style={{ 
                    background: 'radial-gradient(circle, oklch(var(--primary)) 0%, transparent 70%)',
                    left: `${mousePos.x - 400}px`,
                    top: `${mousePos.y - 400}px`,
                }}
            />
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[200px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[200px]" />
        </div>

        <div className="max-w-4xl w-full relative z-10 space-y-16">
            <header className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-dark text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4 border border-primary/20">
                    <Sparkles size={12} className="animate-spin-slow" /> System Onboarding
                </div>
                <h1 className="text-6xl lg:text-7xl font-black tracking-tighter text-white">Initialize <span className="text-primary italic">Environment.</span></h1>
                <p className="text-muted-foreground font-medium max-w-lg mx-auto text-lg">Architect your digital workspace for 2026 workshop excellence.</p>
            </header>

            {/* Premium Minimal Progress */}
            <div className="flex items-center justify-center gap-3">
                {steps.map((s, idx) => (
                    <div key={s} className="flex items-center gap-3">
                        <div 
                            className={cn(
                                "w-10 h-1 rounded-full transition-all duration-700",
                                currentIdx >= idx ? "bg-primary shadow-[0_0_15px_oklch(var(--primary))]" : "bg-white/10"
                            )}
                        />
                    </div>
                ))}
            </div>

            <main className="grid grid-cols-1">
                {step === "type" && (
                    <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div 
                            className={cn(
                                "group relative p-1 transition-all duration-500 rounded-[2.5rem] cursor-pointer",
                                ledgerType === 'trades' ? "bg-gradient-to-br from-primary to-transparent premium-shadow" : "hover:bg-white/5"
                            )}
                            onClick={() => setLedgerType("trades")}
                        >
                            <Card className="h-full border-none glass-dark rounded-[2.4rem] overflow-hidden group-hover:bg-white/5 transition-colors">
                                <CardContent className="p-10 space-y-6">
                                    <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-700 border border-primary/20">
                                        <Wrench size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black tracking-tighter text-white mb-3">Trades Business</h3>
                                        <p className="text-lg font-medium text-muted-foreground leading-relaxed">Modern workshop management, real-time job costing & CRM.</p>
                                    </div>
                                    <div className="pt-6 border-t border-white/5 flex gap-4">
                                        <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black uppercase tracking-widest text-primary">NZTA Ready</div>
                                        <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black uppercase tracking-widest text-primary">Invoicing</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div 
                            className={cn(
                                "group relative p-1 transition-all duration-500 rounded-[2.5rem] cursor-pointer",
                                ledgerType === 'rental' ? "bg-gradient-to-br from-primary to-transparent premium-shadow" : "hover:bg-white/5"
                            )}
                            onClick={() => setLedgerType("rental")}
                        >
                            <Card className="h-full border-none glass-dark rounded-[2.4rem] overflow-hidden group-hover:bg-white/5 transition-colors">
                                <CardContent className="p-10 space-y-6 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-primary transition-colors border border-white/10">
                                        <Building2 size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black tracking-tighter text-white mb-3">Portfolio</h3>
                                        <p className="text-lg font-medium text-muted-foreground leading-relaxed">Property management, automated income tracking & reporting.</p>
                                    </div>
                                    <div className="pt-6 border-t border-white/5">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Coming Q2 2026</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {step === "details" && (
                    <Card className="border-none glass premium-shadow p-12 max-w-xl mx-auto w-full rounded-[3rem] animate-in fade-in slide-in-from-right-12 duration-700">
                        <div className="space-y-10">
                             <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Enterprise Identity</Label>
                                <Input 
                                    className="h-20 bg-black/20 border-white/5 font-black text-3xl px-8 rounded-2xl focus:ring-primary/20 focus:border-primary/50 text-white placeholder:text-white/10" 
                                    value={ledgerName} 
                                    onChange={(e) => setLedgerName(e.target.value)} 
                                    placeholder="Apex Motors Ltd" 
                                />
                             </div>
                             <div className="flex gap-6">
                                 <Button variant="ghost" className="h-16 flex-1 font-bold rounded-2xl hover:bg-white/5 text-muted-foreground" onClick={() => setStep("type")}><ArrowLeft size={18} className="mr-2" /> Back</Button>
                                 <Button className="h-16 flex-[2] font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-primary/20" onClick={() => setStep("tax")} disabled={!ledgerName}>Proceed <ArrowRight size={18} className="ml-2" /></Button>
                             </div>
                        </div>
                    </Card>
                )}

                {step === "tax" && (
                    <Card className="border-none glass premium-shadow p-12 max-w-xl mx-auto w-full rounded-[3rem] animate-in fade-in slide-in-from-right-12 duration-700">
                        <div className="space-y-8 text-white">
                             <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between group hover:border-primary/30 transition-colors">
                                 <div className="space-y-1">
                                     <h4 className="font-black text-primary uppercase tracking-widest text-[10px]">Taxation Core</h4>
                                     <p className="text-xl font-black tracking-tight">Registered for GST?</p>
                                 </div>
                                 <Switch checked={gstRegistered} onCheckedChange={setGstRegistered} className="data-[state=checked]:bg-primary" />
                             </div>

                             {gstRegistered && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                     <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Accounting Logic</Label>
                                        <Select value={gstBasis} onValueChange={(v: any) => setGstBasis(v)}>
                                            <SelectTrigger className="h-16 bg-black/20 border-white/5 font-bold px-8 rounded-2xl text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="glass-dark border-white/10 z-[100]">
                                                <SelectItem value="payments">Payments Basis</SelectItem>
                                                <SelectItem value="invoice">Invoice / Accrual Basis</SelectItem>
                                            </SelectContent>
                                        </Select>
                                     </div>
                                 </div>
                             )}

                             <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between group hover:border-primary/30 transition-colors">
                                 <div className="space-y-1">
                                     <h4 className="font-black text-primary uppercase tracking-widest text-[10px]">Intelligent Tax</h4>
                                     <p className="text-xl font-black tracking-tight">Enable AIM Compliance?</p>
                                 </div>
                                 <Switch checked={aimEnabled} onCheckedChange={setAimEnabled} className="data-[state=checked]:bg-primary" />
                             </div>

                             <div className="flex gap-6 pt-4">
                                 <Button variant="ghost" className="h-16 flex-1 font-bold rounded-2xl hover:bg-white/5 text-muted-foreground" onClick={() => setStep("details")}><ArrowLeft size={18} className="mr-2" /> Back</Button>
                                 <Button className="h-16 flex-[2] font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-primary/20" onClick={handleCreateLedger} disabled={isSubmitting}>
                                     {isSubmitting ? <Loader2 className="animate-spin" /> : <>Finalize Configuration <Rocket size={18} className="ml-2" /></>}
                                 </Button>
                             </div>
                        </div>
                    </Card>
                )}

                {step === "complete" && (
                     <Card className="border-none glass premium-shadow p-16 max-w-xl mx-auto w-full text-center rounded-[4rem] animate-in zoom-in-95 duration-1000">
                        <div className="w-32 h-32 rounded-[3.5rem] bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_oklch(var(--primary)/0.3)]">
                            <Check size={64} strokeWidth={3} />
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter text-white mb-6">Environment <br/>Initialized.</h2>
                        <p className="text-muted-foreground text-lg mb-12">Universal systems architecture established. Welcome to Gearbox.</p>
                        <Button size="lg" className="h-20 w-full rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform" onClick={() => setLocation(ledgerType === "trades" ? "/trades/dashboard" : "/rental/dashboard")}>
                            Launch Platform <Zap size={20} className="ml-2" />
                        </Button>
                     </Card>
                )}
            </main>

            {/* Premium CTA Helper */}
            <footer className="flex justify-center h-20">
                 {step === "type" && ledgerType && (
                     <Button 
                        className="h-16 px-16 rounded-full font-black uppercase tracking-[0.3em] text-xs shadow-[0_20px_40px_rgba(0,0,0,0.5)] bg-white text-black hover:bg-primary hover:text-white transition-all duration-500 group animate-in fade-in slide-in-from-bottom-4" 
                        onClick={() => setStep("details")}
                     >
                         Construct Ledger <ArrowRight size={18} className="ml-3 group-hover:translate-x-2 transition-transform" />
                     </Button>
                 )}
            </footer>
        </div>
    </div>
  );
}
