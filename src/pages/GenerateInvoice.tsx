import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowLeft, Download, FileText, Loader2, Send, 
  ShieldCheck, Mail, Clock, CheckCircle2,
  ChevronRight, Building2, User
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function GenerateInvoice() {
  const params = useParams<{ id: string }>();
  const idValue = params?.id ? parseInt(params.id, 10) : null;
  const { activeLedgerId } = useLedger();
  const [, setLocation] = useLocation();

  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(Math.random() * 9000) + 1000}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [paymentTerms, setPaymentTerms] = useState("14");
  const [notes, setNotes] = useState("");
  const [includeGST, setIncludeGST] = useState(true);

  const { data: job, isLoading } = trpc.job.getWithCosts.useQuery(
    { id: idValue! },
    { enabled: !!idValue }
  );

  const { data: ledger } = trpc.ledger.get.useQuery(
    { id: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const invoiceCalculations = useMemo(() => {
    if (!job) return null;
    const subtotal = ((job.job.quotedPrice as any) as number);
    const gstRate = 0.15;
    const gstAmount = includeGST && ledger?.gstRegistered ? subtotal * gstRate : 0;
    const total = subtotal + gstAmount;
    return { subtotal, gstAmount, total, gstRate: gstRate * 100 };
  }, [job, includeGST, ledger]);

  const generateInvoiceMutation = trpc.invoice.create.useMutation({
    onSuccess: () => {
      toast.success("Economic record synchronized successfully");
      setLocation(`/trades/jobs/${idValue}`);
    },
  });

  const handleGenerateInvoice = () => {
    if (!invoiceNumber.trim() || !invoiceCalculations) return;
    generateInvoiceMutation.mutate({
      ledgerId: activeLedgerId!,
      jobId: idValue!,
      customerId: job.job.customerId || 1,
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      subtotal: parseFloat(invoiceCalculations.subtotal as any),
      gstAmount: parseFloat(invoiceCalculations.gstAmount as any),
      totalAmount: parseFloat(invoiceCalculations.total as any),
      notes: notes.trim() || undefined,
    });
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-black tracking-widest uppercase opacity-40">Compiling Document...</p>
    </div>
  );

  if (!job) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background pb-32">
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-muted"
              onClick={() => setLocation(`/trades/jobs/${idValue}`)}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-xl font-black tracking-tighter">Billing Matrix</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Reference: {job.job.jobNumber}</p>
            </div>
          </div>
          <Button 
            className="shadow-lg shadow-primary/20 font-black text-xs uppercase h-10 px-8"
            onClick={handleGenerateInvoice}
            disabled={generateInvoiceMutation.isPending}
          >
            {generateInvoiceMutation.isPending ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Commit Invoice</>}
          </Button>
        </div>
      </div>

      <div className="container py-8 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Information Flow */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/40 flex items-center gap-2">
                                <User size={14} /> Consignee
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-xl font-black tracking-tighter">{job.job.customerName || "External Client"}</h3>
                            <p className="text-xs font-bold text-muted-foreground mt-1">{job.job.customerEmail || "No digital endpoint registered"}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/40 flex items-center gap-2">
                                <Building2 size={14} /> Originator
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-xl font-black tracking-tighter">GearBox Enterprise</h3>
                            <p className="text-xs font-bold text-primary mt-1">NZ GST Registered: {ledger?.gstRegistered ? "ACTIVE" : "NONE"}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-2xl shadow-black/5 bg-white dark:bg-card overflow-hidden">
                    <div className="bg-muted/30 p-6 border-b border-border/10 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Billing Parameters</h3>
                        <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest">IRD AIM Compliant</Badge>
                    </div>
                    <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Invoice Sequence ID</Label>
                                <Input className="h-14 border-2 font-black text-xl px-6 focus:ring-primary/20" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Payment Maturation</Label>
                                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                                    <SelectTrigger className="h-14 border-2 font-bold px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Immediate Settlement</SelectItem>
                                        <SelectItem value="7">7 Day Cycle</SelectItem>
                                        <SelectItem value="14">14 Day Cycle</SelectItem>
                                        <SelectItem value="20">20th Month Following</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Emission Date</Label>
                                <Input type="date" className="h-12 border-2 font-bold" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Maturity Date</Label>
                                <Input type="date" className="h-12 border-2 font-bold" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Transactional Notes</Label>
                            <Textarea className="min-h-[140px] border-2 font-medium p-4 focus:ring-primary/20" placeholder="e.g., Bank: Westpac, Account: 00-0000-0000000-00" value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Price Hub / Sidebar */}
            <div className="space-y-8">
                <Card className="border-none shadow-2xl shadow-primary/5 bg-primary p-8 text-white relative overflow-hidden rounded-[2.5rem]">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Receipt size={120} />
                    </div>
                    <div className="relative space-y-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Invoice Summary</p>
                            <h3 className="text-4xl font-black tracking-tighter">${invoiceCalculations?.total.toLocaleString()}</h3>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex justify-between items-center text-xs font-bold opacity-80 uppercase tracking-widest">
                                <span>Operation Value</span>
                                <span>${invoiceCalculations?.subtotal.toLocaleString()}</span>
                            </div>
                            {includeGST && ledger?.gstRegistered && (
                                <div className="flex justify-between items-center text-xs font-bold opacity-80 uppercase tracking-widest">
                                    <span>Tax Component (15%)</span>
                                    <span>${invoiceCalculations?.gstAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="h-px bg-white/20" />
                            <div className="flex justify-between items-center py-2">
                                <span className="font-black text-sm uppercase tracking-widest">Final Maturity</span>
                                <span className="text-2xl font-black">${invoiceCalculations?.total.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/10 border border-white/20">
                                <Clock size={16} className="text-white" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Payment due in 14 days</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <section className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">Logistics Matrix</h4>
                    <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-black tracking-tight">Tax Identification</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Enable 15% NZ GST Calculation</p>
                                </div>
                                <Switch checked={includeGST} onCheckedChange={setIncludeGST} />
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <div className="grid grid-cols-1 gap-4">
                    <Button 
                        size="lg" 
                        className="h-16 rounded-[2rem] shadow-xl shadow-primary/20 font-black tracking-widest uppercase text-xs"
                        onClick={() => {
                            handleGenerateInvoice();
                            toast.success("Synchronizing with digital delivery network...");
                        }}
                    >
                        <Send className="w-4 h-4 mr-2" /> Email Record
                    </Button>
                    <Button variant="outline" className="h-16 rounded-[2rem] border-2 font-black tracking-widest uppercase text-xs">
                        <Download className="w-4 h-4 mr-2" /> Local Download
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function Receipt({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17.5V6.5" />
    </svg>
  );
}
