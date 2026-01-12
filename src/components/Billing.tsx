import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Loader2, CreditCard, TrendingUp, Users, HardDrive, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface BillingProps {
  organizationId: number;
}

export function Billing({ organizationId }: BillingProps) {
  const [loading, setLoading] = useState(false);

  const { data: status, isLoading } = trpc.billing.getStatus.useQuery({ organizationId });
  const { data: plans } = trpc.billing.getPlans.useQuery();
  const { data: history } = trpc.billing.getBillingHistory.useQuery({ organizationId });

  const createPortalSession = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url!;
    },
    onError: (error) => {
      toast.error('Failed to open billing portal: ' + error.message);
      setLoading(false);
    },
  });

  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url!;
    },
    onError: (error) => {
      toast.error('Failed to start checkout: ' + error.message);
      setLoading(false);
    },
  });

  const handleManageBilling = () => {
    setLoading(true);
    createPortalSession.mutate({ organizationId });
  };

  const handleUpgrade = (tier: 'starter' | 'professional' | 'enterprise', billingPeriod: 'monthly' | 'yearly') => {
    setLoading(true);
    createCheckout.mutate({ organizationId, tier, billingPeriod });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentTier = status?.organization?.subscriptionTier || 'starter';
  const subscriptionStatus = status?.subscription?.status || 'active';
  const usage = status?.usage;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black tracking-tighter">Current Plan</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </div>
            <Badge variant={subscriptionStatus === 'active' ? 'default' : 'destructive'}>
              {subscriptionStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold capitalize">{currentTier}</h3>
              <p className="text-sm text-muted-foreground">
                {currentTier === 'starter' && '$29.99 NZD/month'}
                {currentTier === 'professional' && '$69.99 NZD/month'}
                {currentTier === 'enterprise' && '$99.99 NZD/month'}
              </p>
            </div>
            <Button onClick={handleManageBilling} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
              Manage Billing
            </Button>
          </div>

          {status?.subscription && (
            <div className="text-sm text-muted-foreground">
              <p>
                Current period: {new Date(status.subscription.currentPeriodStart).toLocaleDateString()} -{' '}
                {new Date(status.subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
              {status.subscription.cancelAtPeriodEnd && (
                <p className="text-destructive font-medium mt-1">
                  Your subscription will cancel at the end of the current period
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-black tracking-tighter">Usage This Month</CardTitle>
            <CardDescription>
              {new Date(usage.billingPeriod.start).toLocaleDateString()} -{' '}
              {new Date(usage.billingPeriod.end).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Jobs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-medium">Jobs Created</span>
                </div>
                <span className="text-muted-foreground">
                  {usage.usage.jobsCreated} / {usage.limits.maxJobsPerMonth === -1 ? '∞' : usage.limits.maxJobsPerMonth}
                </span>
              </div>
              {usage.limits.maxJobsPerMonth !== -1 && (
                <Progress value={(usage.usage.jobsCreated / usage.limits.maxJobsPerMonth) * 100} />
              )}
            </div>

            {/* Storage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <span className="font-medium">Storage Used</span>
                </div>
                <span className="text-muted-foreground">
                  {(usage.usage.storageUsedMb / 1024).toFixed(2)} GB / {(usage.limits.maxStorageMb / 1024).toFixed(0)} GB
                </span>
              </div>
              <Progress value={(usage.usage.storageUsedMb / usage.limits.maxStorageMb) * 100} />
            </div>

            {/* Active Users */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">Active Users</span>
                </div>
                <span className="text-muted-foreground">
                  {usage.usage.activeUsers} / {usage.limits.maxUsers === -1 ? '∞' : usage.limits.maxUsers}
                </span>
              </div>
              {usage.limits.maxUsers !== -1 && (
                <Progress value={(usage.usage.activeUsers / usage.limits.maxUsers) * 100} />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Options */}
      {currentTier !== 'enterprise' && plans && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-black tracking-tighter">Upgrade Your Plan</CardTitle>
            <CardDescription>Unlock more features and higher limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentTier === 'starter' && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg">Professional</h4>
                    <p className="text-sm text-muted-foreground">Perfect for growing workshops</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">$69.99</p>
                    <p className="text-xs text-muted-foreground">NZD/month</p>
                  </div>
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary" />
                    Unlimited jobs
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary" />
                    Xero integration
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary" />
                    Advanced reporting
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary" />
                    Inventory management
                  </li>
                </ul>
                <Button className="w-full" onClick={() => handleUpgrade('professional', 'monthly')} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Upgrade to Professional
                </Button>
              </div>
            )}

            {(currentTier === 'starter' || currentTier === 'professional') && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg">Enterprise</h4>
                    <p className="text-sm text-muted-foreground">For multi-location operations</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">$99.99</p>
                    <p className="text-xs text-muted-foreground">NZD/month</p>
                  </div>
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary" />
                    Up to 5 locations
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary" />
                    Unlimited users
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary" />
                    API access
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary" />
                    Dedicated support
                  </li>
                </ul>
                <Button className="w-full" onClick={() => handleUpgrade('enterprise', 'monthly')} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Upgrade to Enterprise
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-black tracking-tighter">Billing History</CardTitle>
            <CardDescription>Your past invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.currency.toUpperCase()} ${invoice.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>{invoice.status}</Badge>
                    {invoice.invoiceUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
