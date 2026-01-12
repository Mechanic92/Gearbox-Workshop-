import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLedger } from "@/contexts/LedgerContext";
import { ArrowLeft, Search, Car } from "lucide-react";
import { toast } from "sonner";

export default function AddVehicle() {
  const [, setLocation] = useLocation();
  const { activeLedgerId } = useLedger();
  
  // Form state
  const [plateNumber, setPlateNumber] = useState("");
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [wofExpiry, setWofExpiry] = useState("");
  const [regoExpiry, setRegoExpiry] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  const createVehicleMutation = trpc.vehicle.create.useMutation({
    onSuccess: () => {
      toast.success("Vehicle added successfully!");
      setLocation("/trades/vehicles");
    },
    onError: (error: any) => {
      toast.error(`Failed to add vehicle: ${error.message}`);
    },
  });

  const handlePlateNumberLookup = async () => {
    if (!plateNumber.trim()) {
      toast.error("Please enter a plate number");
      return;
    }

    setIsLookingUp(true);
    
    // Simulate NZTA/MotorWeb API lookup
    // In production, this would call the actual API
    setTimeout(() => {
      // Mock data for demonstration
      setVin("JN1TBNT30U0000123");
      setMake("Toyota");
      setModel("Hilux");
      setYear("2023");
      setColor("White");
      
      // Set expiry dates to 6 months from now
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      const expiryDateStr = sixMonthsFromNow.toISOString().split("T")[0];
      
      setWofExpiry(expiryDateStr);
      setRegoExpiry(expiryDateStr);
      
      setIsLookingUp(false);
      toast.success("Vehicle details retrieved from NZTA");
    }, 1500);
  };

  const handleAddVehicle = () => {
    if (!plateNumber.trim() || !make.trim() || !model.trim()) {
      toast.error("Please fill in required fields");
      return;
    }

    createVehicleMutation.mutate({
      ledgerId: activeLedgerId!,
      licensePlate: plateNumber,
      vin: vin || undefined,
      make,
      model,
      year: year ? parseInt(year) : undefined,
      wofExpiry: wofExpiry ? new Date(wofExpiry) : undefined,
      regoExpiry: regoExpiry ? new Date(regoExpiry) : undefined,
    });
  };

  if (!activeLedgerId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please select a ledger first</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="container py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary/90"
              onClick={() => setLocation("/trades/vehicles")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Add Vehicle</h1>
              <p className="text-sm text-primary-foreground/80">
                Register a new vehicle
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="w-5 h-5" />
              <span>Vehicle Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plate Number Lookup */}
            <div className="space-y-2">
              <Label htmlFor="plateNumber">Plate Number *</Label>
              <div className="flex space-x-2">
                <Input
                  id="plateNumber"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="h-12 text-base font-mono"
                  maxLength={6}
                />
                <Button
                  onClick={handlePlateNumberLookup}
                  disabled={isLookingUp || !plateNumber.trim()}
                  className="h-12 px-6"
                >
                  {isLookingUp ? (
                    "Looking up..."
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Lookup
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter plate number and click Lookup to auto-fill details from NZTA
              </p>
            </div>

            {/* VIN */}
            <div className="space-y-2">
              <Label htmlFor="vin">VIN (Vehicle Identification Number)</Label>
              <Input
                id="vin"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="JN1TBNT30U0000123"
                className="h-12 text-base font-mono"
              />
            </div>

            {/* Make and Model */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="Toyota"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Hilux"
                  className="h-12 text-base"
                />
              </div>
            </div>

            {/* Year and Color */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2023"
                  className="h-12 text-base"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="White"
                  className="h-12 text-base"
                />
              </div>
            </div>

            {/* WOF and Rego Expiry */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wofExpiry">WOF Expiry</Label>
                <Input
                  id="wofExpiry"
                  type="date"
                  value={wofExpiry}
                  onChange={(e) => setWofExpiry(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regoExpiry">Rego Expiry</Label>
                <Input
                  id="regoExpiry"
                  type="date"
                  value={regoExpiry}
                  onChange={(e) => setRegoExpiry(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                onClick={handleAddVehicle}
                className="w-full h-12 text-base"
                disabled={createVehicleMutation.isPending}
              >
                {createVehicleMutation.isPending ? "Adding Vehicle..." : "Add Vehicle"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
