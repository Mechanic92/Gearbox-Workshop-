import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLedger } from "@/contexts/LedgerContext";

export default function Login() {
  const [, setLocation] = useLocation();
  const { setActiveLedgerId, setActiveLedgerType } = useLedger();
  const [email, setEmail] = useState("");

  const login = trpc.public.login.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome back, ${data.name}`);
      // Set session
      localStorage.setItem("gearbox_user_id", data.userId.toString());
      setActiveLedgerId(data.ledgerId);
      setActiveLedgerType('trades'); // Default to trades for now
      // Redirect to dashboard
      setLocation("/trades/dashboard");
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email });
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
                <Zap size={12} className="fill-primary" /> Member Access
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic">Login</h1>
            <p className="text-white/40">Access your workshop command center.</p>
        </div>

        <Card className="glass-dark border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="sr-only">Login</CardTitle>
            <CardDescription className="sr-only">Enter your email to login</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/60">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="john@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
              </div>

              <div className="pt-4">
                <Button 
                    type="submit" 
                    className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
                    disabled={login.isLoading}
                >
                    {login.isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        "Enter Dashboard"
                    )}
                </Button>
              </div>

              <div className="text-center text-sm text-white/40 mt-4">
                Don't have an account? <span className="text-primary hover:underline cursor-pointer" onClick={() => setLocation('/app/signup')}>Sign up</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
