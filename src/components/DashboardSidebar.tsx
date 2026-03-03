
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
  Settings,
  Wrench,
  Code2,
  Terminal,
  Users,
  Key,
  FileText,
  HelpCircle,
  BookOpen,
  Gauge,
  Bell,
  Shield,
  Database,
  GitBranch,
  CheckSquare,
  Radio,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Separator } from "./ui/separator";

const primaryItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projets", href: "/sites", icon: Globe },
  { name: "Domaines", href: "/domains", icon: LinkIcon },
  { name: "Outils", href: "/tools", icon: Wrench },
  { name: "Infrastructure", href: "/storage", icon: HardDrive },
];

const developmentItems = [
  { name: "Console", href: "/console", icon: Terminal },
  { name: "API & Webhooks", href: "/api", icon: Code2 },
  { name: "Base de données", href: "/database", icon: Database },
  { name: "Déploiements", href: "/deployments", icon: GitBranch },
  { name: "Tests", href: "/tests", icon: CheckSquare },
  { name: "Monitoring", href: "/monitoring", icon: Gauge },
];

const teamItems = [
  { name: "Collaborateurs", href: "/collaborators", icon: Users },
  { name: "Clés API", href: "/api-keys", icon: Key },
  { name: "Audit Log", href: "/audit", icon: Shield },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

const resourceItems = [
  { name: "Documentation", href: "/docs", icon: BookOpen },
  { name: "Changelog", href: "/changelog", icon: FileText },
  { name: "Support", href: "/support", icon: HelpCircle },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "relative flex flex-col h-screen bg-background border-r border-border transition-all duration-300 ease-in-out z-40",
      collapsed ? "w-[60px]" : "w-64"
    )}>
      {/* Brand Section */}
      <div className="h-16 flex items-center px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded text-primary-foreground">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="text-lg font-bold tracking-tight">SaasFlow</span>
          </div>
        )}
        {collapsed && (
           <div className="bg-primary p-1.5 rounded text-primary-foreground mx-auto">
            <Zap className="h-4 w-4 fill-current" />
          </div>
        )}
      </div>

      <Separator className="bg-border/50" />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Principal */}
        <div>
          {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Principal</p>}
          <nav className="space-y-1">
            {primaryItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer group",
                    isActive 
                      ? "bg-secondary text-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-0"
                  )}>
                    <item.icon className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {!collapsed && <span>{item.name}</span>}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Développement */}
        {!collapsed && <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Développement</p>
          <nav className="space-y-1">
            {developmentItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer group",
                    isActive 
                      ? "bg-secondary text-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    <item.icon className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>}

        {/* Équipe */}
        {!collapsed && <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Équipe</p>
          <nav className="space-y-1">
            {teamItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer group",
                    isActive 
                      ? "bg-secondary text-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    <item.icon className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>}

        {/* Gestion */}
        <div>
          {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Gestion</p>}
          <nav className="space-y-1">
            <Link href="/billing">
              <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer group",
                pathname === "/billing" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}>
                <CreditCard className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Facturation</span>}
              </div>
            </Link>
            <Link href="/settings">
              <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer group",
                pathname === "/settings" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}>
                <Settings className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Paramètres</span>}
              </div>
            </Link>
          </nav>
        </div>

        {/* Ressources */}
        {!collapsed && <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Ressources</p>
          <nav className="space-y-1">
            {resourceItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer group",
                    isActive 
                      ? "bg-secondary text-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    <item.icon className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>}
      </div>

      {/* User & Footer */}
      <div className="p-3 border-t border-border">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-md bg-muted/50 border border-border/40">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground truncate">{user?.displayName || "Admin User"}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 transition-colors", 
            collapsed && "justify-center px-0"
          )}
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2">Déconnexion</span>}
        </Button>
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-background text-foreground hover:bg-muted transition-colors hidden md:flex shadow-sm"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </div>
  );
}
