import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLedger } from "@/contexts/LedgerContext";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Building2, User, Bell, 
  Shield, LogOut, ChevronRight, Settings as SettingsIcon,
  HardDrive, Monitor, Globe, Mail, Link as LinkIcon, RefreshCcw, Save, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { activeLedgerId, activeLedgerType } = useLedger();
  const [notifications, setNotifications] = useState(true);

  // Business Details State
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [gstRegistered, setGstRegistered] = useState(false);
  const [gstBasis, setGstBasis] = useState<"payments" | "invoice">("payments");
  const [bayCount, setBayCount] = useState(2);
  const [businessHours, setBusinessHours] = useState("");

  // Fetch Current Settings
  const { data: ledger, refetch: refetchLedger } = trpc.ledger.get.useQuery(
    { id: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const { data: invSettings, refetch: refetchInvSettings } = trpc.settings.getInvoice.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const { data: xeroStatus, refetch: refetchXero } = trpc.xero.getStatus.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const updateLedgerMutation = trpc.ledger.update.useMutation({
    onSuccess: () => {
      toast.success("Workshop configuration updated");
      refetchLedger();
    }
  });

  const updateInvSettingsMutation = trpc.settings.updateInvoice.useMutation({
    onSuccess: () => {
      toast.success("Billing architecture synchronized");
      refetchInvSettings();
    }
  });

  const connectXeroMutation = trpc.xero.getAuthUrl.useQuery(undefined, { enabled: false });
  const disconnectXeroMutation = trpc.xero.disconnect.useMutation({
    onSuccess: () => {
        toast.success("Xero connection terminated");
        refetchXero();
    }
  });

  useEffect(() => {
    if (ledger) {
      setGstRegistered(ledger.gstRegistered);
      setGstBasis(ledger.gstBasis as any || "payments");
    }
    if (invSettings) {
      setCompanyName(invSettings.companyName || "");
      setCompanyEmail(invSettings.companyEmail || "");
      setCompanyPhone(invSettings.companyPhone || "");
      setCompanyAddress(invSettings.companyAddress || "");
      setBankAccountName(invSettings.bankAccountName || "");
      setBankAccountNumber(invSettings.bankAccountNumber || "");
      setBayCount(invSettings.bayCount || 2);
      setBusinessHours(invSettings.businessHours || "");
    }
  }, [ledger, invSettings]);

  const handleSaveAll = () => {
    if (!activeLedgerId) return;
    
    updateLedgerMutation.mutate({
      id: activeLedgerId,
      gstRegistered,
      gstBasis,
    });

    updateInvSettingsMutation.mutate({
      ledgerId: activeLedgerId,
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      bankAccountName,
      bankAccountNumber,
      bayCount,
      businessHours,
    });
  };

  const handleConnectXero = async () => {
    const { data } = await connectXeroMutation.refetch();
    if (data?.url) {
      window.location.href = data.url;
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

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
              <h1 className="text-xl font-black tracking-tighter">System Preferences</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Core Configuration Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="hidden sm:inline-flex font-black text-[9px] uppercase tracking-widest opacity-40">Version 4.0.0-PROD</Badge>
            <Button 
                onClick={handleSaveAll}
                disabled={updateLedgerMutation.isLoading || updateInvSettingsMutation.isLoading}
                className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-6 shadow-lg shadow-primary/20"
            >
                {updateLedgerMutation.isLoading || updateInvSettingsMutation.isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Commit Changes</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-12 max-w-5xl space-y-16">
        {/* User Identity Section */}
        <section className="grid lg:grid-cols-3 gap-12">
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">User Identity</h3>
                <p className="text-xs font-bold text-muted-foreground leading-relaxed">Personal workstation authentication and profile settings.</p>
            </div>
            <div className="lg:col-span-2">
                <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card overflow-hidden">
                    <CardContent className="p-8 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-black">
                            {user?.name?.charAt(0) || "O"}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black tracking-tighter">{user?.name || "Operator"}</h3>
                            <p className="text-sm font-bold opacity-60 flex items-center gap-2 text-muted-foreground"><Mail size={14} /> {user?.email || "owner@gearbox.tech"}</p>
                            <div className="flex gap-2 mt-4">
                                <Badge variant="secondary" className="font-black text-[9px] uppercase tracking-widest py-1 px-3">System Administrator</Badge>
                                <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest py-1 px-3">Full Permissions</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>

        <div className="h-px bg-border/40" />

        {/* Business DNA Section */}
        <section className="grid lg:grid-cols-3 gap-12">
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Workshop Identity</h3>
                <p className="text-xs font-bold text-muted-foreground leading-relaxed">Core business data emitted on invoices, quotes, and reports.</p>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card">
                    <CardContent className="p-8 space-y-8">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Trading Name</Label>
                                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Gearbox Automotive" className="h-12 border-2 font-bold focus:ring-primary/20" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Contact Email</Label>
                                <Input value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} placeholder="service@workshop.nz" className="h-12 border-2 font-bold focus:ring-primary/20" />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Phone Hub</Label>
                                <Input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} placeholder="09 555 1234" className="h-12 border-2 font-bold focus:ring-primary/20" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Workshop Address</Label>
                                <Input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="123 Mechanics Way, Auckland" className="h-12 border-2 font-bold focus:ring-primary/20" />
                            </div>
                        </div>
                        <div className="h-px bg-border/10" />
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Remittance Account Name</Label>
                                <Input value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} placeholder="Gearbox Trading Ltd" className="h-12 border-2 font-bold focus:ring-primary/20" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">NZ Bank Account Number</Label>
                                <Input value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} placeholder="12-3456-7890123-45" className="h-12 border-2 font-bold focus:ring-primary/20" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>

        <div className="h-px bg-border/40" />

        {/* Operational Capacity Section */}
        <section className="grid lg:grid-cols-3 gap-12">
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Operational Capacity</h3>
                <p className="text-xs font-bold text-muted-foreground leading-relaxed">Configure shop-floor resources and window availability protocols.</p>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card">
                    <CardContent className="p-8 space-y-8">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Active Bay Count</Label>
                                <Input 
                                    type="number" 
                                    value={bayCount} 
                                    onChange={e => setBayCount(parseInt(e.target.value, 10))} 
                                    className="h-12 border-2 font-bold focus:ring-primary/20" 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Business Hours Configuration (JSON)</Label>
                            <Textarea 
                                value={businessHours} 
                                onChange={e => setBusinessHours(e.target.value)} 
                                placeholder='{"monday": {"open": "08:00", "close": "17:00"}, ...}'
                                className="min-h-[140px] border-2 font-mono text-xs focus:ring-primary/20" 
                            />
                            <p className="text-[10px] text-muted-foreground opacity-60">Define weekly schedule in JSON format for the availability engine.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>

        <div className="h-px bg-border/40" />
        <section className="grid lg:grid-cols-3 gap-12">
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Public Gateway</h3>
                <p className="text-xs font-bold text-muted-foreground leading-relaxed">Manage external touchpoints and customer self-service conduits.</p>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card">
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black italic">Live Booking Conduit</h4>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">External URL for website embedding</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/10 flex items-center justify-between gap-4">
                            <code className="text-[10px] font-bold opacity-60 truncate">
                                {window.location.protocol}//{window.location.host}/public/booking/{activeLedgerId}
                            </code>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="font-black text-[9px] uppercase tracking-widest h-9 px-4 rounded-xl"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/public/booking/${activeLedgerId}`);
                                    toast.success("Conduit link copied to clipboard");
                                }}
                            >
                                Copy Link
                            </Button>
                        </div>

                        <div className="p-6 rounded-[2rem] bg-black text-white space-y-4 shadow-2xl">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Embed Instruction</span>
                            </div>
                            <p className="text-[10px] font-bold leading-relaxed opacity-60">
                                To embed this booking terminal in your website, insert the following iframe component into your HTML:
                            </p>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 overflow-x-auto">
                                <pre className="text-[9px] font-mono text-primary">
                                    {`<iframe src="${window.location.protocol}//${window.location.host}/public/booking/${activeLedgerId}" width="100%" height="700px" frameborder="0"></iframe>`}
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>

        <div className="h-px bg-border/40" />

        {/* Financial Logic Section */}
        <section className="grid lg:grid-cols-3 gap-12">
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Financial Architecture</h3>
                <p className="text-xs font-bold text-muted-foreground leading-relaxed">Configure taxation logic and accounting synchronization protocols.</p>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card">
                    <CardContent className="p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black italic">NZ GST Registration</h4>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Enable 15% GST calculation on all outgoing invoices</p>
                                </div>
                            </div>
                            <Switch checked={gstRegistered} onCheckedChange={setGstRegistered} />
                        </div>
                        
                        {gstRegistered && (
                            <div className="animate-in slide-in-from-top-4 duration-500 space-y-4 pl-16">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">GST Filing Basis</Label>
                                <Select value={gstBasis} onValueChange={(v: any) => setGstBasis(v)}>
                                    <SelectTrigger className="h-12 border-2 font-bold rounded-xl max-w-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="payments">Payments Basis (Cash)</SelectItem>
                                        <SelectItem value="invoice">Invoice Basis (Accrual)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="h-px bg-border/10" />

                        {/* Xero Integration Sub-section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#13B5EA]/10 flex items-center justify-center text-[#13B5EA]">
                                        <LinkIcon size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black italic">Xero Ecosystem Sync</h4>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Automatic push of invoices and contact matching</p>
                                    </div>
                                </div>
                                {xeroStatus?.connected ? (
                                    <Badge className="bg-emerald-500 text-white font-black text-[9px] uppercase tracking-[0.2em] py-1 px-3">Node Active</Badge>
                                ) : (
                                    <Badge variant="outline" className="font-black text-[9px] uppercase tracking-[0.2em] py-1 px-3 opacity-40">Node Offline</Badge>
                                )}
                            </div>

                            <Card className="border-2 border-dashed border-border/40 bg-muted/5 rounded-[2rem]">
                                <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                                    {xeroStatus?.connected ? (
                                        <>
                                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                                <CheckCircle2 size={32} />
                                            </div>
                                            <div>
                                                <h5 className="text-xl font-black italic tracking-tighter text-emerald-500 uppercase">Synchronized with Xero</h5>
                                                <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">Active Connection to: {ledger?.name || "Workshop"}</p>
                                            </div>
                                            <div className="flex gap-4 w-full justify-center">
                                                <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase h-10 px-8" onClick={() => refetchXero()}>Force Re-sync</Button>
                                                <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase h-10 px-8 border-red-500/20 text-red-500 hover:bg-red-500/10" onClick={() => disconnectXeroMutation.mutate({ ledgerId: activeLedgerId! })}>Terminate Connection</Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-[#13B5EA] flex items-center justify-center text-white shadow-xl shadow-[#13B5EA]/20">
                                                <img src="https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/Xero_software_logo.svg/1200px-Xero_software_logo.svg.png" className="w-10 h-10 invert brightness-0" alt="Xero" />
                                            </div>
                                            <div>
                                                <h5 className="text-xl font-black italic tracking-tighter uppercase">Accounting Engine Disconnected</h5>
                                                <p className="text-xs font-bold text-muted-foreground mt-2 max-w-sm">Connect your Xero account to enable real-time ledger synchronization and automated tax filing.</p>
                                            </div>
                                            <Button 
                                                onClick={handleConnectXero}
                                                disabled={connectXeroMutation.isFetching}
                                                className="bg-[#13B5EA] hover:bg-[#13B5EA]/90 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest h-14 px-12 shadow-2xl shadow-[#13B5EA]/20"
                                            >
                                                {connectXeroMutation.isFetching ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "Authorize Xero Integration"}
                                            </Button>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>

        <div className="h-px bg-border/40" />

        {/* Global Controls Section */}
        <section className="grid lg:grid-cols-3 gap-12">
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Global Overrides</h3>
                <p className="text-xs font-bold text-muted-foreground leading-relaxed">Dangerous actions and master system parameters.</p>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card">
                    <CardContent className="p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black italic">System Signal Flow</h4>
                                    <p className="text-xs font-bold text-muted-foreground">Master toggle for all environment alerts</p>
                                </div>
                            </div>
                            <Switch checked={notifications} onCheckedChange={setNotifications} />
                        </div>
                        <div className="h-px bg-border/10" />
                        <Button
                            variant="destructive"
                            className="w-full h-16 rounded-[2rem] shadow-2xl shadow-red-500/10 font-black uppercase tracking-widest text-[10px] italic border-none"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-5 h-5 mr-3" /> Terminate Active Session
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </section>
      </div>
    </div>
  );
}
