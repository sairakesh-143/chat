import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, Activity, FileText, Brain, Radio, ChevronRight, LogOut, User, Settings, Database, Loader2, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { seedSampleData } from "@/lib/seedData";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const navItems = [
  { to: "/admin", icon: BarChart3, label: "Overview" },
  { to: "/admin/logs", icon: FileText, label: "Request Logs" },
  { to: "/admin/metrics", icon: Activity, label: "Metrics" },
  { to: "/admin/quality", icon: Brain, label: "AI Quality" },
];

const monitoringItems = [
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/activity", icon: Activity, label: "Activity Logs" },
  { to: "/admin/chats", icon: MessageSquare, label: "Chat Tracking" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const queryClient = useQueryClient();

  const handleSeed = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      const result = await seedSampleData(user.id);
      toast({ title: "Sample data added", description: `${result.logsCount} logs, ${result.evalsCount} evaluations` });
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast({ title: "Seeding failed", description: err.message, variant: "destructive" });
    }
    setSeeding(false);
  };

  const renderNavItem = (item: typeof navItems[0]) => {
    const active = location.pathname === item.to;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === "/admin"}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group relative",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        )}
      >
        {active && (
          <motion.div
            layoutId="activeNav"
            className="absolute inset-0 bg-sidebar-accent rounded-md"
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
          />
        )}
        <item.icon className={cn("h-4 w-4 relative z-10", active && "text-primary")} />
        <span className="flex-1 relative z-10">{item.label}</span>
        {active && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground relative z-10" />}
      </NavLink>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_12px_hsl(var(--primary)/0.4)]">
              <Radio className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-sidebar-accent-foreground">RAG Monitor</h1>
              <p className="text-[11px] text-sidebar-foreground">Admin Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {/* Analytics Section */}
          <div>
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              Analytics
            </p>
            <div className="space-y-0.5">
              {navItems.map(renderNavItem)}
            </div>
          </div>

          {/* Monitoring Section */}
          <div>
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              Monitoring
            </p>
            <div className="space-y-0.5">
              {monitoringItems.map(renderNavItem)}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
            {seeding ? "Seeding..." : "Seed Sample Data"}
          </button>
          <NavLink
            to="/admin/profile"
            className="flex items-center gap-2.5 hover:bg-sidebar-accent/50 rounded-md px-2 py-1.5 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-xs text-sidebar-foreground truncate flex-1">{user?.email}</span>
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          </NavLink>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-xs text-sidebar-foreground">System Healthy</span>
            </div>
            <button
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 lg:p-8 max-w-[1400px]"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
