import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { 
  CheckCircle2, 
  XSquare, 
  AlertTriangle, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  Car, 
  Info,
  Phone,
  MessageSquare,
  Lock,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Play,
  Loader2 as Spinner
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

/**
 * Customer DVI Approval Portal
 * High-trust, professional interface for customers to review and approve repairs
 */

export default function DVIApproval() {
  const { token } = useParams<{ token: string }>();
  const [approvedItems, setApprovedItems] = useState<number[]>([]);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Note: Standard query for DVI data
  const { data: dvi, isLoading } = trpc.public.getDVI.useQuery({ token: token! }, { enabled: !!token });
  const approveMutation = trpc.public.approveDVI.useMutation();

  const toggleItem = (id: number) => {
    setApprovedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleExpand = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (approvedItems.length === 0) {
      toast.error("Please select at least one item to proceed or contact us");
      return;
    }

    setIsSubmitting(true);
    try {
      await approveMutation.mutateAsync({
        token: token!,
        approvedItems,
        signature: "DIGITAL_SIGNATURE" // In a real app, this would be a canvas signature
      });
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#3b82f6', '#1e40af']
      });
      
      setHasSubmitted(true);
      toast.success("Repairs approved! We'll begin work immediately.");
    } catch (err) {
      toast.error("Failed to submit approval");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (hasSubmitted) return <SuccessState />;
  if (!dvi) return <ErrorState />;

  const totalCost = dvi.items
    .filter((item: any) => approvedItems.includes(item.id))
    .reduce((acc: number, item: any) => acc + (item.estimatedCost || 0), 0);

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans selection:bg-blue-200 antialiased">
      {/* Trust Header */}
      <div className="bg-white border-b border-neutral-100 sticky top-0 z-50">
        <div className="container max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic">G</div>
            <div>
              <h1 className="text-lg font-black tracking-tighter leading-none">GEARBOX FINTECH</h1>
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Secure Service Authorization</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Authorized Link</span>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl px-4 py-12 space-y-8">
        
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <Badge className="bg-blue-50 text-blue-600 border-none px-4 py-1 uppercase tracking-widest text-[9px] font-black">Digital Inspection Ready</Badge>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Review Your Vehicle Health</h2>
          <p className="text-neutral-500 font-medium max-w-md mx-auto">
            Hi {dvi.inspection.customerName || 'Customer'}, our technician has completed a full digital inspection of your 
            <span className="text-neutral-900 font-bold"> {dvi.inspection.vehicleRego}</span>. Please review the findings below.
          </p>
        </section>

        {/* Vehicle Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-white p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-900">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Vehicle</p>
              <p className="text-sm font-black uppercase tracking-tight">{dvi.inspection.vehicleRego}</p>
            </div>
          </Card>
          <Card className="border-none shadow-sm bg-white p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-900">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Date</p>
              <p className="text-sm font-black uppercase tracking-tight">
                {new Date(dvi.inspection.inspectionDate).toLocaleDateString()}
              </p>
            </div>
          </Card>
          <Card className="border-none shadow-sm bg-white p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-900">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Status</p>
              <p className="text-sm font-black uppercase tracking-tight text-blue-600">Action Required</p>
            </div>
          </Card>
        </div>

        {/* Inspection Items List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xl font-black tracking-tighter uppercase italic">Inspection Findings</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{dvi.items.length} Points Checked</span>
          </div>

          <div className="space-y-4">
            {dvi.items.map((item: any) => (
              <div 
                key={item.id} 
                className={cn(
                  "group bg-white rounded-[32px] border transition-all duration-300 overflow-hidden",
                  approvedItems.includes(item.id) 
                    ? "border-blue-500 ring-4 ring-blue-500/5 shadow-xl shadow-blue-500/10" 
                    : "border-neutral-100 shadow-sm"
                )}
              >
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                   {/* Thumbnail Gallery */}
                   <div className="w-full md:w-48 h-48 md:h-auto rounded-3xl bg-neutral-50 overflow-hidden relative flex-shrink-0 cursor-pointer group-hover:scale-[1.02] transition-transform">
                    {item.media && item.media[0] ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={item.media[0].imageUrl} 
                          alt={item.itemName} 
                          className="w-full h-full object-cover"
                        />
                        {item.media[0].type === 'video' && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50">
                              <Play className="w-5 h-5 text-white fill-white" />
                            </div>
                          </div>
                        )}
                        {item.media.length > 1 && (
                          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[10px] font-black">
                            +{item.media.length - 1} MORE
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                   </div>

                  {/* Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge className={cn(
                          "border-none px-3 py-1 uppercase text-[8px] font-black tracking-widest",
                          item.status === 'green' ? 'bg-green-500/10 text-green-600' :
                          item.status === 'amber' ? 'bg-yellow-500/10 text-yellow-600' :
                          'bg-red-500/10 text-red-600'
                        )}>
                          {item.status}
                        </Badge>
                        <h4 className="text-2xl font-black tracking-tighter uppercase leading-tight">{item.itemName}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Investment</p>
                        <p className="text-2xl font-black tracking-tighter text-neutral-900">${item.estimatedCost?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>

                    <p className="text-neutral-500 font-medium leading-relaxed">
                      {item.comment || 'No specific notes provided.'}
                    </p>

                    <div className="flex items-center gap-4 pt-4 border-t border-neutral-100">
                      <Button
                        onClick={() => toggleItem(item.id)}
                        className={cn(
                          "flex-1 font-black text-xs uppercase tracking-widest py-6 rounded-2xl transition-all",
                          approvedItems.includes(item.id)
                            ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        )}
                      >
                        {approvedItems.includes(item.id) ? (
                          <><CheckCircle2 className="w-4 h-4 mr-2" /> REPAIR AUTHORIZED</>
                        ) : (
                          "AUTHORIZE REPAIR"
                        )}
                      </Button>
                      <Button 
                        variant="link" 
                        onClick={() => toggleExpand(item.id)}
                        className="text-neutral-400 hover:text-neutral-900 font-black text-[10px] uppercase tracking-widest"
                      >
                         MORE DETAILS {expandedItems.includes(item.id) ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {expandedItems.includes(item.id) && (
                  <div className="bg-neutral-50 p-8 border-t border-neutral-100 animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                            <Info className="w-3 h-3" /> Technician Recommendation
                          </p>
                          <p className="text-sm font-bold text-neutral-700 leading-relaxed italic border-l-4 border-blue-500 pl-4 py-2 bg-white rounded-r-xl">
                            "{item.recommendedAction || 'Manufacturer recommended service for vehicle longevity.'}"
                          </p>
                       </div>
                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                             Full Visual Evidence
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {item.media.map((m: any, i: number) => (
                              <div key={i} className="aspect-square bg-white rounded-xl border border-neutral-200 overflow-hidden cursor-zoom-in">
                                <img src={m.imageUrl || m.file_path} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Sticky Total Bar */}
        <div className="sticky bottom-8 z-50">
          <Card className="bg-neutral-900 text-white p-6 md:p-8 rounded-[40px] shadow-2xl shadow-blue-900/40 border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <Lock className="w-32 h-32" />
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Total Authorized Work</p>
                <h3 className="text-4xl font-black tracking-tighter">${totalCost.toFixed(2)}</h3>
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-2">Inc. GST & Eco-Leavy</p>
              </div>
              
              <div className="flex flex-col items-center gap-4 w-full md:w-auto">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full md:w-64 bg-blue-600 hover:bg-blue-500 text-white font-black py-8 rounded-[24px] text-lg uppercase tracking-widest shadow-xl shadow-blue-500/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {isSubmitting ? <Spinner className="w-6 h-6 animate-spin" /> : "FINALIZE & APPROVE"}
                </Button>
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Digital Auth ID: {token?.slice(0, 8)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Help Footer */}
        <footer className="py-12 text-center space-y-4">
           <p className="text-neutral-400 font-bold text-xs">Have questions? We're here to help.</p>
           <div className="flex items-center justify-center gap-4">
              <Button variant="outline" className="rounded-full font-black text-[10px] uppercase tracking-widest py-6 px-10 border-neutral-200">
                <Phone className="w-4 h-4 mr-2" /> CALL US
              </Button>
              <Button variant="outline" className="rounded-full font-black text-[10px] uppercase tracking-widest py-6 px-10 border-neutral-200">
                <MessageSquare className="w-4 h-4 mr-2" /> CHAT LIVE
              </Button>
           </div>
        </footer>
      </div>
    </div>
  );
}

// Sub-components for States
function LoadingState() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
      <Spinner className="w-12 h-12 text-blue-600 animate-spin" />
      <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Loading Secure Portal...</p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-2">Access Denied</h2>
      <p className="text-neutral-500 font-medium max-w-xs mx-auto mb-8">
        This link has expired or is invalid. Please contact the workshop to request a new inspection link.
      </p>
      <Button variant="outline" className="rounded-full py-6 px-8 font-black uppercase tracking-widest bg-white">Return Home</Button>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-8 border-4 border-white shadow-xl">
        <CheckCircle2 className="w-12 h-12" />
      </div>
      <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-4 leading-none text-neutral-900">Thank You!</h2>
      <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] mb-8">Work Authorization Success</p>
      <p className="text-neutral-600 font-medium max-w-md mx-auto mb-12">
        We've received your approval and notified the technician. We'll get started right away and update you when your vehicle is ready for pickup.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
         <Card className="p-6 bg-white border-none shadow-sm rounded-3xl">
           <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Pickup Est.</p>
           <p className="text-xl font-black tracking-tighter uppercase italic">Today 4:30 PM</p>
         </Card>
         <Card className="p-6 bg-white border-none shadow-sm rounded-3xl">
           <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Total Auth</p>
           <p className="text-xl font-black tracking-tighter uppercase italic text-green-600">$425.00</p>
         </Card>
      </div>

      <Button variant="link" className="mt-12 text-blue-600 font-black uppercase tracking-widest text-[10px]">
        Download Summary PDF
      </Button>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold border", className)}>
      {children}
    </span>
  );
}
