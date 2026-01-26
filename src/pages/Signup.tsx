import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useLedger } from "@/contexts/LedgerContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Signup() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const defaultTier = (searchParams.get("tier") as "starter" | "professional" | "enterprise") || "starter";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    shopName: "",
    tier: defaultTier,
  });

  const { setActiveLedgerId, setActiveLedgerType } = useLedger();

  const signup = trpc.public.signup.useMutation({
    onSuccess: (data) => {
      console.log("Signup success data:", data);
      toast.success("Account created successfully!");
      
      // Automatic login
      localStorage.setItem("gearbox_user_id", data.userId.toString());
      localStorage.setItem("gearbox_active_ledger_id", data.ledgerId.toString());
      localStorage.setItem("gearbox_active_ledger_type", 'trades');
      
      setActiveLedgerId(data.ledgerId);
      setActiveLedgerType('trades');
      
      console.log("Redirecting to dashboard...");
      // Small timeout to allow state to settle
      setTimeout(() => {
        setLocation("/trades/dashboard");
      }, 100);
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signup.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-dark text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 mb-4">
                <Zap size={12} className="fill-primary" /> Start Your Journey
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic">Create Account</h1>
            <p className="text-white/40">Initialize your workshop operation system.</p>
        </div>

        <Card className="glass-dark border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="sr-only">Signup</CardTitle>
            <CardDescription className="sr-only">Enter your details to create an account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopName" className="text-white/60">Workshop Name</Label>
                <Input 
                  id="shopName"
                  placeholder="e.g. Acme Automotive" 
                  value={formData.shopName}
                  onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/60">Your Name</Label>
                <Input 
                  id="name"
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/60">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/60">Password</Label>
                <Input 
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                  minLength={8}
                />
              </div>

              <div className="pt-4">
                <Button 
                    type="submit" 
                    className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
                    disabled={signup.isLoading}
                >
                    {signup.isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        "Create Workspace"
                    )}
                </Button>
              </div>

              <div className="text-center text-sm text-white/40 mt-4">
                Already have an account? <span className="text-primary hover:underline cursor-pointer" onClick={() => setLocation('/app/login')}>Login</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
