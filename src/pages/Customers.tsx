import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useLedger } from "@/contexts/LedgerContext";
import { 
  ArrowLeft, Plus, Search, Mail, Phone, Loader2,
  MapPin, User, Users, ChevronRight, 
  Database, UserCheck, MessageSquare, Globe
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Customers() {
  const [, setLocation] = useLocation();
  const { activeLedgerId } = useLedger();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [notes, setNotes] = useState("");

  const { data: customers, isLoading, refetch } = trpc.customer.list.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const createCustomerMutation = trpc.customer.create.useMutation({
    onSuccess: () => {
      toast.success("Client records synchronized");
      refetch();
      setIsAddDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setName(""); setEmail(""); setPhone(""); setMobile("");
    setAddress(""); setCity(""); setPostcode(""); setNotes("");
  };

  const handleAddCustomer = () => {
    if (!name.trim()) { toast.error("Client identity is required"); return; }
    createCustomerMutation.mutate({
      ledgerId: activeLedgerId!,
      name, email: email || undefined, phone: phone || undefined,
      mobile: mobile || undefined, address: address || undefined,
      city: city || undefined, postcode: postcode || undefined,
      notes: notes || undefined,
    });
  };

  const filteredCustomers = customers?.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.mobile?.includes(searchTerm)
  );

  if (!activeLedgerId) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background pb-32">
      {/* Premium Header */}
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
              <h1 className="text-xl font-black tracking-tighter">Client Repository</h1>
              <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{customers?.length || 0} Registered Entities</p>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>
            </div>
          </div>
          <Button 
            size="sm" 
            className="shadow-lg shadow-primary/20 font-black text-[10px] uppercase h-10 px-6"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> New Client
          </Button>
        </div>
      </div>

      <div className="container py-8 max-w-6xl space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-card shadow-xl shadow-black/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Users size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total Clients</p>
                    <p className="text-xl font-black">{customers?.length || 0}</p>
                </div>
            </div>
            <div className="p-6 rounded-3xl bg-white dark:bg-card shadow-xl shadow-black/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
                    <UserCheck size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Verified</p>
                    <p className="text-xl font-black">100%</p>
                </div>
            </div>
        </div>

        {/* Intelligent Search */}
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/40 group-focus-within:text-primary transition-colors">
                <Search size={20} />
            </div>
            <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Query name, contact, or location metadata..."
                className="pl-12 h-16 border-none shadow-2xl shadow-black/[0.03] text-lg font-bold rounded-3xl bg-white dark:bg-card placeholder:font-medium"
            />
            <div className="absolute inset-y-0 right-4 flex items-center gap-2">
                <Badge variant="outline" className="h-6 font-black uppercase text-[9px] opacity-40">Filters: OFF</Badge>
            </div>
        </div>

        {/* Client Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-48 rounded-3xl bg-white dark:bg-card animate-pulse shadow-xl shadow-black/5" />
                ))
            ) : filteredCustomers && filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                    <Card 
                        key={customer.id} 
                        className="group border-none shadow-xl shadow-black/5 bg-white dark:bg-card hover:scale-[1.01] transition-all duration-300 overflow-hidden cursor-pointer"
                        onClick={() => setLocation(`/trades/customers/${customer.id}`)}
                    >
                        <CardContent className="p-0 flex">
                            <div className="w-2 bg-primary/20 group-hover:bg-primary transition-colors" />
                            <div className="flex-1 p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black tracking-tighter">{customer.name}</h3>
                                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest opacity-40">Client Type: Premium</Badge>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-xl">
                                        <ChevronRight size={18} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                            <Mail size={10} /> Communication
                                        </p>
                                        <p className="text-xs font-bold truncate">{customer.email || "No Email Registered"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                            <Phone size={10} /> Contact Line
                                        </p>
                                        <p className="text-xs font-bold truncate">{customer.mobile || customer.phone || "No Connection"}</p>
                                    </div>
                                </div>

                                {customer.address && (
                                    <div className="p-3 rounded-2xl bg-muted/20 border border-border/10 flex items-center gap-3">
                                        <MapPin size={14} className="text-primary opacity-60" />
                                        <p className="text-[10px] font-bold truncate opacity-60">
                                            {customer.address}, {customer.city} {customer.postcode}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="col-span-full py-24 text-center space-y-6">
                    <div className="w-24 h-24 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto">
                        <Database className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black tracking-tighter">Repository Empty</h3>
                        <p className="text-muted-foreground text-sm max-w-xs mx-auto">No client entities match your current query or the sync has not been initiated.</p>
                    </div>
                    <Button onClick={() => setIsAddDialogOpen(true)} className="h-12 px-8 shadow-xl">
                        Register New Client Entity
                    </Button>
                </div>
            )}
        </div>
      </div>

      {/* Premium Registration Modal */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-white dark:bg-card">
          <div className="bg-primary p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Users size={100} />
            </div>
            <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tighter mb-2">Register Client Entity</DialogTitle>
                <DialogDescription className="text-white/70 font-medium">Create a high-fidelity digital profile for your customer management workflow.</DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
             <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <User size={16} className="text-primary" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Identity Data</h3>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Client Full Name / Business Legal Title</Label>
                    <Input className="h-14 border-2 font-black text-xl px-6 focus:ring-primary/20" placeholder="e.g., Enterprise Solutions Ltd" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
             </section>

             <section className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                    <MessageSquare size={16} className="text-muted-foreground" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Communication Matrix</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Primary Email</Label>
                        <Input className="h-12 border-2 font-bold" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Primary Mobile Line</Label>
                        <Input className="h-12 border-2 font-bold" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                    </div>
                </div>
             </section>

             <section className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                    <Globe size={16} className="text-muted-foreground" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Geolocation Metadata</h3>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Physical Address</Label>
                    <Input className="h-12 border-2 font-bold" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Settlement / City</Label>
                        <Input className="h-12 border-2 font-bold" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">ZIP / Postcode</Label>
                        <Input className="h-12 border-2 font-bold" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
                    </div>
                </div>
             </section>

             <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Database size={16} className="text-muted-foreground" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Operational Intelligence</h3>
                </div>
                <Textarea className="min-h-[120px] border-2 font-medium p-4" placeholder="Document specific client needs, historical context, or special handling requirements..." value={notes} onChange={(e) => setNotes(e.target.value)} />
             </section>
          </div>

          <DialogFooter className="p-8 bg-muted/20 flex gap-3">
            <Button variant="ghost" className="flex-1 font-bold h-12" onClick={() => setIsAddDialogOpen(false)}>Discard</Button>
            <Button
              className="flex-[2] h-12 shadow-xl shadow-primary/20 font-black tracking-widest uppercase text-xs"
              onClick={handleAddCustomer}
              disabled={createCustomerMutation.isPending || !name.trim()}
            >
              {createCustomerMutation.isPending ? <Loader2 className="animate-spin" /> : "Authorize Registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
