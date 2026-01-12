import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLedger } from "@/contexts/LedgerContext";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Building2, User, Bell, 
  Shield, LogOut, ChevronRight, Settings as SettingsIcon,
  HardDrive, Monitor, Globe, Mail
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { activeLedgerId, activeLedgerType } = useLedger();
  const [notifications, setNotifications] = useState(true);

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
          <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest opacity-40">Version 1.0.0-Stable</Badge>
        </div>
      </div>

      <div className="container py-12 max-w-4xl space-y-12">
        <div className="grid lg:grid-cols-3 gap-12">
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">User Identity</h3>
                <p className="text-xs font-bold text-muted-foreground leading-relaxed">Manage your personal profile and authentication methods.</p>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card overflow-hidden">
                    <CardContent className="p-8 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-black">
                            {user?.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black tracking-tighter">{user?.name || "Anonymous User"}</h3>
                            <p className="text-sm font-bold opacity-60 flex items-center gap-2"><Mail size={14} /> {user?.email || "No digital endpoint"}</p>
                            <Badge variant="secondary" className="mt-4 font-black text-[9px] uppercase tracking-widest">Admin Authorization</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        <div className="h-px bg-border/40" />

        <div className="grid lg:grid-cols-3 gap-12">
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Infrastructure</h3>
                <p className="text-xs font-bold text-muted-foreground leading-relaxed">Configure active environments and data synchronization logic.</p>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <HardDrive size={16} className="text-primary" /> Active Environment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                         <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/10">
                            <div>
                                <h3 className="text-lg font-black tracking-tighter">{activeLedgerType === "trades" ? "Automotive Workshop" : "Rental Portfolio"}</h3>
                                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Local System ID: {activeLedgerId}</p>
                            </div>
                            <Button variant="outline" size="sm" className="font-bold rounded-xl" onClick={() => setLocation("/")}>Switch Environment</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        <div className="h-px bg-border/40" />

        <div className="grid lg:grid-cols-3 gap-12">
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Alert Matrix</h3>
                <p className="text-xs font-bold text-muted-foreground leading-relaxed">Tailor real-time notifications and compliance reminders.</p>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card">
                    <CardContent className="p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black">System Signal Flow</h4>
                                    <p className="text-xs font-bold text-muted-foreground">Master toggle for all environment alerts</p>
                                </div>
                            </div>
                            <Switch checked={notifications} onCheckedChange={setNotifications} />
                        </div>
                        <div className="h-px bg-border/10" />
                        <section className="space-y-6">
                             <div className="flex items-center justify-between opacity-60">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                                        <Globe size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black">External Compliance Alerts</h4>
                                        <p className="text-xs font-bold text-muted-foreground">WOF/Rego synchronization triggers</p>
                                    </div>
                                </div>
                                <Switch checked={true} disabled />
                            </div>
                        </section>
                    </CardContent>
                </Card>
            </div>
        </div>

        <div className="pt-8">
            <Button
                variant="destructive"
                className="w-full h-16 rounded-[2rem] shadow-2xl shadow-red-500/10 font-black uppercase tracking-widest text-xs"
                onClick={handleLogout}
            >
                <LogOut className="w-5 h-5 mr-3" /> Terminate Session
            </Button>
        </div>
      </div>
    </div>
  );
}
