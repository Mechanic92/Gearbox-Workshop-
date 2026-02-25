import React, { useState, useEffect } from "react";
import { Sparkles, Cpu, Send, X, Bot, ShieldCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function AICommandOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 4000);
    return () => clearInterval(interval);
  }, []);

  const utils = trpc.useContext();
  const processCommand = trpc.agent.processCommand.useMutation({
    onSuccess: (data: any) => {
        setIsProcessing(false);
        setQuery("");
        
        if (data.type === 'profitability_report') {
            toast.success(data.message, {
                description: `Revenue: $${data.data.revenue.toFixed(2)} | Profit: $${data.data.profit.toFixed(2)} (${data.data.margin})`,
                duration: 5000,
            });
        } else if (data.type === 'action_response') {
            toast.info(data.message);
            if (data.action === 'navigate' && data.target) {
                // In a real app we'd use useLocation or similar, for now just toast
                 window.location.href = data.target;
            }
        } else {
            toast(data.message);
        }
        setIsOpen(false);
    },
    onError: (err) => {
        setIsProcessing(false);
        toast.error("AI Error: " + err.message);
    }
  });

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsProcessing(true);
    processCommand.mutate({ query });
  };

  return (
    <>
      {/* Floating AI Orb */}
      <motion.div 
        className="fixed bottom-8 right-8 z-[100]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 12 }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-700",
            "bg-primary shadow-[0_0_40px_oklch(var(--primary)/0.3)] hover:shadow-[0_0_60px_oklch(var(--primary)/0.6)]",
            "group overflow-hidden border-4 border-white/20"
          )}
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-20 bg-[conic-gradient(from_0deg,transparent,white,transparent)]"
          />
          <Sparkles className="relative z-10 w-8 h-8 text-black fill-current group-hover:scale-110 transition-transform" />
        </button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              layoutId="ai-command"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl glass rounded-[3rem] border border-white/10 shadow-[0_0_100px_oklch(var(--primary)/0.2)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />
              
              <div className="p-8">
                <header className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                      <Bot className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white">Neural Command Interface</h3>
                      <p className="text-[10px] font-bold text-primary animate-pulse">SYSTEM VERSION 2026.4 // OPERATIONAL</p>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </header>

                <div className="space-y-8">
                  <form onSubmit={handleCommand} className="relative">
                    <input 
                      autoFocus
                      placeholder="Instruct AI Agent... (e.g. 'Sync accounting for Feb', 'Scan for leaking revenue')"
                      className="w-full bg-white/5 border-2 border-white/10 rounded-2xl h-16 px-6 text-lg font-bold placeholder:text-white/10 outline-none focus:border-primary/50 transition-all italic tracking-tight"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <button 
                      type="submit"
                      disabled={isProcessing}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? <Activity className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                        <ShieldCheck size={14} /> Autonomous Status
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/40">Inventory Logic</span>
                          <span className="font-bold text-emerald-500 italic">OPTIMIZED</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/40">Accounts Sync</span>
                          <span className="font-bold text-primary italic">STANDBY</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/40">Communication Hub</span>
                          <span className="font-bold text-blue-400 italic">SCANNING</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400/60 flex items-center gap-2">
                        <Sparkles size={14} /> Recommended Loops
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <button className="text-[10px] font-bold text-left px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                          Initiate Profit Recovery Scan
                        </button>
                        <button className="text-[10px] font-bold text-left px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                          Audit Customer Churn Probability
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 p-4 text-center">
                <p className="text-[8px] font-black uppercase tracking-[0.5em] text-primary/60 italic">Gearbox OS // Autonomous Governance Node</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
