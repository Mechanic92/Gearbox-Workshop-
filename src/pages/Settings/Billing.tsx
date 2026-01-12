import { Billing } from '../../components/Billing';
import { useLedger } from '../../contexts/LedgerContext';
import { trpc } from '../../lib/trpc';
import { Loader2 } from 'lucide-react';

export default function BillingSettings() {
  const { activeLedgerId } = useLedger();
  
  const { data: currentLedger, isLoading } = trpc.ledger.get.useQuery(
    { id: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentLedger) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Please select a ledger to view billing settings.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Billing organizationId={currentLedger.organizationId} />
    </div>
  );
}
