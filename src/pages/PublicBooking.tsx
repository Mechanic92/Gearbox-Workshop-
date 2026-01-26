import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, ChevronRight, User, Car, Zap, ShieldCheck, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PublicBooking() {
  const { shopId } = useParams<{ shopId: string }>();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    serviceType: "",
    rego: "",
    notes: ""
  });

  const { data: shopInfo, isLoading: shopLoading } = trpc.public.getShopInfo.useQuery(
    { shopId: shopId || "" },
    { enabled: !!shopId }
  );

  const { data: availability, isLoading: availabilityLoading } = trpc.public.availability.useQuery(
    { 
      shopId: shopId || "", 
      date: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
      serviceType: formData.serviceType || "General"
    },
    { enabled: !!shopId && !!selectedDate }
  );

  const createBookingMutation = trpc.public.createBooking.useMutation({
    onSuccess: () => {
      setStep(3);
      toast.success("Protocol Accepted. Your service window is secured.");
    },
    onError: (err) => {
        toast.error(err.message || "Failed to finalize reservation");
    }
  });

  // Next 14 days
  const nextDays = Array.from({ length: 14 }).map((_, i) => addDays(startOfDay(new Date()), i));

  const handleNext = () => {
      if (step === 1 && (!selectedDate || !selectedTime || !formData.serviceType)) {
          toast.error("Please complete the temporal configuration");
          return;
      }
      setStep(step + 1);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  if (shopLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#070708] space-y-6">
              <div className="w-16 h-16 border-4 border-white/5 border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Synchronizing with Workshop Node...</p>
          </div>
      );
  }

  if (step === 3) {
      return (
          <div className="min-h-screen bg-[#070708] flex items-center justify-center p-6 sm:p-12 overflow-hidden selection:bg-primary selection:text-black">
              <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
                  <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[150px]" />
              </div>

              <Card className="max-w-xl w-full border-none glass-dark rounded-[4rem] p-12 text-center space-y-10 relative z-10 premium-shadow">
                  <div className="w-32 h-32 bg-primary/10 border border-primary/20 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/20">
                      <CheckCircle2 className="text-primary w-16 h-16" strokeWidth={3} />
                  </div>
                  <div className="space-y-4">
                      <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none">Security Cleared.</h2>
                      <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">Your Reservation is Synchronized</p>
                  </div>
                  <p className="text-white/60 font-medium leading-relaxed">
                      Protocol successful. {shopInfo?.name} has received your reservation for {format(selectedDate!, "MMMM do")} at {selectedTime}. A secure confirmation has been dispatched to your mobile endpoint.
                  </p>
                  <Button 
                    className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all duration-500"
                    onClick={() => window.location.reload()}
                  >
                      Return to Origin
                  </Button>
              </Card>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#070708] text-white selection:bg-primary selection:text-black font-sans antialiased overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.08),transparent_50%)]" />
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.05),transparent_50%)]" />
      </div>

      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="container max-w-7xl h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black italic text-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                {shopInfo?.name?.charAt(0) || 'G'}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">{shopInfo?.name || 'GEARBOX'}</h1>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-1.5 flex items-center gap-1.5">
                  <ShieldCheck size={10} /> Secure Booking Portal
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
              {[
                  { id: 1, label: "Tuning" },
                  { id: 2, label: "Identity" }
              ].map(s => (
                  <div key={s.id} className={cn("flex items-center gap-3 transition-opacity", step !== s.id && "opacity-30")}>
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">{s.label}</span>
                      <div className={cn("w-8 h-1 rounded-full", step === s.id ? "bg-primary" : "bg-white/10")} />
                  </div>
              ))}
          </div>
        </div>
      </header>

      <main className="container max-w-7xl py-12 lg:py-24 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 items-start">
            
            <div className="lg:col-span-12 xl:col-span-8">
                {step === 1 ? (
                    <div className="space-y-12">
                        <section className="space-y-4">
                            <h2 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase italic leading-[0.85]">
                                Configure <span className="text-primary">Performance.</span>
                            </h2>
                            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-sm max-w-2xl">
                                Select your operational window and service classification to initialize the reservation sequence.
                            </p>
                        </section>

                        <div className="space-y-8">
                             <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-1">Service Classification</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {(shopInfo?.services || []).map(s => (
                                        <button 
                                            key={s.id}
                                            onClick={() => setFormData(prev => ({ ...prev, serviceType: s.name }))}
                                            className={cn(
                                                "p-6 rounded-3xl border text-left transition-all duration-500 hover:scale-[1.02]",
                                                formData.serviceType === s.name 
                                                    ? "bg-primary border-primary text-black shadow-2xl shadow-primary/20" 
                                                    : "bg-white/5 border-white/5 text-white/60 hover:border-white/20"
                                            )}
                                        >
                                            <Zap size={20} className={cn("mb-3", formData.serviceType === s.name ? "text-black" : "text-primary")} />
                                            <p className="text-[10px] font-black uppercase tracking-widest">{s.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-1">Temporal Horizon</Label>
                                <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
                                    {nextDays.map(day => {
                                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                                        return (
                                            <button
                                                key={day.toString()}
                                                onClick={() => handleSelectDate(day)}
                                                className={cn(
                                                    "flex-shrink-0 w-24 h-28 rounded-3xl border flex flex-col items-center justify-center transition-all duration-500",
                                                    isSelected 
                                                        ? "bg-white border-white text-black shadow-2xl shadow-white/10 scale-105" 
                                                        : "bg-white/5 border-white/5 text-white/60 hover:border-white/20"
                                                )}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest mb-1">{format(day, "EEE")}</span>
                                                <span className="text-3xl font-black tracking-tighter leading-none">{format(day, "dd")}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedDate && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-1">Operational Windows (Available)</Label>
                                    {availabilityLoading ? (
                                        <div className="grid grid-cols-4 gap-4">
                                            {[1,2,3,4].map(i => <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />)}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            {availability?.slots.map(time => (
                                                <button
                                                    key={time}
                                                    onClick={() => setSelectedTime(time)}
                                                    className={cn(
                                                        "h-14 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all duration-500",
                                                        selectedTime === time
                                                            ? "bg-primary border-primary text-black shadow-xl shadow-primary/20"
                                                            : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                                                    )}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                            {availability?.slots.length === 0 && <p className="col-span-full py-8 text-center text-red-400 font-bold uppercase tracking-widest text-xs border border-dashed border-red-400/20 rounded-3xl">No operational capacity for selected date</p>}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-12">
                                <Button 
                                    className="h-24 w-full md:w-80 rounded-[2.5rem] bg-white text-black hover:bg-primary hover:text-white transition-all duration-700 font-black uppercase tracking-[0.3em] text-xs italic group"
                                    onClick={handleNext}
                                    disabled={!selectedDate || !selectedTime || !formData.serviceType}
                                >
                                    Proceed to Identity <ChevronRight className="ml-3 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12 max-w-xl">
                        <section className="space-y-4">
                            <h2 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase italic leading-[0.85]">
                                Secure <span className="text-primary">Identity.</span>
                            </h2>
                            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-sm">
                                Provide your security credentials to synchronize this reservation with the workshop mainframe.
                            </p>
                        </section>

                        <div className="space-y-8 pt-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Full Legal Name</Label>
                                <Input 
                                    className="h-16 bg-white/5 border-white/10 rounded-2xl font-black italic uppercase placeholder:text-white/10 focus:ring-primary/20"
                                    placeholder="e.g. Marcus Aurelius"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Digital Mail</Label>
                                    <Input 
                                        className="h-16 bg-white/5 border-white/10 rounded-2xl font-black italic uppercase placeholder:text-white/10 focus:ring-primary/20"
                                        placeholder="user@cyber.net"
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Mobile Endpoint</Label>
                                    <Input 
                                        className="h-16 bg-white/5 border-white/10 rounded-2xl font-black italic uppercase placeholder:text-white/10 focus:ring-primary/20"
                                        placeholder="+64 2X XXX XXXX"
                                        value={formData.phone}
                                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Vehicle Unit Identifier (Plate)</Label>
                                <Input 
                                    className="h-16 bg-white/5 border-white/10 rounded-2xl font-black italic uppercase placeholder:text-white/10 focus:ring-primary/20 text-3xl text-center"
                                    placeholder="XYZ123"
                                    value={formData.rego}
                                    onChange={e => setFormData(prev => ({ ...prev, rego: e.target.value }))}
                                />
                            </div>

                            <div className="pt-12 flex gap-4">
                                <Button 
                                    variant="outline"
                                    className="h-20 rounded-[2rem] border-white/10 font-black uppercase tracking-widest text-[10px] px-10"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </Button>
                                <Button 
                                    className="h-20 flex-1 rounded-[2.5rem] bg-white text-black hover:bg-primary hover:text-white transition-all duration-700 font-black uppercase tracking-[0.3em] text-xs italic premium-shadow"
                                    onClick={() => createBookingMutation.mutate({
                                        shopId: shopId!,
                                        customerName: formData.name,
                                        customerEmail: formData.email,
                                        customerPhone: formData.phone,
                                        vehicleRegistration: formData.rego,
                                        serviceType: formData.serviceType,
                                        preferredDate: selectedDate!.toISOString().split('T')[0],
                                        preferredTime: selectedTime!,
                                        captchaToken: "mock-token"
                                    })}
                                    disabled={createBookingMutation.isLoading || !formData.name || !formData.email || !formData.phone}
                                >
                                    {createBookingMutation.isLoading ? <Loader2 className="animate-spin" /> : "Commit Reservation"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="lg:col-span-12 xl:col-span-4 lg:sticky lg:top-36">
                <Card className="border-none glass-dark rounded-[3.5rem] p-12 space-y-12 premium-shadow overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-primary/10 rounded-full blur-3xl opacity-20" />
                    
                    <div className="relative space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                                <Zap size={24} fill="currentColor" />
                            </div>
                            <h3 className="text-xl font-black tracking-tighter uppercase italic italic">Reservation Intel</h3>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: "Performance Unit", val: formData.serviceType || "Unconfigured", icon: Zap },
                                { label: "Temporal Window", val: selectedDate ? format(selectedDate, "dd MMM yyyy") : "Pending", icon: Calendar },
                                { label: "Maturity Time", val: selectedTime || "Pending", icon: Clock },
                                { label: "Asset Module", val: formData.rego || "Unknown", icon: Car },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-6 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:text-primary transition-colors">
                                        <item.icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{item.label}</p>
                                        <p className="text-sm font-black uppercase tracking-tight">{item.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="h-px bg-white/5" />
                        
                        <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/20 flex items-center gap-2">
                                <ShieldCheck size={12} className="text-primary" /> Multi-Layer Security Enabled
                            </p>
                            <p className="text-[9px] text-white/30 font-medium leading-relaxed">
                                This reservation is encrypted using Advanced Gearbox Protocol. Your data remains confidential and secure.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}

