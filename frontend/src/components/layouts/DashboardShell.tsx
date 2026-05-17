"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  LibraryBig,
  FolderOpen,
  Boxes,
  History,
  Coins,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/generate", icon: Sparkles, label: "Generate" },
  { href: "/dashboard/library", icon: LibraryBig, label: "Library" },
  { href: "/dashboard/projects", icon: FolderOpen, label: "Projects" },
  { href: "/dashboard/models", icon: Boxes, label: "Models" },
  { href: "/dashboard/history", icon: History, label: "History" },
  { href: "/dashboard/usage", icon: Coins, label: "Usage" },
];

const bottomItems = [
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors w-full",
    active
      ? collapsed
        ? "bg-cyan-500/8 text-cyan-600 dark:text-cyan-400 justify-center px-2"
        : "border-l-2 border-cyan-500 bg-cyan-500/8 text-cyan-700 dark:text-cyan-400 rounded-l-none pl-[10px] pr-3"
      : collapsed
        ? "text-muted-foreground hover:bg-muted hover:text-foreground justify-center px-2"
        : "text-muted-foreground hover:bg-muted hover:text-foreground pl-3 pr-3"
  );

  const content = (
    <>
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && label}
    </>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Link href={href} onClick={onClick} className={className} aria-label={label} />
          }
        >
          {content}
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      {content}
    </Link>
  );
}

function SidebarContent({
  collapsed,
  isActive,
  onNavClick,
  onSignOut,
  session,
}: {
  collapsed: boolean;
  isActive: (href: string) => boolean;
  onNavClick: () => void;
  onSignOut: () => void;
  session: { name?: string | null; email?: string | null } | null;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b px-4 gap-3",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-base font-semibold tracking-tight">
            MediaGen
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        <TooltipProvider delay={0}>
          {navItems.map(({ href, icon, label }) => (
            <NavLink
              key={href}
              href={href}
              icon={icon}
              label={label}
              active={isActive(href)}
              collapsed={collapsed}
              onClick={onNavClick}
            />
          ))}
        </TooltipProvider>
      </nav>

      <Separator />

      {/* Bottom */}
      <div className="py-4 px-2 space-y-1">
        {/* User profile strip */}
        {!collapsed && session && (
          <div className="px-1 py-2 mb-1">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-white">
                  {session.name?.[0]?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{session.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{session.email}</p>
              </div>
            </div>
          </div>
        )}

        <TooltipProvider delay={0}>
          {bottomItems.map(({ href, icon, label }) => (
            <NavLink
              key={href}
              href={href}
              icon={icon}
              label={label}
              active={isActive(href)}
              collapsed={collapsed}
              onClick={onNavClick}
            />
          ))}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    onClick={onSignOut}
                    className="flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Sign out"
                  />
                }
              >
                <LogOut className="h-5 w-5" />
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={onSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Sign out
            </button>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSignOut() {
    logout();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const sidebarProps = {
    collapsed,
    isActive,
    onNavClick: () => setMobileOpen(false),
    onSignOut: handleSignOut,
    session: user ? { name: user.name, email: user.email } : null,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r bg-card transition-all duration-300 ease-in-out relative",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent {...sidebarProps} />
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm text-muted-foreground hover:text-foreground transition-colors z-10"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-card transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex h-16 items-center border-b px-4 gap-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-base font-semibold">MediaGen</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
