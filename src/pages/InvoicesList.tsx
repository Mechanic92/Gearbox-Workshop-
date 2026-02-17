import { useState } from "react";
import { useLocation } from "wouter";
import { useLedger } from "@/contexts/LedgerContext";
import { trpc } from "@/lib/trpc";
import {
  FileText, Search, Loader2, DollarSign,
  Clock, CheckCircle2, AlertCircle, XCircle, ArrowRight, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string; glow: string }> = {
  draft: { color: "text-zinc-400", bg: "bg-zinc-400/10", icon: FileText, label: "Draft", glow: "" },
  sent: { color: "text-blue-400", bg: "bg-blue-400/10", icon: Send, label: "Sent", glow: "shadow-[0_0_20px_rgba(59,130,246,0.2)]" },
  paid: { color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2, label: "Paid", glow: "shadow-[0_0_20px_rgba(52,211,153,0.2)]" },
  overdue: { color: "text-red-400", bg: "bg-red-400/10", icon: AlertCircle, label: "Overdue", glow: "shadow-[0_0_20px_rgba(248,113,113,0.3)]" },
  cancelled: { color: "text-red-400", bg: "bg-red-400/10", icon: XCircle, label: "Cancelled", glow: "" },
};

export default function InvoicesList() {
  const [, navigate] = useLocation();
  const { activeLedgerId } = useLedger();
  const [searchQuery, setSearchQuery] = useState("");

  if (!activeLedgerId) {
    navigate("/setup/ledger");
    return null;
  }

  const { data: invoices = [], isLoading } = trpc.invoice.list.useQuery(
    { ledgerId: activeLedgerId },
    { enabled: !!activeLedgerId }
  );

  const filtered = invoices.filter((inv: any) =>
    inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.jobNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOutstanding = invoices
    .filter((i: any) => i.status === "sent" || i.status === "overdue")
    .reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);

  const totalPaid = invoices
    .filter((i: any) => i.status === "paid")
    .reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[200px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-white mb-3">
              Invoice <span className="text-primary italic">Ledger.</span>
            </h1>
            <p className="text-white/50 font-medium text-lg">
              Track, send, and reconcile all workshop invoices
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card className="border-none glass rounded-[2rem] p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-400/10 flex items-center justify-center">
                <FileText className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">Total Invoices</p>
                <p className="text-3xl font-black text-white">{invoices.length}</p>
              </div>
            </div>
          </Card>
          <Card className="border-none glass rounded-[2rem] p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 flex items-center justify-center">
                <Clock className="text-amber-400" size={24} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">Outstanding</p>
                <p className="text-3xl font-black text-white">${totalOutstanding.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="border-none glass rounded-[2rem] p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 flex items-center justify-center">
                <DollarSign className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">Collected</p>
                <p className="text-3xl font-black text-white">${totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <Input
              placeholder="Search invoices, job numbers, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-16 pl-16 bg-card/5 border-white/10 text-white placeholder:text-white/30 rounded-2xl font-medium text-base"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-none glass p-16 text-center rounded-[3rem]">
            <div className="w-24 h-24 rounded-[2rem] bg-card/5 flex items-center justify-center mx-auto mb-6">
              <FileText size={40} className="text-white/20" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">No Invoices Found</h3>
            <p className="text-white/50 mb-8">
              {searchQuery ? "Try adjusting your search criteria" : "Generate your first invoice from a completed job"}
            </p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filtered.map((inv: any) => {
              const st = statusConfig[inv.status] || statusConfig.draft;
              const StatusIcon = st.icon;
              return (
                <Card
                  key={inv.id}
                  onClick={() => navigate(`/trades/jobs/${inv.jobId}`)}
                  className={cn(
                    "border-none glass hover:bg-card/10 transition-all duration-500 cursor-pointer rounded-[2rem] overflow-hidden group",
                    st.glow
                  )}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={cn("px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest", st.bg, st.color)}>
                            <StatusIcon size={14} className="inline mr-2" />
                            {st.label}
                          </div>
                          <div className="text-white/30 font-mono text-sm">#{inv.invoiceNumber}</div>
                        </div>
                        <h3 className="text-xl font-black text-white mb-2 group-hover:text-primary transition-colors">
                          {inv.customerName || `Job #${inv.jobNumber || inv.jobId}`}
                        </h3>
                        <div className="flex items-center gap-6 text-white/50 text-sm font-medium">
                          {inv.jobNumber && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              Job #{inv.jobNumber}
                            </div>
                          )}
                          {inv.invoiceDate && (
                            <div className="flex items-center gap-2">
                              <Clock size={14} />
                              {new Date(inv.invoiceDate).toLocaleDateString()}
                            </div>
                          )}
                          {inv.dueDate && (
                            <div className="flex items-center gap-2">
                              <AlertCircle size={14} />
                              Due {new Date(inv.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-4">
                        <div className="text-right">
                          <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Total</div>
                          <div className="text-3xl font-black text-white flex items-center gap-2">
                            <DollarSign size={24} className="text-primary" />
                            {(inv.totalAmount || 0).toFixed(2)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          className="h-12 px-6 rounded-xl bg-card/5 hover:bg-primary/20 font-bold group-hover:bg-primary group-hover:text-foreground transition-all"
                        >
                          View Job
                          <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
