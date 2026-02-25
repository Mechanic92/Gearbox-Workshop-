import React, { useState } from 'react';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter,
  Download,
  Upload,
  ScanBarcode as Barcode,
  DollarSign,
  ShoppingCart,
  Box,
  Layers,
  Pencil as Edit,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLedger } from "@/contexts/LedgerContext";
import { trpc } from "@/lib/trpc";

/**
 * Inventory Management Dashboard
 * Complete parts, suppliers, and stock control system
 */

export default function InventoryDashboard() {
  const { activeLedgerId } = useLedger();
  const [activeTab, setActiveTab] = useState<'parts' | 'suppliers' | 'orders' | 'movements'>('parts');

  const { data: parts, isLoading: isLoadingParts, refetch: refetchParts } = trpc.inventory.getParts.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId }
  );

  // Suppliers Query
  const { data: suppliers, isLoading: isLoadingSuppliers, refetch: refetchSuppliers } = trpc.inventory.getSuppliers.useQuery(
    { ledgerId: activeLedgerId! },
    { enabled: !!activeLedgerId && activeTab === 'suppliers' }
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [newPart, setNewPart] = useState({
    partNumber: '',
    name: '',
    description: '',
    costPrice: '',
    sellPrice: '',
    stockQuantity: '0',
    minStockLevel: '0'
  });

  const [selectedPartForAdjustment, setSelectedPartForAdjustment] = useState<any>(null);

  const createPartMutation = trpc.inventory.createPart.useMutation({
    onSuccess: () => {
      refetchParts();
      setIsAddModalOpen(false);
      setNewPart({
        partNumber: '',
        name: '',
        description: '',
        costPrice: '',
        sellPrice: '',
        stockQuantity: '0',
        minStockLevel: '0'
      });
    }
  });

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: ''
  });

  const createSupplierMutation = trpc.inventory.createSupplier.useMutation({
    onSuccess: () => {
      refetchSuppliers();
      setIsAddSupplierModalOpen(false);
      setNewSupplier({ name: '', contactPerson: '', email: '', phone: '', address: '' });
    }
  });

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLedgerId) return;
    createSupplierMutation.mutate({
      ledgerId: activeLedgerId,
      ...newSupplier
    });
  };

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLedgerId) return;
    createPartMutation.mutate({
      ledgerId: activeLedgerId,
      partNumber: newPart.partNumber,
      name: newPart.name,
      description: newPart.description,
      costPrice: parseFloat(newPart.costPrice) || 0,
      sellPrice: parseFloat(newPart.sellPrice) || 0,
      stockQuantity: parseInt(newPart.stockQuantity) || 0,
      minStockLevel: parseInt(newPart.minStockLevel) || 0,
    });
  };

  const filteredParts = parts?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.partNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalStockValue = filteredParts.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.costPrice || 0)), 0) || 0;
  const activePartsCount = filteredParts.length || 0;
  const lowStockCount = filteredParts.filter(p => (p.stockQuantity || 0) <= (p.minStockLevel || 0)).length || 0;

  return (
    <div className="min-h-screen bg-background dark:bg-[#050505] font-sans antialiased pb-32">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 dark:bg-[#050505]/80 backdrop-blur-2xl border-b border-border dark:border-neutral-900">
        <div className="container max-w-[1600px] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Inventory Control</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">Parts • Suppliers • Stock Management</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-2xl h-11 px-5 font-black text-[10px] uppercase tracking-widest">
                <Download className="w-3.5 h-3.5 mr-2" /> Export
              </Button>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="rounded-2xl h-11 px-5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5 mr-2" /> New Part
              </Button>
              {activeTab === 'suppliers' && (
                <Button 
                    onClick={() => setIsAddSupplierModalOpen(true)}
                    className="rounded-2xl h-11 px-5 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20"
                >
                    <Plus className="w-3.5 h-3.5 mr-2" /> New Supplier
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-[1600px] px-6 py-10 space-y-10">
        
        {/* KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Stock Value', value: `$${totalStockValue.toLocaleString()}`, change: '+0%', icon: DollarSign, color: 'blue' },
            { label: 'Active Parts', value: activePartsCount.toString(), change: `${lowStockCount} Low Stock`, icon: Package, color: 'emerald' },
            { label: 'Suppliers', value: (suppliers?.length || 0).toString(), change: 'Active Partners', icon: Box, color: 'amber' },
            { label: 'Stock Turnover', value: '0.0x', change: 'Last 90 days', icon: TrendingUp, color: 'indigo' }
          ].map((metric, i) => (
            <Card key={i} className="border-none shadow-xl shadow-black/5 bg-card dark:bg-neutral-900 p-6 rounded-[32px] group hover:shadow-2xl transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{metric.label}</p>
                  <h3 className="text-3xl font-black tracking-tighter uppercase italic">{metric.value}</h3>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    metric.color === 'amber' ? 'text-amber-600' : 'text-emerald-600'
                  )}>{metric.change}</p>
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                  metric.color === 'blue' ? 'bg-blue-600 text-white' :
                  metric.color === 'emerald' ? 'bg-emerald-500 text-white' :
                  metric.color === 'amber' ? 'bg-amber-500 text-white' :
                  'bg-indigo-600 text-white'
                )}>
                  <metric.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-card dark:bg-neutral-900 p-2 rounded-3xl border border-border dark:border-neutral-800 shadow-xl w-fit">
          {[
            { id: 'parts', label: 'Parts Catalog', icon: Package },
            { id: 'suppliers', label: 'Suppliers', icon: Box },
            { id: 'orders', label: 'Purchase Orders', icon: ShoppingCart },
            { id: 'movements', label: 'Stock Movements', icon: Layers }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === tab.id 
                  ? 'bg-neutral-900 dark:bg-card text-white dark:text-foreground shadow-lg' 
                  : 'text-neutral-400 hover:text-foreground dark:hover:text-white'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Parts Catalog View */}
        {activeTab === 'parts' && (
          <div className="space-y-6">
            {/* Search & Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center bg-card dark:bg-neutral-900 rounded-2xl px-5 py-3 border border-border dark:border-neutral-800 shadow-lg">
                <Search className="w-4 h-4 text-neutral-400 mr-3" />
                <input 
                  className="bg-transparent border-none text-sm font-bold outline-none w-full" 
                  placeholder="Search parts by name, number, or barcode..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="rounded-2xl h-12 px-5 font-black text-[10px] uppercase tracking-widest">
                <Filter className="w-3.5 h-3.5 mr-2" /> Filter
              </Button>
            </div>

            {/* Low Stock Alert */}
            {lowStockCount > 0 && (
              <Card className="border-none shadow-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-[32px] p-6 border-l-4 border-amber-500 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black uppercase tracking-tight">{lowStockCount} Parts Below Minimum Stock</h4>
                    <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mt-1">Review and create purchase orders to restock</p>
                  </div>
                  <Button className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-widest">
                    View Low Stock
                  </Button>
                </div>
              </Card>
            )}

            {/* Parts Table */}
            <Card className="border-none shadow-xl shadow-black/5 bg-card dark:bg-neutral-900 rounded-[32px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card dark:bg-neutral-800 border-b border-border dark:border-neutral-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Part Number</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Name</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Category</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Stock</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Cost</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Sell</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Margin</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-neutral-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {isLoadingParts ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-neutral-300 mx-auto" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-4">Accessing Catalog...</p>
                        </td>
                      </tr>
                    ) : !parts || parts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center">
                          <Package className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                          <h4 className="text-sm font-black uppercase tracking-tight text-neutral-400">No Inventory Found</h4>
                          <p className="text-xs font-bold text-neutral-500 mt-1">Start by adding your first component</p>
                        </td>
                      </tr>
                    ) : (
                      filteredParts.map((part, i) => {
                        const margin = (((part.sellPrice || 0) - (part.costPrice || 0)) / (part.sellPrice || 1) * 100).toFixed(1);
                        const isLowStock = (part.stockQuantity || 0) <= (part.minStockLevel || 0);
                        
                        return (
                          <tr key={i} className="hover:bg-card dark:hover:bg-neutral-800/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Barcode className="w-4 h-4 text-neutral-400" />
                                <span className="text-sm font-black tracking-tight">{part.partNumber}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold">{part.name}</td>
                            <td className="px-6 py-4">
                              <Badge className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-none text-[9px] font-black uppercase tracking-widest">
                                {part.description || "General"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-sm font-black",
                                  isLowStock ? 'text-amber-600' : 'text-emerald-600'
                                )}>{part.stockQuantity}</span>
                                {isLowStock && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-neutral-600">${(part.costPrice || 0).toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm font-black">${(part.sellPrice || 0).toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black">
                                {margin}%
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setSelectedPartForAdjustment(part)}
                                  className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>

                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Other tabs would be similar structures */}
        {activeTab === 'suppliers' && (
          <div className="text-center py-20">
            <Box className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-xl font-black uppercase tracking-tight text-neutral-400">Supplier Management</h3>
            <p className="text-sm font-bold text-neutral-500 mt-2">Track supplier contacts, lead times, and performance</p>
          </div>
        )}

      </main>

      {/* New Part Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setIsAddModalOpen(false)} />
          <Card className="relative w-full max-w-2xl bg-card dark:bg-neutral-900 border-none shadow-2xl rounded-[40px] overflow-hidden">
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Initialize Part</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-2">Catalog New Component System</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePart} className="grid grid-cols-2 gap-6">
                 {/* Form Fields (kept same as before) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Part Number</label>
                  <input 
                    required
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-blue-600 outline-none"
                    placeholder="e.g. OIL-5W30-5L"
                    value={newPart.partNumber}
                    onChange={(e) => setNewPart({...newPart, partNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Part Name</label>
                  <input 
                    required
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-blue-600 outline-none"
                    placeholder="e.g. Castrol Edge 5W-30"
                    value={newPart.name}
                    onChange={(e) => setNewPart({...newPart, name: e.target.value})}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Description</label>
                  <textarea 
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-blue-600 outline-none min-h-[100px]"
                    placeholder="Technical specifications, compatibility notes..."
                    value={newPart.description}
                    onChange={(e) => setNewPart({...newPart, description: e.target.value})}
                  />
                </div>
                 <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Cost Price (ex GST)</label>
                  <input 
                    type="number" step="0.01" required
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-blue-600 outline-none"
                    value={newPart.costPrice}
                    onChange={(e) => setNewPart({...newPart, costPrice: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Retail Price (inc GST)</label>
                  <input 
                    type="number" step="0.01" required
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-blue-600 outline-none"
                    value={newPart.sellPrice}
                    onChange={(e) => setNewPart({...newPart, sellPrice: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Initial Stock</label>
                  <input 
                    type="number" required
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-blue-600 outline-none"
                    value={newPart.stockQuantity}
                    onChange={(e) => setNewPart({...newPart, stockQuantity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Min. Stock Level</label>
                  <input 
                    type="number" required
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-blue-600 outline-none"
                    value={newPart.minStockLevel}
                    onChange={(e) => setNewPart({...newPart, minStockLevel: e.target.value})}
                  />
                </div>
                <div className="col-span-2 pt-4">
                  <Button 
                    type="submit"
                    disabled={createPartMutation.isLoading}
                    className="w-full rounded-2xl h-14 bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20"
                  >
                    {createPartMutation.isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Commit to Catalog"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      <StockAdjustmentModal 
        isOpen={!!selectedPartForAdjustment}
        onClose={() => setSelectedPartForAdjustment(null)}
        part={selectedPartForAdjustment}
        onSuccess={() => {
            refetchParts();
            setSelectedPartForAdjustment(null);
        }}
      />
    </div>
  );
}

const X = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} stroke="currentColor" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

function StockAdjustmentModal({ isOpen, onClose, part, onSuccess }: any) {
    const [quantity, setQuantity] = useState('');
    const [type, setType] = useState<'adjustment' | 'purchase' | 'return'>('adjustment');
    const [notes, setNotes] = useState('');
    
    const utils = trpc.useContext();
    const adjustStockMutation = trpc.inventory.adjustStock.useMutation({
        onSuccess: () => {
            onSuccess();
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!part) return;

        const qty = parseInt(quantity);
        if (isNaN(qty)) return;

        adjustStockMutation.mutate({
            partId: part.id,
            quantity: qty,
            movementType: type,
            notes
        });
    };

    if (!isOpen || !part) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={onClose} />
            <Card className="relative w-full max-w-md bg-card dark:bg-neutral-900 border-none shadow-2xl rounded-[32px] overflow-hidden">
                <div className="p-8 space-y-6">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Adjust Stock</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-2">{part.partNumber} - {part.name}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Adjustment Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['adjustment', 'purchase', 'return'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t as any)}
                                        className={cn(
                                            "h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            type === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-foreground'
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Quantity Change</label>
                            <input 
                                type="number" required
                                className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-blue-600 outline-none"
                                placeholder="Positive to add, negative to remove"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                            <p className="text-[10px] text-neutral-400 font-bold px-2">
                                Current Stock: {part.stockQuantity} &rarr; New: {(part.stockQuantity || 0) + (parseInt(quantity) || 0)}
                            </p>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Reason / Notes</label>
                            <input 
                                className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-blue-600 outline-none"
                                placeholder="Optional notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <Button 
                            type="submit"
                            disabled={adjustStockMutation.isLoading || !quantity}
                            className="w-full rounded-2xl h-12 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 mt-4"
                        >
                            {adjustStockMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Adjustment"}
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
