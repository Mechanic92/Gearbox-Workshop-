import { useState, useMemo } from "react";
import { format, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChevronLeft, ChevronRight, Clock, MapPin, Phone, Loader2, Calendar as CalendarIcon, Zap } from "lucide-react";
import { useLedger } from "@/contexts/LedgerContext";

export default function BookingCalendar() {
  const { activeLedgerId } = useLedger();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [notes, setNotes] = useState("");

  const { data: shopInfo } = trpc.public.getShopInfo.useQuery(
    { shopId: activeLedgerId?.toString() || "" },
    { enabled: !!activeLedgerId }
  );

  const createBookingMutation = trpc.booking.create.useMutation({
    onSuccess: () => {
      toast.success("Internal protocol synchronized. Booking secured.");
      // Reset form
      setSelectedDate(null);
      setSelectedTime(null);
      setServiceType("");
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setVehicleInfo("");
      setNotes("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to commit booking to ledger");
    }
  });

  // Get bookings for the current month
  const monthStart = startOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  const monthEnd = endOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Generate time slots (9 AM to 5 PM, 1-hour slots)
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    const slots = [];
    for (let i = 9; i < 17; i++) {
        slots.push(`${i.toString().padStart(2, "0")}:00`);
    }
    return slots;
  }, [selectedDate]);

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleSubmitBooking = async () => {
    if (!activeLedgerId || !selectedDate || !selectedTime || !serviceType || !customerName || !customerPhone || !customerEmail) {
      toast.error("Required fields missing for ledger entry");
      return;
    }

    createBookingMutation.mutate({
      ledgerId: activeLedgerId,
      customerName,
      customerEmail,
      customerPhone,
      vehicleInfo,
      serviceType,
      bookingDate: selectedDate,
      timeSlot: selectedTime,
      notes: notes || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Background Cinematic Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="container max-w-7xl pt-12 relative z-10">
        <header className="mb-16 space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-2 bg-primary rounded-full" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Operation: Reservation</p>
          </div>
          <h1 className="text-7xl font-black tracking-tighter text-white italic uppercase">
            Internal <span className="text-primary italic">Scheduler.</span>
          </h1>
          <p className="text-white/40 font-bold text-xl uppercase tracking-widest max-w-xl leading-snug">
            Manual override for shop-floor booking management and walk-in integration.
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* Calendar Controller */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="border-none glass-dark rounded-[3rem] overflow-hidden premium-shadow">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={handlePreviousMonth} className="rounded-full hover:bg-white/10 text-white/60">
                  <ChevronLeft size={20} />
                </Button>
                <h3 className="text-sm font-black uppercase tracking-widest italic">{format(currentDate, "MMMM yyyy")}</h3>
                <Button variant="ghost" size="icon" onClick={handleNextMonth} className="rounded-full hover:bg-white/10 text-white/60">
                  <ChevronRight size={20} />
                </Button>
              </div>
              <CardContent className="p-8">
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-[8px] font-black uppercase tracking-widest text-white/20">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 leading-none">
                  {daysInMonth.map((day) => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    const isPast = day < startOfDay(new Date());

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => handleSelectDate(day)}
                            disabled={isPast}
                            className={`
                                aspect-square flex items-center justify-center rounded-2xl text-[10px] font-black transition-all border
                                ${isSelected ? "bg-primary text-black border-primary shadow-[0_0_20px_oklch(var(--primary)/0.4)]" : ""}
                                ${isToday && !isSelected ? "border-primary/40 text-primary" : ""}
                                ${!isSelected && !isToday && !isPast ? "bg-white/5 border-white/5 text-white/60 hover:border-white/20" : ""}
                                ${isPast ? "opacity-10 cursor-not-allowed border-transparent" : ""}
                            `}
                        >
                            {format(day, "d")}
                        </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none glass-dark rounded-[2.5rem] p-8 space-y-4 premium-shadow">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">System Status</p>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <div>
                        <p className="text-sm font-black uppercase italic">Ledger Sync Active</p>
                        <p className="text-[10px] font-bold text-white/40 uppercase">Shop ID: {activeLedgerId}</p>
                    </div>
                </div>
            </Card>
          </div>

          {/* Configuration Form */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none glass-dark rounded-[3.5rem] overflow-hidden premium-shadow">
                <CardHeader className="p-12 pb-6 flex items-start justify-between">
                    <div>
                        <CardTitle className="text-3xl font-black tracking-tighter uppercase italic mb-2">Configure reservation</CardTitle>
                        <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
                            {selectedDate ? format(selectedDate, "EEEE, dd MMMM yyyy") : "Awaiting temporal selection..."}
                        </CardDescription>
                    </div>
                    {selectedDate && <CalendarIcon className="text-primary w-8 h-8 opacity-20" />}
                </CardHeader>
                <CardContent className="p-12 pt-6 space-y-12">
                   <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Service Classification</Label>
                            <Select value={serviceType} onValueChange={setServiceType}>
                                <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl font-bold italic uppercase tracking-widest text-xs focus:ring-primary/20">
                                    <SelectValue placeholder="Select Operation..." />
                                </SelectTrigger>
                                <SelectContent className="glass-dark border-white/10">
                                    {shopInfo?.services.map(s => (
                                        <SelectItem key={s.id} value={s.name} className="font-bold text-xs uppercase">{s.name}</SelectItem>
                                    )) || (
                                        <>
                                            <SelectItem value="WOF Inspection" className="font-bold text-xs uppercase">WOF Inspection</SelectItem>
                                            <SelectItem value="Full Service" className="font-bold text-xs uppercase">Full Service</SelectItem>
                                            <SelectItem value="Major Repair" className="font-bold text-xs uppercase">Major Repair</SelectItem>
                                            <SelectItem value="Diagnostic Scan" className="font-bold text-xs uppercase">Diagnostic Scan</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedDate && (
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Temporal Window</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {timeSlots.map(time => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={`
                                                h-10 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all border
                                                ${selectedTime === time ? "bg-primary text-black border-primary shadow-lg shadow-primary/20" : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"}
                                            `}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                   </div>

                   <div className="space-y-8 border-t border-white/5 pt-12">
                       <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/20 italic">Consignee Metadata</h3>
                       
                       <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Full Legal Name</Label>
                                <Input 
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl font-black italic uppercase placeholder:text-white/10 focus:ring-primary/20"
                                    placeholder="e.g. Marcus Aurelius"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Communication Endpoint (Mobile)</Label>
                                <Input 
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl font-black italic uppercase placeholder:text-white/10 focus:ring-primary/20"
                                    placeholder="+64 2X XXX XXXX"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                />
                            </div>
                       </div>

                       <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Digital Mail (Required for Sync)</Label>
                                <Input 
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl font-black italic uppercase placeholder:text-white/10 focus:ring-primary/20"
                                    placeholder="client@cyber.net"
                                    type="email"
                                    value={customerEmail}
                                    onChange={e => setCustomerEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Vehicle Module Identifier (Rego)</Label>
                                <Input 
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl font-black italic uppercase placeholder:text-white/10 focus:ring-primary/20"
                                    placeholder="XYZ123"
                                    value={vehicleInfo}
                                    onChange={e => setVehicleInfo(e.target.value)}
                                />
                            </div>
                       </div>
                   </div>

                   <Button 
                    className="w-full h-20 rounded-[2.5rem] bg-white text-black hover:bg-primary hover:text-white transition-all duration-500 font-black uppercase tracking-widest text-xs italic premium-shadow mt-8"
                    onClick={handleSubmitBooking}
                    disabled={createBookingMutation.isLoading || !selectedDate || !selectedTime || !serviceType || !customerName || !customerPhone || !customerEmail}
                   >
                    {createBookingMutation.isLoading ? <Loader2 className="animate-spin" /> : <><Zap size={18} fill="currentColor" className="mr-3" /> Commit Reservation to Ledger</>}
                   </Button>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
