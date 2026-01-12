import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  Calendar,
  Download,
  Filter,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Advanced Reporting & Analytics Dashboard
 * Financial, Operational, and Customer Intelligence
 */

export default function ReportingDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'financial' | 'operational' | 'customer'>('financial');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] font-sans antialiased pb-32">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-2xl border-b border-neutral-100 dark:border-neutral-900">
        <div className="container max-w-[1600px] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Business Intelligence</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">Financial • Operational • Customer Analytics</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Time Range Selector */}
              <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 p-1 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-lg">
                {[
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' },
                  { id: '90d', label: '90 Days' },
                  { id: '1y', label: '1 Year' }
                ].map(range => (
                  <button
                    key={range.id}
                    onClick={() => setTimeRange(range.id as any)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      timeRange === range.id 
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-lg' 
                        : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <Button variant="outline" className="rounded-2xl h-11 px-5 font-black text-[10px] uppercase tracking-widest">
                <Filter className="w-3.5 h-3.5 mr-2" /> Filter
              </Button>
              <Button className="rounded-2xl h-11 px-5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20">
                <Download className="w-3.5 h-3.5 mr-2" /> Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-[1600px] px-6 py-10 space-y-10">
        
        {/* Executive Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              label: 'Total Revenue', 
              value: '$142,850', 
              change: '+18.2%', 
              trend: 'up', 
              icon: DollarSign, 
              color: 'blue',
              subtitle: 'vs last period'
            },
            { 
              label: 'Gross Profit', 
              value: '$68,420', 
              change: '+12.4%', 
              trend: 'up', 
              icon: TrendingUp, 
              color: 'emerald',
              subtitle: '47.9% margin'
            },
            { 
              label: 'Active Customers', 
              value: '342', 
              change: '+24', 
              trend: 'up', 
              icon: Users, 
              color: 'indigo',
              subtitle: 'this period'
            },
            { 
              label: 'Avg Job Value', 
              value: '$485', 
              change: '+8.5%', 
              trend: 'up', 
              icon: Target, 
              color: 'amber',
              subtitle: 'vs $447 last'
            }
          ].map((metric, i) => (
            <Card key={i} className="border-none shadow-xl shadow-black/5 bg-white dark:bg-neutral-900 p-6 rounded-[32px] group hover:shadow-2xl transition-all relative overflow-hidden">
              <div className={cn(
                "absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition-opacity",
                metric.color === 'blue' ? 'bg-blue-600' :
                metric.color === 'emerald' ? 'bg-emerald-500' :
                metric.color === 'indigo' ? 'bg-indigo-600' :
                'bg-amber-500'
              )} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                    metric.color === 'blue' ? 'bg-blue-600 text-white' :
                    metric.color === 'emerald' ? 'bg-emerald-500 text-white' :
                    metric.color === 'indigo' ? 'bg-indigo-600 text-white' :
                    'bg-amber-500 text-white'
                  )}>
                    <metric.icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1">
                    {metric.trend === 'up' ? (
                      <ArrowUp className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={cn(
                      "text-xs font-black",
                      metric.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                    )}>{metric.change}</span>
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">{metric.label}</p>
                <h3 className="text-3xl font-black tracking-tighter uppercase italic mb-1">{metric.value}</h3>
                <p className="text-[9px] font-bold text-neutral-500">{metric.subtitle}</p>
              </div>
            </Card>
          ))}
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 p-2 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xl w-fit">
          {[
            { id: 'financial', label: 'Financial Analytics', icon: DollarSign },
            { id: 'operational', label: 'Operational Metrics', icon: Activity },
            { id: 'customer', label: 'Customer Insights', icon: Users }
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

        {/* Financial Analytics */}
        {activeTab === 'financial' && (
          <div className="space-y-8">
            
            {/* Revenue Trend Chart */}
            <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-neutral-900 rounded-[32px] p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black tracking-tighter uppercase italic">Revenue Trend</h3>
                  <p className="text-xs font-bold text-neutral-500 mt-1">Daily revenue over selected period</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 border-none text-[9px] font-black uppercase tracking-widest px-3 py-1">
                    <TrendingUp className="w-3 h-3 mr-1" /> +18.2%
                  </Badge>
                </div>
              </div>
              
              {/* Simplified Chart Representation */}
              <div className="h-64 bg-gradient-to-t from-blue-50 to-transparent dark:from-blue-900/10 rounded-2xl p-6 flex items-end gap-2">
                {[65, 72, 68, 85, 92, 88, 95, 78, 82, 90, 88, 94, 100, 96, 92, 98, 95, 88, 92, 96, 100, 94, 90, 95, 92, 88, 94, 98, 96, 100].map((height, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg hover:from-blue-500 hover:to-blue-300 transition-all cursor-pointer group relative"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap">
                      ${(height * 50).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between mt-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                <span>Day 1</span>
                <span>Day 15</span>
                <span>Day 30</span>
              </div>
            </Card>

            {/* Profit Margins by Job Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-neutral-900 rounded-[32px] p-8">
                <h3 className="text-lg font-black tracking-tighter uppercase italic mb-6">Profit by Job Type</h3>
                <div className="space-y-4">
                  {[
                    { type: 'Service & Maintenance', revenue: 48200, cost: 22100, margin: 54.2, color: 'blue' },
                    { type: 'Repairs', revenue: 62400, cost: 34800, margin: 44.2, color: 'emerald' },
                    { type: 'WoF & Inspections', revenue: 18600, cost: 6200, margin: 66.7, color: 'indigo' },
                    { type: 'Diagnostics', revenue: 13650, cost: 5450, margin: 60.1, color: 'amber' }
                  ].map((job, i) => {
                    const profit = job.revenue - job.cost;
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black">{job.type}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-neutral-500">${profit.toLocaleString()}</span>
                            <Badge className={cn(
                              "border-none text-[9px] font-black",
                              job.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                              job.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                              job.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-amber-100 text-amber-700'
                            )}>
                              {job.margin}%
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                          <div 
                            className={cn(
                              "h-full",
                              job.color === 'blue' ? 'bg-blue-600' :
                              job.color === 'emerald' ? 'bg-emerald-500' :
                              job.color === 'indigo' ? 'bg-indigo-600' :
                              'bg-amber-500'
                            )}
                            style={{ width: `${job.margin}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Outstanding Invoices */}
              <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-neutral-900 rounded-[32px] p-8">
                <h3 className="text-lg font-black tracking-tighter uppercase italic mb-6">Outstanding Invoices</h3>
                <div className="space-y-4">
                  {[
                    { range: 'Current (0-30 days)', amount: 12400, count: 18, status: 'good' },
                    { range: '31-60 days', amount: 4200, count: 6, status: 'warning' },
                    { range: '61-90 days', amount: 1800, count: 3, status: 'danger' },
                    { range: '90+ days', amount: 850, count: 2, status: 'critical' }
                  ].map((aging, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          aging.status === 'good' ? 'bg-emerald-100 text-emerald-600' :
                          aging.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                          aging.status === 'danger' ? 'bg-orange-100 text-orange-600' :
                          'bg-red-100 text-red-600'
                        )}>
                          {aging.status === 'good' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-black">{aging.range}</p>
                          <p className="text-[10px] font-bold text-neutral-500">{aging.count} invoices</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black">${aging.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black">Total Outstanding</span>
                    <span className="text-xl font-black text-blue-600">$19,250</span>
                  </div>
                </div>
              </Card>
            </div>

          </div>
        )}

        {/* Operational Metrics */}
        {activeTab === 'operational' && (
          <div className="space-y-8">
            
            {/* Bay Utilization */}
            <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-neutral-900 rounded-[32px] p-8">
              <h3 className="text-xl font-black tracking-tighter uppercase italic mb-6">Bay Utilization</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { bay: 'Bay 1', utilization: 92, hours: 7.4, jobs: 12 },
                  { bay: 'Bay 2', utilization: 88, hours: 7.0, jobs: 11 },
                  { bay: 'Bay 3', utilization: 76, hours: 6.1, jobs: 9 },
                  { bay: 'Bay 4', utilization: 84, hours: 6.7, jobs: 10 }
                ].map((bay, i) => (
                  <div key={i} className="text-center space-y-4">
                    <div className="relative w-32 h-32 mx-auto">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-neutral-100 dark:text-neutral-800"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - bay.utilization / 100)}`}
                          className="text-blue-600 transition-all duration-1000"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black">{bay.utilization}%</span>
                        <span className="text-[9px] font-bold text-neutral-500">utilized</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-black mb-2">{bay.bay}</p>
                      <div className="space-y-1 text-[10px] font-bold text-neutral-500">
                        <p>{bay.hours}h productive</p>
                        <p>{bay.jobs} jobs completed</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Technician Performance */}
            <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden">
              <div className="p-8">
                <h3 className="text-xl font-black tracking-tighter uppercase italic mb-6">Technician Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 dark:bg-neutral-800 border-y border-neutral-100 dark:border-neutral-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Technician</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Jobs</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Avg Time</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Revenue</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Efficiency</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {[
                      { name: 'Mike Johnson', jobs: 42, avgTime: '2.4h', revenue: 18400, efficiency: 94, rating: 4.9 },
                      { name: 'Sarah Chen', jobs: 38, avgTime: '2.6h', revenue: 16800, efficiency: 91, rating: 4.8 },
                      { name: 'Tom Williams', jobs: 35, avgTime: '2.8h', revenue: 15200, efficiency: 88, rating: 4.7 },
                      { name: 'Lisa Brown', jobs: 31, avgTime: '3.1h', revenue: 13600, efficiency: 82, rating: 4.6 }
                    ].map((tech, i) => (
                      <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-black">{tech.name}</td>
                        <td className="px-6 py-4 text-sm font-bold">{tech.jobs}</td>
                        <td className="px-6 py-4 text-sm font-bold text-neutral-600">{tech.avgTime}</td>
                        <td className="px-6 py-4 text-sm font-black">${tech.revenue.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden max-w-[100px]">
                              <div className="h-full bg-emerald-500" style={{ width: `${tech.efficiency}%` }} />
                            </div>
                            <span className="text-xs font-black text-emerald-600">{tech.efficiency}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] font-black">
                            ⭐ {tech.rating}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
        )}

        {/* Customer Insights */}
        {activeTab === 'customer' && (
          <div className="space-y-8">
            
            {/* Customer Lifetime Value */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-none shadow-xl shadow-black/5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[32px] p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Avg Customer LTV</p>
                    <h3 className="text-3xl font-black tracking-tighter italic">$2,450</h3>
                  </div>
                </div>
                <p className="text-xs font-bold text-white/80 leading-relaxed">Based on 18-month average customer lifespan with 4.2 visits per year</p>
              </Card>

              <Card className="border-none shadow-xl shadow-black/5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[32px] p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Repeat Rate</p>
                    <h3 className="text-3xl font-black tracking-tighter italic">68%</h3>
                  </div>
                </div>
                <p className="text-xs font-bold text-white/80 leading-relaxed">68% of customers return within 6 months for additional services</p>
              </Card>

              <Card className="border-none shadow-xl shadow-black/5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-[32px] p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Churn Risk</p>
                    <h3 className="text-3xl font-black tracking-tighter italic">24</h3>
                  </div>
                </div>
                <p className="text-xs font-bold text-white/80 leading-relaxed">24 customers haven't visited in 180+ days and may be at risk</p>
              </Card>
            </div>

            {/* Top Customers */}
            <Card className="border-none shadow-xl shadow-black/5 bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden">
              <div className="p-8">
                <h3 className="text-xl font-black tracking-tighter uppercase italic mb-6">Top Customers by Revenue</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 dark:bg-neutral-800 border-y border-neutral-100 dark:border-neutral-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Customer</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Total Spent</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Visits</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Avg Job</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Last Visit</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {[
                      { name: 'ABC Transport Ltd', spent: 8400, visits: 12, avg: 700, lastVisit: '2 days ago', status: 'active' },
                      { name: 'John Smith', spent: 6200, visits: 8, avg: 775, lastVisit: '1 week ago', status: 'active' },
                      { name: 'City Couriers', spent: 5800, visits: 15, avg: 387, lastVisit: '3 days ago', status: 'active' },
                      { name: 'Sarah Johnson', spent: 4900, visits: 6, avg: 817, lastVisit: '2 weeks ago', status: 'active' },
                      { name: 'Tech Solutions Inc', spent: 4200, visits: 9, avg: 467, lastVisit: '5 days ago', status: 'active' }
                    ].map((customer, i) => (
                      <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-black">{customer.name}</td>
                        <td className="px-6 py-4 text-sm font-black text-blue-600">${customer.spent.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-bold">{customer.visits}</td>
                        <td className="px-6 py-4 text-sm font-bold text-neutral-600">${customer.avg}</td>
                        <td className="px-6 py-4 text-xs font-bold text-neutral-500">{customer.lastVisit}</td>
                        <td className="px-6 py-4">
                          <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black uppercase tracking-widest">
                            {customer.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
        )}

      </main>

    </div>
  );
}
