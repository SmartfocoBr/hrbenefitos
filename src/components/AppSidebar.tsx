import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Gift,
  Building2,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  Link2,
  MessageSquare,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wallet,
  FileText,
  Bell,
} from "lucide-react";
import logo from "@/assets/benefitos-logo.png";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

const mainNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Gift, label: "Benefícios", href: "/benefits" },
  { icon: Wallet, label: "Carteira Flex", href: "/wallet" },
  { icon: Users, label: "Colaboradores", href: "/employees" },
  { icon: Building2, label: "Empresas", href: "/companies" },
];

const managementNav: NavItem[] = [
  { icon: Link2, label: "Integrações", href: "/integrations" },
  { icon: BarChart3, label: "Relatórios", href: "/reports" },
  { icon: FileText, label: "Auditoria", href: "/audit" },
  { icon: CreditCard, label: "Financeiro", href: "/financial" },
];

const systemNav: NavItem[] = [
  { icon: MessageSquare, label: "Chatbot IA", href: "/chatbot", badge: 3 },
  { icon: Bell, label: "Notificações", href: "/notifications", badge: 5 },
  { icon: Shield, label: "Segurança", href: "/security" },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    
    const content = (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-sidebar-primary-foreground")} />
        {!collapsed && (
          <>
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span className="absolute right-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && item.badge && (
          <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
            {item.badge && ` (${item.badge})`}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  const NavSection = ({ title, items }: { title?: string; items: NavItem[] }) => (
    <div className="space-y-1">
      {title && !collapsed && (
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          {title}
        </p>
      )}
      {items.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}
    </div>
  );

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out relative",
        collapsed ? "w-[70px]" : "w-[260px]"
      )}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 z-50 flex items-center justify-center w-6 h-6 rounded-full bg-sidebar-accent border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Logo */}
      <div className={cn("flex items-center h-16 px-4 border-b border-sidebar-border", collapsed && "justify-center")}>
        <img 
          src={logo} 
          alt="BenefitOS" 
          className={cn("brightness-0 invert transition-all duration-300", collapsed ? "h-7" : "h-8")} 
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        <NavSection items={mainNav} />
        <NavSection title="Gestão" items={managementNav} />
        <NavSection title="Sistema" items={systemNav} />
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-medium text-sm">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.email?.split("@")[0] || "Usuário"}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  Admin
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between px-3">
              <span className="text-xs text-sidebar-foreground/40">Tema</span>
              <ThemeToggle variant="minimal" />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <ThemeToggle variant="sidebar" />
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  className="w-full h-9 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
