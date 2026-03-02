"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Globe, 
  Link as LinkIcon, 
  HardDrive, 
  CreditCard, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const navItems = [
  { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projets", href: "/sites", icon: Globe },
  { name: "Domaines", href: "/domains", icon: LinkIcon },
  { name: "Infrastructure", href: "/storage", icon: HardDrive },
  { name: "Facturation", href: "/billing", icon: CreditCard },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "relative flex flex-col h-screen bg-card border-r border-white/5 transition-all duration-500 ease-in-out z-40 shadow-2xl shadow-black",
      collapsed ? "w-20" : "w-72"
    )}>
      {/* Brand Section */}
      <div className="p-8 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-primary to-accent p-2 rounded-xl shadow-lg shadow-primary/20">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter italic">Saas<span className="text-primary">Flow</span></span>
          </div>
        )}
        {collapsed && (
           <div className="bg-gradient-to-tr from-primary to-accent p-2 rounded-xl mx-auto">
            <Zap className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-8">
        {!collapsed && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-4 mb-4 opacity-50">Menu Principal</p>}
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "group flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 relative",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white",
                collapsed && "justify-center"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
                )} />
                {!collapsed && <span>{item.name}</span>}
                {isActive && !collapsed && (
                  <div className="absolute right-4 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User & Footer */}
      <div className="p-6 border-t border-white/5 bg-black/20 space-y-6">
        {!collapsed && (
          <div className="flex items-center gap-4 px-2 py-3 bg-white/5 rounded-2xl border border-white/5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-black text-lg border border-white/20">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate">{user?.displayName || "Admin User"}</span>
              <span className="text-[10px] text-muted-foreground font-medium truncate opacity-60 uppercase tracking-wider">{user?.email}</span>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-12 transition-all group", 
            collapsed && "justify-center px-0"
          )}
          onClick={signOut}
        >
          <LogOut className="h-5 w-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
          {!collapsed && <span className="ml-3 font-bold">Déconnexion</span>}
        </Button>
      </div>

      {/* Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute -right-3 top-24 h-7 w-7 rounded-full bg-card border-white/10 text-white hover:bg-primary transition-colors hidden md:flex shadow-xl"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </div>
  );
}