import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Copy, Download, Share2, Check, X, Clock, 
  Eye, ArrowLeft, Zap, FileText, Calendar,
  DollarSign, Package, Wrench, ChevronRight,
  ShieldCheck, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export default function QuoteDetail() {
  const params = useParams<{ id: string }>();
  const quoteId = params.id ? parseInt(params.id, 10) : null;
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);

  const { data: quote, isLoading, refetch } = trpc.quote.get.useQuery(
    { id: quoteId! },
    { enabled: !!quoteId }
  );

  const updateStatusMutation = trpc.quote.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("State transition successful");
    }
  });

  const convertToJobMutation = trpc.quote.convertToJob.useMutation({
    onSuccess: (data) => {
      toast.success("Protocol converted to active service cycle");
      setLocation(`/trades/jobs/${data.jobId}`);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-6">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-white/5 border-t-primary rounded-full animate-spin" />
          <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary w-8 h-8" />
        </div>
        <p className="text-sm font-black text-muted-foreground animate-pulse tracking-[0.4em] uppercase text-center">
          Deciphering Proposal Payload...
        </p>
      </div>
    );
  }

  if (!quote) return null;

  const shareLink = `${window.location.origin}/quote-approval/${quote.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Global share link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = {
    draft: { color: "text-gray-400", bg: "bg-gray-400/10", label: "Structural Draft", icon: Clock },
    sent: { color: "text-blue-400", bg: "bg-blue-400/10", label: "Transmitted", icon: Eye },
    approved: { color: "text-emerald-400", bg: "bg-emerald-400/10", label: "Valid Consensus", icon: Check },
    rejected: { color: "text-red-400", bg: "bg-red-400/10", label: "Terminal Rejection", icon: X },
    expired: { color: "text-orange-400", bg: "bg-orange-400/10", label: "Temporal Lapse", icon: Clock },
  };

  const config = statusConfig[quote.status as keyof typeof statusConfig] || statusConfig.draft;

  return (
    <div className="min-h-screen bg-background text-white pb-32">
      {/* Dynamic Background Blur */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <header className="sticky top-0 z-30 glass border-b border-white/5">
        <div className="container py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl hover:bg-white/10 text-white/40 hover:text-white transition-all"
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black tracking-tighter uppercase italic italic"> proposal {quote.quoteNumber}</h1>
                <Badge className={cn("font-black text-[9px] uppercase tracking-widest py-1 border-none", config.bg, config.color)}>
                  {config.label}
                </Badge>
              </div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck size={12} className="text-primary" /> Security Layer: Encrypted
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button 
                variant="outline" 
                className="rounded-xl border-white/10 bg-white/5 font-black text-[10px] uppercase tracking-widest h-12 px-6"
                onClick={handleCopyLink}
             >
                <Share2 size={16} className="mr-2" /> Share
             </Button>
             {quote.status !== 'approved' && (
                <Button 
                    className="rounded-xl bg-white text-black hover:bg-primary hover:text-white transition-all duration-500 font-black text-[10px] uppercase tracking-widest h-12 px-8"
                    onClick={() => convertToJobMutation.mutate({ id: quote.id })}
                    disabled={convertToJobMutation.isLoading}
                >
                    {convertToJobMutation.isLoading ? <Loader2 className="animate-spin" /> : "Deploy to Workshop"}
                </Button>
             )}
          </div>
        </div>
      </header>

      <div className="container py-12 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Primary Analysis Hub */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none glass-dark rounded-[2.5rem] p-8 space-y-6 premium-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <Zap size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest">Target Node</h3>
                            <p className="text-lg font-black tracking-tighter uppercase italic">{quote.customerName || "Designated Recipient"}</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-none glass-dark rounded-[2.5rem] p-8 space-y-6 premium-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest">Temporal Validity</h3>
                            <p className="text-lg font-black tracking-tighter uppercase italic">{format(new Date(quote.expiryDate), "dd MMM yyyy")}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Line Items Matrix */}
            <Card className="border-none glass-dark rounded-[3rem] overflow-hidden premium-shadow">
                <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 italic">Resource Configuration</h2>
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-white/10 opacity-40">L-ID: {quote.ledgerId}</Badge>
                </div>
                <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
                        {quote.items?.map((item: any, idx: number) => (
                            <div key={idx} className="p-8 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:text-primary transition-colors">
                                        {item.itemType === 'labor' ? <Clock size={20} /> : <Package size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">{item.itemType || "Component"}</p>
                                        <p className="text-xl font-black tracking-tighter italic">{item.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-12">
                                    <div className="hidden md:block text-right">
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Intensity</p>
                                        <p className="font-bold text-sm tracking-tight">{item.quantity} units x ${item.unitPrice}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">Yield</p>
                                        <p className="text-2xl font-black tracking-tighter">${parseFloat(item.totalPrice).toFixed(2).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
          </div>

          {/* Economic Synthesis Sidebar */}
          <div className="space-y-8">
            <Card className="border-none bg-primary rounded-[3.5rem] p-10 text-black premium-shadow relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative space-y-10">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Aggregate Valuation</p>
                        <h3 className="text-6xl font-black tracking-tighter italic leading-none">${quote.totalAmount.toLocaleString()}</h3>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex justify-between items-center text-[10px] font-bold opacity-40 uppercase tracking-widest">
                            <span>Base Value</span>
                            <span>${quote.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold opacity-40 uppercase tracking-widest">
                            <span>Tax Component</span>
                            <span>${quote.gstAmount.toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-black/10" />
                        <div className="flex justify-between items-center py-2">
                            <span className="font-black text-xs uppercase tracking-[0.3em] italic">Final Yield</span>
                            <span className="text-3xl font-black">${quote.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-4">
                {quote.status === 'sent' && (
                    <div className="grid grid-cols-2 gap-4">
                        <Button 
                            variant="outline" 
                            className="h-16 rounded-[2rem] border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 font-black uppercase tracking-widest text-[10px]"
                            onClick={() => updateStatusMutation.mutate({ id: quote.id, status: 'approved' })}
                        >
                            <Check className="mr-2" size={16} /> Affirm
                        </Button>
                        <Button 
                            variant="outline" 
                            className="h-16 rounded-[2rem] border-white/10 hover:bg-red-500/20 hover:border-red-500/40 text-red-400 font-black uppercase tracking-widest text-[10px]"
                            onClick={() => updateStatusMutation.mutate({ id: quote.id, status: 'rejected' })}
                        >
                            <X className="mr-2" size={16} /> Decline
                        </Button>
                    </div>
                )}

                {quote.status === 'approved' && !quote.jobId && (
                    <Button 
                        className="h-20 rounded-[2.5rem] bg-white text-black hover:bg-primary hover:text-white transition-all duration-500 font-black uppercase tracking-widest text-xs italic premium-shadow"
                        onClick={() => convertToJobMutation.mutate({ id: quote.id })}
                    >
                         Convert to Workshop Loop <ChevronRight className="ml-2" />
                    </Button>
                )}

                {quote.jobId && (
                    <Button 
                        variant="outline"
                        className="h-20 rounded-[2.5rem] border-primary/40 bg-primary/10 text-primary font-black uppercase tracking-widest text-xs italic"
                        onClick={() => setLocation(`/trades/jobs/${quote.jobId}`)}
                    >
                        Active Workshop Cycle #{quote.jobId} <Zap size={16} className="ml-3 fill-current" />
                    </Button>
                )}
            </div>

            <Card className="border-none glass-dark rounded-[2.5rem] p-8 premium-shadow">
                <header className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Protocol Logs</h3>
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </header>
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="w-px bg-white/10 relative">
                            <div className="absolute top-0 left-[-2px] w-1 h-1 rounded-full bg-primary" />
                        </div>
                        <div className="pb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Proposal Initialization</p>
                            <p className="text-[9px] text-white/40 font-bold">{format(new Date(quote.createdAt), "dd MMM yyyy HH:mm")}</p>
                        </div>
                    </div>
                    <div className="flex gap-4 opacity-50">
                        <div className="w-px bg-white/10 relative" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 italic">Awaiting Recipient Sync</p>
                            <p className="text-[9px] text-white/40 font-bold">State: {quote.status}</p>
                        </div>
                    </div>
                </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
