import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLedger } from "@/contexts/LedgerContext";
import { trpc } from "@/lib/trpc";
import { Building2, Home, Loader2, Plus } from "lucide-react";
import { useLocation } from "wouter";

interface LedgerSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LedgerSwitcher({ open, onOpenChange }: LedgerSwitcherProps) {
  const { setActiveLedgerId, setActiveLedgerType, activeLedgerId } = useLedger();
  const [, setLocation] = useLocation();

  // Fetch user's organizations
  const { data: organizations = [], isLoading: orgsLoading } = trpc.organization.list.useQuery();

  // Build queries for all org ledgers
  const orgIds = useMemo(() => organizations.map((org) => org.id), [organizations]);
  
  // Fetch ledgers for first organization only (simplified for now)
  const { data: ledgers = [], isLoading: ledgersLoading } = trpc.ledger.list.useQuery(
    { organizationId: orgIds[0] || 0 },
    { enabled: orgIds.length > 0 }
  );

  const isLoading = orgsLoading || ledgersLoading;

  const handleSelectLedger = (ledgerId: number, ledgerType: "trades" | "rental") => {
    setActiveLedgerId(ledgerId);
    setActiveLedgerType(ledgerType);
    onOpenChange(false);

    // Navigate to appropriate dashboard
    if (ledgerType === "trades") {
      setLocation("/trades/dashboard");
    } else {
      setLocation("/rental/dashboard");
    }
  };

  const handleCreateLedger = () => {
    onOpenChange(false);
    setLocation("/setup/ledger");
  };

  const tradesLedgers = ledgers.filter((ledger) => ledger.type === "trades");
  const rentalLedgers = ledgers.filter((ledger) => ledger.type === "rental");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Switch Ledger</DialogTitle>
          <DialogDescription>
            Select a ledger to manage or create a new one
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Trades Ledgers */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center">
                <Building2 className="w-4 h-4 mr-2" />
                Workshop Ledgers
              </h3>
              <div className="grid gap-3">
                {tradesLedgers.length > 0 ? (
                  tradesLedgers.map((ledger) => (
                    <Card
                      key={ledger.id}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        activeLedgerId === ledger.id ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => handleSelectLedger(ledger.id, "trades")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{ledger.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {ledger.gstRegistered ? "GST Registered" : "Non-GST"} •{" "}
                              {ledger.gstBasis === "invoice" ? "Invoice Basis" : "Payments Basis"}
                            </div>
                          </div>
                          {activeLedgerId === ledger.id && (
                            <div className="text-xs font-medium text-primary">Active</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No workshop ledgers yet
                  </div>
                )}
              </div>
            </div>

            {/* Rental Ledgers */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Rental Property Ledgers
              </h3>
              <div className="grid gap-3">
                {rentalLedgers.length > 0 ? (
                  rentalLedgers.map((ledger) => (
                    <Card
                      key={ledger.id}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        activeLedgerId === ledger.id ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => handleSelectLedger(ledger.id, "rental")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{ledger.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {ledger.gstRegistered ? "GST Registered" : "Non-GST"}
                            </div>
                          </div>
                          {activeLedgerId === ledger.id && (
                            <div className="text-xs font-medium text-primary">Active</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No rental property ledgers yet
                  </div>
                )}
              </div>
            </div>

            {/* Create New Ledger */}
            <Button
              onClick={handleCreateLedger}
              className="w-full h-12"
              variant="outline"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Ledger
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
