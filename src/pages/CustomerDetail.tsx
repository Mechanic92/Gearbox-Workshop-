import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLedger } from "@/contexts/LedgerContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft, User, Mail, Phone, MapPin, Loader2,
  Save, Wrench, Car, FileText, Clock
} from "lucide-react";

export default function CustomerDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/trades/customers/:id") as [boolean, { id?: string } | null];
  const customerId = params?.id ? parseInt(params.id, 10) : null;
  const { activeLedgerId } = useLedger();

  const { data: customer, isLoading, refetch } = trpc.customer.get.useQuery(
    { id: customerId! },
    { enabled: !!customerId }
  );

  const { data: jobs } = trpc.job.list.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const { data: vehicles } = trpc.vehicle.list.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const updateMutation = trpc.customer.update.useMutation({
    onSuccess: () => {
      toast.success("Customer updated");
      refetch();
      setEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const customerJobs = jobs?.filter((j: any) => j.customerId === customerId) || [];
  const customerVehicles = vehicles?.filter((v: any) => v.customerId === customerId) || [];

  if (isLoading || !customer) {
    return (
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const startEdit = () => {
    setForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      mobile: customer.mobile || "",
      address: customer.address || "",
      city: customer.city || "",
      postcode: customer.postcode || "",
      notes: customer.notes || "",
    });
    setEditing(true);
  };

  const saveEdit = () => {
    updateMutation.mutate({
      id: customer.id,
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      notes: form.notes || undefined,
    } as any);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background pb-32">
      <div className="sticky top-0 z-30 bg-card/80 dark:bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/trades/customers")}>
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-xl font-black tracking-tighter">{customer.name}</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Client #{customer.id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={saveEdit} disabled={updateMutation.isLoading}>
                  {updateMutation.isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={startEdit}>Edit</Button>
            )}
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-5xl space-y-8">
        {/* Contact Info */}
        <Card className="border-none shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-6 flex items-center gap-2">
              <User size={14} /> Contact Information
            </h2>
            {editing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Mobile</Label>
                  <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="h-12 font-bold" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Address</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-12 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">City</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-12 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Postcode</Label>
                  <Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} className="h-12 font-bold" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[100px] font-medium" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30">
                  <Mail size={16} className="text-primary" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Email</p>
                    <p className="font-bold text-sm">{customer.email || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30">
                  <Phone size={16} className="text-primary" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Phone</p>
                    <p className="font-bold text-sm">{customer.mobile || customer.phone || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 md:col-span-2">
                  <MapPin size={16} className="text-primary" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Address</p>
                    <p className="font-bold text-sm">
                      {[customer.address, customer.city, customer.postcode].filter(Boolean).join(", ") || "Not set"}
                    </p>
                  </div>
                </div>
                {customer.notes && (
                  <div className="p-4 rounded-2xl bg-muted/30 md:col-span-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Notes</p>
                    <p className="text-sm font-medium whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicles */}
        <Card className="border-none shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-6 flex items-center gap-2">
              <Car size={14} /> Vehicles ({customerVehicles.length})
            </h2>
            {customerVehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vehicles linked to this customer.</p>
            ) : (
              <div className="space-y-3">
                {customerVehicles.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/trades/vehicles`)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Car size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-black text-sm">{v.make} {v.model} ({v.year})</p>
                        <p className="text-xs text-muted-foreground font-bold">{v.licensePlate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job History */}
        <Card className="border-none shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-6 flex items-center gap-2">
              <Wrench size={14} /> Job History ({customerJobs.length})
            </h2>
            {customerJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs for this customer yet.</p>
            ) : (
              <div className="space-y-3">
                {customerJobs.map((j: any) => (
                  <div key={j.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/trades/jobs/${j.id}`)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileText size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-black text-sm">#{j.jobNumber}</p>
                        <p className="text-xs text-muted-foreground font-bold">{j.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{j.status}</p>
                      {j.createdAt && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock size={10} /> {new Date(j.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
