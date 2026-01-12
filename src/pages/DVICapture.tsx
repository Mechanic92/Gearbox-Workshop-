import React, { useState, useRef, useEffect } from 'react';
import { useRoute, useLocation, useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { 
  Camera, 
  Video, 
  CheckCircle2, 
  XSquare, 
  AlertTriangle, 
  ChevronRight, 
  Plus, 
  Trash2, 
  ChevronLeft,
  Upload,
  Image as ImageIcon,
  Save,
  Send,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * DVI Capture Interface
 * High-fidelity technician tool for photo/video inspections
 */

type Condition = 'good' | 'fair' | 'poor' | 'critical';

interface InspectionItem {
  id?: number;
  category: string;
  component: string;
  condition: Condition;
  notes: string;
  recommendation: string;
  estimatedCost: number;
  media: { file: File; type: 'photo' | 'video'; preview: string }[];
}

const CATEGORIES = [
  'Brakes', 'Tires', 'Fluids', 'Suspension', 'Electrical', 'Engine', 'Body', 'Other'
];

export default function DVICapture() {
  const { jobId } = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stopFieldEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };
  
  // New item form state
  const [newItem, setNewItem] = useState<Partial<InspectionItem>>({
    category: CATEGORIES[0],
    component: '',
    condition: 'good',
    notes: '',
    recommendation: '',
    estimatedCost: 0,
    media: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: job } = trpc.job.get.useQuery({ id: Number(jobId) }, { enabled: !!jobId });

  const handleAddMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newMedia = files.map(file => ({
      file,
      type: file.type.startsWith('video') ? 'video' as const : 'photo' as const,
      preview: URL.createObjectURL(file)
    }));
    setNewItem(prev => ({ ...prev, media: [...(prev.media || []), ...newMedia] }));
  };

  const addItemToInspection = () => {
    if (!newItem.component) {
      toast.error("Component name is required");
      return;
    }
    setItems(prev => [...prev, { ...newItem, id: Date.now() } as InspectionItem]);
    setNewItem({
      category: activeCategory,
      condition: 'good',
      notes: '',
      recommendation: '',
      estimatedCost: 0,
      media: []
    });
    toast.success("Item added to inspection");
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const getUploadUrl = trpc.storage.getUploadUrl.useMutation();
  const createDvi = trpc.dvi.create.useMutation();

  const submitInspection = async () => {
    if (items.length === 0) {
      toast.error("Add at least one item to inspection");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Process all items and their media
      const itemsToSubmit = [];
      
      for (const item of items) {
        const mediaKeys: string[] = [];
        
        // Upload each media file
        for (const m of item.media) {
          const key = `dvi/${jobId}/${Date.now()}-${m.file.name}`;
          const { url } = await getUploadUrl.mutateAsync({ 
            key, 
            contentType: m.file.type 
          });
          
          // Upload to S3
          await fetch(url, {
            method: 'PUT',
            body: m.file,
            headers: { 'Content-Type': m.file.type }
          });
          
          mediaKeys.push(key);
        }
        
        itemsToSubmit.push({
          category: item.category,
          component: item.component,
          status: item.condition as any,
          comment: item.notes,
          recommendedAction: item.recommendation,
          estimatedCost: item.estimatedCost,
          mediaKeys
        });
      }
      
      // 2. Create the DVI record
      const result = await createDvi.mutateAsync({
        jobId: Number(jobId),
        items: itemsToSubmit
      });
      
      toast.success("Inspection submitted successfully!");
      setLocation(`/trades/jobs/${jobId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit inspection. Check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans selection:bg-blue-200">
      {/* Cinematic Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
        <div className="container max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation(`/trades/jobs/${jobId}`)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tighter">DIGITAL INSPECTION</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Job #{jobId} — {job?.customerName || 'Customer'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button 
              variant="outline" 
              className="font-black text-xs uppercase tracking-widest"
              onClick={() => setLocation(`/trades/jobs/${jobId}`)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest px-6 shadow-xl shadow-blue-500/20"
              onClick={submitInspection}
              disabled={isSubmitting || items.length === 0}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> SUBMIT TO CUSTOMER</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar: Categories */}
        <div className="lg:col-span-3 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-4 mb-4">Inspection Categories</p>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setNewItem(prev => ({ ...prev, category: cat }));
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeCategory === cat 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 hover:border-blue-400"
              )}
            >
              {cat}
              {items.filter(i => i.category === cat).length > 0 && (
                <Badge className="bg-white/20 text-white border-none">{items.filter(i => i.category === cat).length}</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Center: Capture Form */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border-none shadow-2xl shadow-blue-900/5 bg-white dark:bg-neutral-900 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black tracking-tighter uppercase italic">{activeCategory} Inspection</CardTitle>
              <CardDescription className="text-sm font-medium">Document condition and capture evidence</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              
              {/* Media Capture Area */}
              <div 
                className="group relative h-48 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-3 bg-neutral-50 dark:bg-neutral-950 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all cursor-pointer overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {newItem.media && newItem.media.length > 0 ? (
                  <div className="flex gap-2 p-2 w-full overflow-x-auto">
                    {newItem.media.map((m, i) => (
                      <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
                        {m.type === 'photo' ? (
                          <img src={m.preview} className="w-full h-full object-cover" />
                        ) : (
                          <video src={m.preview} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center flex-shrink-0 bg-white">
                      <Plus className="w-6 h-6 text-neutral-400" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-white">Capture Reality</p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tap to snap photo or record video</p>
                    </div>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,video/*" 
                  multiple 
                  onChange={handleAddMedia}
                />
              </div>

              {/* Component & Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Component</label>
                  <input 
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 ring-blue-500 transition-all"
                    placeholder="e.g. Front Brake Pads"
                    value={newItem.component || ''}
                    onPointerDown={stopFieldEvent}
                    onClick={stopFieldEvent}
                    onChange={(e) => setNewItem(prev => ({ ...prev, component: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Condition</label>
                  <div className="flex gap-1">
                    {(['good', 'fair', 'poor', 'critical'] as Condition[]).map(cond => (
                      <button
                        key={cond}
                        onClick={() => setNewItem(prev => ({ ...prev, condition: cond }))}
                        className={cn(
                          "flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                          newItem.condition === cond 
                            ? cond === 'good' ? 'bg-green-500 border-green-600 text-white shadow-lg shadow-green-500/20' :
                              cond === 'fair' ? 'bg-yellow-500 border-yellow-600 text-white shadow-lg shadow-yellow-500/20' :
                              cond === 'poor' ? 'bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-500/20' :
                              'bg-red-600 border-red-700 text-white shadow-lg shadow-red-500/20'
                            : 'bg-white border-neutral-200 text-neutral-400'
                        )}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Findings & Notes</label>
                <textarea 
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl px-4 py-3 font-bold text-sm h-24 focus:ring-2 ring-blue-500 transition-all"
                  placeholder="Describe what you see..."
                  value={newItem.notes || ''}
                  onPointerDown={stopFieldEvent}
                  onClick={stopFieldEvent}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Recommendation</label>
                  <input 
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 ring-blue-500 transition-all"
                    placeholder="e.g. Replace immediately"
                    value={newItem.recommendation || ''}
                    onPointerDown={stopFieldEvent}
                    onClick={stopFieldEvent}
                    onChange={(e) => setNewItem(prev => ({ ...prev, recommendation: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Est. Cost ($)</label>
                  <input 
                    type="number"
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 ring-blue-500 transition-all"
                    placeholder="0.00"
                    value={newItem.estimatedCost || ''}
                    onPointerDown={stopFieldEvent}
                    onClick={stopFieldEvent}
                    onChange={(e) => setNewItem(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <Button 
                className="w-full bg-neutral-900 border-2 border-neutral-900 dark:border-white hover:bg-white hover:text-neutral-900 text-white font-black py-6 rounded-2xl transition-all"
                onClick={addItemToInspection}
              >
                ADD TO INSPECTION LIST
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Summary & Review */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xl shadow-neutral-900/5">
            <h3 className="text-lg font-black tracking-tighter uppercase italic mb-6">Inspection Review</h3>
            
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-neutral-100 rounded-2xl">
                  <AlertTriangle className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300">No items captured yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="group relative p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 transition-all">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-blue-500">{item.category}</p>
                          <p className="text-xs font-black uppercase tracking-tighter leading-tight">{item.component}</p>
                          <Badge className={cn(
                            "mt-1 text-[8px] border-none font-black uppercase",
                            item.condition === 'good' ? 'bg-green-500/10 text-green-600' :
                            item.condition === 'fair' ? 'bg-yellow-500/10 text-yellow-600' :
                            item.condition === 'poor' ? 'bg-orange-500/10 text-orange-600' :
                            'bg-red-500/10 text-red-600'
                          )}>
                            {item.condition}
                          </Badge>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id!)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="mt-8 pt-6 border-t border-neutral-100">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Total Upsell Potent.</p>
                  <p className="text-lg font-black tracking-tighter">${items.reduce((acc, i) => acc + i.estimatedCost, 0).toFixed(2)}</p>
                </div>
                <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">Calculated based on estimated repair costs</p>
              </div>
            )}
          </div>
        </div>

      </div>
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
