import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useLedger } from '@/contexts/LedgerContext';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Loader2,
  Building2,
  FileText,
  DollarSign,
} from 'lucide-react';

export default function IntegrationsPage() {
  const { activeLedgerId } = useLedger();
  const [connectingXero, setConnectingXero] = useState(false);

  // Xero integration status
  const { data: xeroStatus, refetch: refetchXeroStatus } = trpc.xero.getStatus.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  const disconnectXeroMutation = trpc.xero.disconnect.useMutation({
    onSuccess: () => {
      toast.success('Xero disconnected successfully');
      refetchXeroStatus();
    },
  });

  // Xero Auth URL query
  const { refetch: getAuthUrl } = trpc.xero.getAuthUrl.useQuery(undefined, { enabled: false });

  const handleConnectXero = async () => {
    setConnectingXero(true);
    try {
      const { data } = await getAuthUrl();
      if (data?.url) {
        // Open Xero OAuth in popup
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.url,
          'Xero Authorization',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for OAuth callback
        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            setConnectingXero(false);
            refetchXeroStatus();
          }
        }, 500);
      }
    } catch (error) {
      toast.error('Failed to connect to Xero');
      setConnectingXero(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background pb-32">
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container py-4">
          <div>
            <h1 className="text-xl font-black tracking-tighter">Integrations</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Connect External Services
            </p>
          </div>
        </div>
      </div>

      <div className="container py-12 max-w-6xl space-y-12">
        {/* Accounting Integrations */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tighter mb-2">Accounting Software</h2>
            <p className="text-sm text-muted-foreground">
              Automatically sync invoices, payments, and customers with your accounting platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Xero */}
            <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card relative overflow-hidden">
              {xeroStatus?.connected && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-500 text-white font-black text-[9px] uppercase tracking-widest">
                    Connected
                  </Badge>
                </div>
              )}
              <CardHeader className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-[#13B5EA]/10 flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-[#13B5EA]" />
                </div>
                <CardTitle className="text-xl font-black tracking-tighter">Xero</CardTitle>
                <CardDescription className="text-xs font-bold">
                  Cloud accounting for NZ & AU businesses
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <CheckCircle2 size={14} className="text-green-500" />
                    Invoice sync
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <CheckCircle2 size={14} className="text-green-500" />
                    Payment reconciliation
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <CheckCircle2 size={14} className="text-green-500" />
                    Customer sync
                  </div>
                </div>

                {xeroStatus?.connected ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-[10px] font-black uppercase tracking-widest text-green-700 dark:text-green-400">
                        Active Integration
                      </p>
                      <p className="text-xs font-bold text-muted-foreground mt-1">
                        Syncing automatically
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full font-bold"
                      onClick={() => disconnectXeroMutation.mutate({ ledgerId: activeLedgerId! })}
                      disabled={disconnectXeroMutation.isPending}
                    >
                      {disconnectXeroMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full font-black uppercase tracking-widest text-xs shadow-lg shadow-[#13B5EA]/20"
                    style={{ backgroundColor: '#13B5EA' }}
                    onClick={handleConnectXero}
                    disabled={connectingXero}
                  >
                    {connectingXero ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4 mr-2" />
                    )}
                    Connect Xero
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* MYOB */}
            <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card relative overflow-hidden opacity-60">
              <div className="absolute top-4 right-4">
                <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest">
                  Coming Soon
                </Badge>
              </div>
              <CardHeader className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-[#E31E24]/10 flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-[#E31E24]" />
                </div>
                <CardTitle className="text-xl font-black tracking-tighter">MYOB</CardTitle>
                <CardDescription className="text-xs font-bold">
                  AccountRight & Essentials support
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <Button className="w-full font-bold" disabled>
                  Coming in Phase 2
                </Button>
              </CardContent>
            </Card>

            {/* QuickBooks */}
            <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card relative overflow-hidden opacity-60">
              <div className="absolute top-4 right-4">
                <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest">
                  Coming Soon
                </Badge>
              </div>
              <CardHeader className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-[#2CA01C]/10 flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-[#2CA01C]" />
                </div>
                <CardTitle className="text-xl font-black tracking-tighter">QuickBooks</CardTitle>
                <CardDescription className="text-xs font-bold">
                  Online accounting for global markets
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <Button className="w-full font-bold" disabled>
                  Coming in Phase 3
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Payment Integrations */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tighter mb-2">Payment Processing</h2>
            <p className="text-sm text-muted-foreground">
              Accept online payments from customers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card relative overflow-hidden opacity-60">
              <div className="absolute top-4 right-4">
                <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest">
                  Coming Soon
                </Badge>
              </div>
              <CardHeader className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-[#635BFF]/10 flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 text-[#635BFF]" />
                </div>
                <CardTitle className="text-xl font-black tracking-tighter">Stripe</CardTitle>
                <CardDescription className="text-xs font-bold">
                  Online payment processing
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <Button className="w-full font-bold" disabled>
                  Coming in Phase 2
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Parts Suppliers */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tighter mb-2">Parts Suppliers</h2>
            <p className="text-sm text-muted-foreground">
              Real-time pricing and stock availability
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card relative overflow-hidden opacity-60">
              <div className="absolute top-4 right-4">
                <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest">
                  Coming Soon
                </Badge>
              </div>
              <CardHeader className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-black tracking-tighter">Repco</CardTitle>
                <CardDescription className="text-xs font-bold">
                  Navigator Pro integration (NZ/AU)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <Button className="w-full font-bold" disabled>
                  Coming in Phase 3
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-card relative overflow-hidden opacity-60">
              <div className="absolute top-4 right-4">
                <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest">
                  Coming Soon
                </Badge>
              </div>
              <CardHeader className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-black tracking-tighter">Supercheap Auto</CardTitle>
                <CardDescription className="text-xs font-bold">
                  Parts catalog integration (NZ/AU)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <Button className="w-full font-bold" disabled>
                  Coming in Phase 3
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Help Section */}
        <Card className="border-none shadow-xl shadow-primary/5 bg-primary/5">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tighter mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Setting up integrations requires API credentials from each service. Check our documentation for step-by-step guides.
                </p>
                <Button variant="outline" className="font-bold">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Documentation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
