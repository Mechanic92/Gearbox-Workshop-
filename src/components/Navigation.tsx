import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Menu, X, Home, Wrench, Users, Calendar, 
  BarChart3, Car, CheckSquare, ChevronRight, LogOut,
  Zap, Settings as SettingsIcon, LayoutGrid, PanelLeftClose, PanelLeft
} from "lucide-react";
import { useLedger } from "@/contexts/LedgerContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebar_collapsed");
    return stored === "true";
  });
  const [location, navigate] = useLocation();
  const { activeLedgerId, activeLedgerType } = useLedger();
  const { user, logout } = useAuth();

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const menuItems = [
    {
      category: "Main",
      items: [
        { label: "Overview", icon: Home, path: "/trades/dashboard" },
        { label: "Workflow", icon: Wrench, path: "/trades/jobs" },
        { label: "Assets", icon: Car, path: "/trades/vehicles" },
        { label: "Network", icon: Users, path: "/trades/customers" },
      ],
    },
    {
      category: "Operations",
      items: [
        { label: "Schedule", icon: Calendar, path: "/bookings" },
        { label: "Protocol", icon: CheckSquare, path: "/dvi" },
      ],
    },
    {
      category: "System",
      items: [
        { label: "Insights", icon: BarChart3, path: "/trades/reports" },
        { label: "Config", icon: SettingsIcon, path: "/settings" },
      ],
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full glass-dark text-white p-6 relative overflow-hidden">
      {/* Dynamic Background Glow in Sidebar */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
      
      {/* Brand */}
      <div className="mb-12 flex flex-col items-start px-4">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform duration-500">
            <Zap size={24} fill="currentColor" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none italic">GearBox</h1>
              <p className="text-[9px] uppercase tracking-[0.4em] font-black text-primary leading-none mt-1">Universal OS</p>
            </div>
          )}
        </div>
        
        {activeLedgerType && !isCollapsed && (
          <div className="mt-10 w-full p-4 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-4 group cursor-pointer hover:bg-white/10 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <LayoutGrid size={18} />
            </div>
            <div className="flex-1 overflow-hidden">
               <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">Active System</p>
               <p className="font-bold text-xs truncate uppercase tracking-tighter">{activeLedgerType === "trades" ? "Trades Fleet" : "Rental Portfolio"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Collapse Toggle */}
      <button
        onClick={toggleCollapse}
        className="hidden lg:flex absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/5 hover:bg-primary/20 border border-white/10 items-center justify-center transition-all duration-300 group z-50"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <PanelLeft size={18} className="text-white/50 group-hover:text-primary transition-colors" />
        ) : (
          <PanelLeftClose size={18} className="text-white/50 group-hover:text-primary transition-colors" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-10 overflow-y-auto scrollbar-none px-2">
        {menuItems.map((section) => (
          <div key={section.category} className="space-y-4">
            {!isCollapsed && (
              <h2 className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] px-4">
                {section.category}
              </h2>
            )}
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                        "w-full flex items-center gap-4 py-3.5 rounded-2xl transition-all duration-500 group relative overflow-hidden",
                        isCollapsed ? "px-3 justify-center" : "px-4",
                        isActive 
                        ? "bg-white text-black shadow-[0_15px_30px_rgba(255,255,255,0.1)]" 
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon size={20} className={cn("transition-all duration-500", isActive ? "scale-110" : "group-hover:text-primary")} strokeWidth={2.5} />
                    {!isCollapsed && <span className="text-sm font-black tracking-tight uppercase">{item.label}</span>}
                    {isActive && !isCollapsed && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="mt-8">
        <div className={cn(
          "p-4 rounded-[2rem] bg-white/5 flex items-center gap-4 group",
          isCollapsed && "flex-col p-3"
        )}>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-black font-black text-sm shadow-lg">
                {user?.name?.[0] || "U"}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-background" />
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate uppercase tracking-tight">{user?.name || "Operator"}</p>
                <p className="text-[9px] text-white/30 truncate uppercase tracking-widest font-bold">Admin Privileges</p>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-6 left-6 z-50 p-4 rounded-2xl glass shadow-2xl transition-all lg:hidden border border-white/10"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-500"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
            "fixed left-0 top-0 h-screen z-40 transform transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "lg:translate-x-0",
            isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            isCollapsed ? "lg:w-24 w-80" : "w-80"
        )}
      >
        <SidebarContent />
      </div>

      {/* Spacer for content */}
      <div className={cn(
        "hidden lg:block flex-shrink-0 transition-all duration-700",
        isCollapsed ? "lg:w-24" : "lg:w-80"
      )} />
    </>
  );
}
