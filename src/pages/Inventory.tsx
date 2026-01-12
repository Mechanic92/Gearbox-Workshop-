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
  Barcode,
  DollarSign,
  ShoppingCart,
  Box,
  Layers,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Inventory Management Dashboard
 * Complete parts, suppliers, and stock control system
 */

export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState<'parts' | 'suppliers' | 'orders' | 'movements'>('parts');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] font-sans antialiased pb-32">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-2xl border-b border-neutral-100 dark:border-neutral-900">
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
              <Button className="rounded-2xl h-11 px-5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20">
                <Plus className="w-3.5 h-3.5 mr-2" /> New Part
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-[1600px] px-6 py-10 space-y-10">
        
        {/* KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Stock Value', value: '$48,250', change: '+8.2%', icon: DollarSign, color: 'blue' },
            { label: 'Active Parts', value: '342', change: '12 Low Stock', icon: Package, color: 'emerald' },
            { label: 'Pending Orders', value: '8', change: '$12,400', icon: ShoppingCart, color: 'amber' },
            { label: 'Stock Turnover', value: '4.2x', change: 'Last 90 days', icon: TrendingUp, color: 'indigo' }
          ].map((metric, i) => (
            <Card key={i} className="border-none shadow-xl shadow-black/5 bg-white dark:bg-neutral-900 p-6 rounded-[32px] group hover:shadow-2xl transition-all">
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
        <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 p-2 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xl w-fit">
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
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-lg' 
                  : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
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
              <div className="flex-1 flex items-center bg-white dark:bg-neutral-900 rounded-2xl px-5 py-3 border border-neutral-100 dark:border-neutral-800 shadow-lg">
                <Search className="w-4 h-4 text-neutral-400 mr-3" />
                <input 
                  className="bg-transparent border-none text-sm font-bold outline-none w-full" 
                  placeholder="Search parts by name, number, or barcode..." 
                />
              </div>
              <Button variant="outline" className="rounded-2xl h-12 px-5 font-black text-[10px] uppercase tracking-widest">
                <Filter className="w-3.5 h-3.5 mr-2" /> Filter
              </Button>
            </div>

            {/* Low Stock Alert */}
            <Card className="border-none shadow-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-[32px] p-6 border-l-4 border-amber-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black uppercase tracking-tight">12 Parts Below Minimum Stock</h4>
                  <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mt-1">Review and create purchase orders to restock</p>
                </div>
                <Button className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-widest">
                  View Low Stock
                </Button>
              </div>
            </Card>

            {/* Parts Table */}
            <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700">
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
                    {[
                      { partNo: 'OIL-5W30-5L', name: 'Castrol Edge 5W-30', category: 'Oils & Fluids', stock: 24, min: 10, cost: 42.50, sell: 75.00 },
                      { partNo: 'BRK-PAD-FR', name: 'Brake Pads - Front', category: 'Brakes', stock: 8, min: 12, cost: 85.00, sell: 150.00 },
                      { partNo: 'AIR-FLT-STD', name: 'Air Filter Standard', category: 'Filters', stock: 45, min: 20, cost: 12.00, sell: 28.00 },
                      { partNo: 'SPARK-PLG-4', name: 'Spark Plugs (Set of 4)', category: 'Ignition', stock: 32, min: 15, cost: 24.00, sell: 55.00 },
                    ].map((part, i) => {
                      const margin = ((part.sell - part.cost) / part.sell * 100).toFixed(1);
                      const isLowStock = part.stock <= part.min;
                      
                      return (
                        <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Barcode className="w-4 h-4 text-neutral-400" />
                              <span className="text-sm font-black tracking-tight">{part.partNo}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold">{part.name}</td>
                          <td className="px-6 py-4">
                            <Badge className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-none text-[9px] font-black uppercase tracking-widest">
                              {part.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-sm font-black",
                                isLowStock ? 'text-amber-600' : 'text-emerald-600'
                              )}>{part.stock}</span>
                              {isLowStock && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-neutral-600">${part.cost.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm font-black">${part.sell.toFixed(2)}</td>
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
                              <button className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

    </div>
  );
}
