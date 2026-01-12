import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Settings as SettingsIcon, Wrench, ArrowRight, Zap, Shield, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div 
                className="absolute w-[1000px] h-[1000px] rounded-full blur-[200px] opacity-[0.2] transition-all duration-1000"
                style={{ 
                    background: 'radial-gradient(circle, oklch(var(--primary)) 0%, transparent 70%)',
                    left: `${mousePos.x - 500}px`,
                    top: `${mousePos.y - 500}px`,
                }}
            />
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[150px] animate-pulse" />
        </div>

      <div className="max-w-5xl w-full space-y-20 relative z-10">
        <header className="text-center space-y-8 animate-in fade-in slide-in-from-top-8 duration-1000">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass-dark text-primary text-xs font-black uppercase tracking-[0.3em] border border-primary/20">
            <Zap size={14} className="fill-primary" /> 2026 Ecosystem Early Access
          </div>
          <h1 className="text-6xl sm:text-9xl font-black tracking-tighter text-white italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-none">
            GearBox <br/> <span className="text-primary italic">Fintech OS.</span>
          </h1>
          <p className="text-xl sm:text-2xl text-white/50 max-w-2xl mx-auto font-medium leading-relaxed uppercase tracking-tighter">
            The high-trust operating system for the next generation of New Zealand trades.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          {[
            {
               title: "Command Center",
               desc: "Full operational visibility, revenue intelligence, and customer networks.",
               icon: LayoutDashboard,
               path: "/trades/dashboard",
               color: "primary",
               btn: "Enter Dashboard"
            },
            {
               title: "System Config",
               desc: "Initialize digital ledgers, taxation logic, and core business architecture.",
               icon: SettingsIcon,
               path: "/setup/ledger",
               color: "white",
               btn: "Initialize Ledger"
            }
          ].map((card, i) => (
              <div key={i} className="group relative p-1 rounded-[3rem] transition-all duration-700 hover:bg-gradient-to-br from-white/20 to-transparent premium-shadow overflow-hidden">
                <Card className="h-full border-none glass-dark rounded-[2.9rem] overflow-hidden group-hover:bg-white/5 transition-all duration-500">
                   <CardContent className="p-12 space-y-8">
                     <div className={cn(
                        "w-20 h-20 rounded-3xl flex items-center justify-center transition-transform duration-700 group-hover:scale-110",
                        card.color === 'primary' ? "bg-primary/20 text-primary border border-primary/20 shadow-[0_0_30px_oklch(var(--primary)/0.2)]" : "bg-white/10 text-white border border-white/10"
                     )}>
                        <card.icon size={40} strokeWidth={2.5} />
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-4xl font-black tracking-tighter text-white uppercase italic">{card.title}</h3>
                        <p className="text-white/40 font-medium text-lg leading-relaxed">{card.desc}</p>
                     </div>
                     <Link href={card.path}>
                        <Button className={cn(
                            "w-full h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-500 group/btn",
                            card.color === 'primary' ? "bg-white text-black hover:bg-primary hover:text-white" : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                        )}>
                            {card.btn}
                            <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-2 transition-transform" strokeWidth={3} />
                        </Button>
                     </Link>
                   </CardContent>
                </Card>
              </div>
          ))}
        </div>

        <footer className="flex flex-wrap justify-center gap-12 pt-10 animate-in fade-in duration-1000 delay-500">
          {[
            { label: "Workshop Protocol", icon: Wrench, color: "text-primary" },
            { label: "Security Locked", icon: Shield, color: "text-emerald-500" },
            { label: "GST Compliant", icon: Globe, color: "text-blue-500" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 group cursor-default">
              <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-125", item.color)} />
              <span className="font-black text-white/40 uppercase tracking-[0.3em] text-[10px]">{item.label}</span>
            </div>
          ))}
        </footer>
      </div>
      
      <div className="fixed bottom-10 left-10 text-[10px] text-white/20 font-black uppercase tracking-[0.5em] italic">
        GearBox Enterprise // v4.0.0-PROD
      </div>
    </div>
  );
}
