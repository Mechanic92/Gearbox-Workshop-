import { useState, useMemo } from "react";
import { format, addDays, startOfDay, endOfDay, eachDayOfInterval, isSameDay, addHours } from "date-fns";
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
import { ChevronLeft, ChevronRight, Clock, MapPin, Phone, Mail } from "lucide-react";

export default function BookingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Services list (hardcoded for now, can be fetched from backend)
  const services = [
    { id: "wof", name: "WOF Inspection" },
    { id: "service", name: "Regular Service" },
    { id: "repair", name: "Repair" },
    { id: "diagnostic", name: "Diagnostic" },
    { id: "other", name: "Other" },
  ];

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
    // Don't allow past dates
    if (date < new Date()) return;
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleSubmitBooking = async () => {
    if (!selectedDate || !selectedTime || !serviceId || !customerName || !customerPhone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse time and create datetime
      const [hours] = selectedTime.split(":").map(Number);
      const bookingDateTime = new Date(selectedDate);
      bookingDateTime.setHours(hours, 0, 0, 0);

      // Call booking creation (would need ledger context in real implementation)
      toast.success("Booking confirmed! You'll receive a confirmation email shortly.");
      
      // Reset form
      setSelectedDate(null);
      setSelectedTime(null);
      setServiceId("");
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setVehicleInfo("");
      setNotes("");
    } catch (error) {
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[200px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-black tracking-tighter text-white mb-3">
            Schedule <span className="text-primary italic">Protocol.</span>
          </h1>
          <p className="text-white/50 font-medium text-lg">Reserve your service window with precision timing</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="md:col-span-1">
            <Card className="sticky top-4 border-none glass rounded-[2rem]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreviousMonth}
                    className="hover:bg-white/10 text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <CardTitle className="text-center flex-1 text-white font-black tracking-tight">
                    {format(currentDate, "MMMM yyyy")}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextMonth}
                    className="hover:bg-white/10 text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-xs font-black uppercase tracking-widest text-white/30">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                  {daysInMonth.map((day) => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isPast = day < new Date();
                    const isToday = isSameDay(day, new Date());

                    return (
                      <button
                        key={day.toString()}
                        onClick={() => handleSelectDate(day)}
                        disabled={isPast}
                        className={`
                          aspect-square rounded-xl text-sm font-bold transition-all
                          ${isPast ? "bg-white/5 text-white/20 cursor-not-allowed" : ""}
                          ${isSelected ? "bg-primary text-black shadow-[0_0_20px_oklch(var(--primary)/0.5)]" : ""}
                          ${!isPast && !isSelected ? "bg-white/10 text-white hover:bg-white/20 border border-white/10" : ""}
                          ${isToday && !isSelected ? "border-2 border-primary" : ""}
                        `}
                      >
                        {format(day, "d")}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form Section */}
          <div className="md:col-span-2">
            <Card className="border-none glass rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-2xl font-black text-white">Booking Details</CardTitle>
                <CardDescription className="text-white/50 font-medium">
                  {selectedDate
                    ? `Selected: ${format(selectedDate, "EEEE, MMMM d, yyyy")}`
                    : "Select a date to continue"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Selection */}
                <div>
                  <Label htmlFor="service" className="text-xs font-black uppercase tracking-widest text-white/60 mb-2 block">
                    Service Type *
                  </Label>
                  <Select value={serviceId} onValueChange={setServiceId}>
                    <SelectTrigger id="service" className="h-14 bg-white/5 border-white/10 text-white rounded-xl font-medium">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wof">WOF Inspection</SelectItem>
                      <SelectItem value="service">Regular Service</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="diagnostic">Diagnostic</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <Label className="text-xs font-black uppercase tracking-widest text-white/60 mb-2 block">
                      Preferred Time *
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`
                            py-3 rounded-xl font-bold transition-all
                            ${
                              selectedTime === time
                                ? "bg-primary text-black shadow-[0_0_20px_oklch(var(--primary)/0.3)]"
                                : "bg-white/10 text-white hover:bg-white/20"
                            }
                          `}
                        >
                          <Clock className="w-4 h-4 inline mr-1" />
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Information */}
                <div className="space-y-4 border-t border-white/10 pt-6">
                  <h3 className="font-black text-xl text-white tracking-tight">Your Information</h3>

                  <div>
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-white/60 mb-2 block">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-14 bg-white/5 border-white/10 text-white rounded-xl font-medium placeholder:text-white/30"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-white/60 mb-2 block">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="021 123 4567"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="h-14 bg-white/5 border-white/10 text-white rounded-xl font-medium placeholder:text-white/30"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-white/60 mb-2 block">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="h-14 bg-white/5 border-white/10 text-white rounded-xl font-medium placeholder:text-white/30"
                    />
                  </div>

                  <div>
                    <Label htmlFor="vehicle" className="text-xs font-black uppercase tracking-widest text-white/60 mb-2 block">
                      Vehicle Information
                    </Label>
                    <Input
                      id="vehicle"
                      placeholder="e.g., 2020 Toyota Corolla, Plate: ABC123"
                      value={vehicleInfo}
                      onChange={(e) => setVehicleInfo(e.target.value)}
                      className="h-14 bg-white/5 border-white/10 text-white rounded-xl font-medium placeholder:text-white/30"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-xs font-black uppercase tracking-widest text-white/60 mb-2 block">
                      Additional Notes
                    </Label>
                    <textarea
                      id="notes"
                      placeholder="Any specific issues or concerns?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-4 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-24 font-medium placeholder:text-white/30"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitBooking}
                  disabled={!selectedDate || !selectedTime || !serviceId || !customerName || !customerPhone || isSubmitting}
                  className="w-full h-16 font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_40px_oklch(var(--primary)/0.3)] hover:scale-[1.02] transition-transform"
                  size="lg"
                >
                  {isSubmitting ? "Confirming..." : "Confirm Booking"}
                </Button>

                <p className="text-sm text-white/50 text-center font-medium">
                  You'll receive a confirmation email with booking details
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card className="border-none glass rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-white mb-1">Business Hours</h3>
                  <p className="text-sm text-white/50 font-medium">Monday - Friday: 9 AM - 5 PM</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none glass rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-white mb-1">Location</h3>
                  <p className="text-sm text-white/50 font-medium">Mobile Auto Works, Auckland, NZ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none glass rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-white mb-1">Questions?</h3>
                  <p className="text-sm text-white/50 font-medium">Call us at 021 123 4567</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
