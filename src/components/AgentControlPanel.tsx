
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Bot } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

interface AgentControlPanelProps {
    job: any;
}

export function AgentControlPanel({ job }: AgentControlPanelProps) {
    const utils = trpc.useContext();
    const triggerAgent = trpc.agent.trigger.useMutation({
        onSuccess: () => {
            toast.success("Autonomous Service Advisor Activated");
            utils.job.getWithCosts.invalidate();
        },
        onError: (err) => {
            toast.error("Failed to activate agent: " + err.message);
        }
    });

    const statusColors: Record<string, string> = {
        "PENDING": "text-muted-foreground",
        "ANALYZING": "text-blue-500",
        "QUOTING": "text-orange-500",
        "AWAITING_APPROVAL": "text-purple-500",
        "COMPLETED": "text-green-500",
        "FAILED": "text-red-500",
    };

    const isRunning = ["ANALYZING", "QUOTING"].includes(job.agentStatus);

    return (
        <Card className="border-none shadow-2xl shadow-purple-500/10 bg-gradient-to-br from-purple-50/50 to-background dark:from-purple-900/10 dark:to-background overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                <Bot size={100} className="text-purple-600" />
            </div>
            <div className="bg-purple-500/10 p-4 border-b border-purple-500/10 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                        <Bot size={16} fill="currentColor" />
                    </div>
                    <div>
                        <span className="text-sm font-black text-purple-600 uppercase tracking-widest block">Autonomous Advisor</span>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    {job.agentStatus && (
                        <Badge variant="outline" className={`${statusColors[job.agentStatus] || "text-foreground"} border-current font-black text-[9px] uppercase tracking-widest`}>
                            {job.agentStatus}
                        </Badge>
                    )}
                 </div>
            </div>
             <CardContent className="p-6 relative z-10">
                <div className="space-y-4">
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        Our AI agent analyzes job requirements, checks stock, and calculates labor to generate instant draft quotes.
                    </p>

                    {isRunning ? (
                         <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-center gap-4 animate-pulse">
                            <Loader2 className="animate-spin text-purple-600" />
                            <div className="space-y-1">
                                <p className="text-xs font-black text-purple-700 uppercase tracking-widest">Processing Job...</p>
                                <p className="text-[10px] text-purple-600/70 capitalize">Current Step: {job.agentStatus?.toLowerCase()}</p>
                            </div>
                         </div>
                    ) : (
                         <Button 
                            className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-purple-500/20"
                            onClick={() => triggerAgent.mutate({ jobId: job.id })}
                            disabled={triggerAgent.isPending}
                        >
                            {triggerAgent.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Run Auto-Quote"}
                        </Button>
                    )}
                   
                    {job.agentStatus === 'COMPLETED' && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Draft Quote Created</p>
                            <p className="text-[10px] text-green-700/70 mt-1">Check the "Quotes" tab to review.</p>
                        </div>
                    )}
                </div>
             </CardContent>
        </Card>
    )
}
