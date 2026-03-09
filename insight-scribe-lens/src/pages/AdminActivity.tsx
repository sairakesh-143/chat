import { useState, useEffect, useCallback } from "react";
import { Activity, Search, Filter, RefreshCw, Clock, User, LogIn, LogOut, MessageSquare, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string | null;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

const ACTION_ICONS: Record<string, typeof LogIn> = {
  login: LogIn,
  logout: LogOut,
  chat_message: MessageSquare,
  page_view: Eye,
  signup: User,
};

const ACTION_COLORS: Record<string, string> = {
  login: "bg-chart-green/20 text-chart-green",
  logout: "bg-chart-red/20 text-chart-red",
  chat_message: "bg-chart-blue/20 text-chart-blue",
  page_view: "bg-chart-amber/20 text-chart-amber",
  signup: "bg-chart-purple/20 text-chart-purple",
};

export default function AdminActivity() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Error fetching activity logs:", error);
    } else {
      setLogs((data as ActivityLog[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();

    // Real-time subscription
    const channel = supabase
      .channel("activity_logs_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, (payload) => {
        setLogs((prev) => [payload.new as ActivityLog, ...prev].slice(0, 500));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.user_email || "").toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.user_id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesFilter;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Activity Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time monitoring of all user activities and actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {filteredLogs.length} logs
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, user ID, or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {action.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-border rounded-lg overflow-hidden bg-card"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                </TableRow>
              ))
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  No activity logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const Icon = ACTION_ICONS[log.action] || Activity;
                const colorClass = ACTION_COLORS[log.action] || "bg-secondary text-foreground";
                return (
                  <TableRow key={log.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                            {log.user_email || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${colorClass} gap-1`}>
                        <Icon className="h-3 w-3" />
                        {log.action.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-muted-foreground font-mono max-w-[250px] truncate">
                        {Object.keys(log.details || {}).length > 0
                          ? JSON.stringify(log.details)
                          : "—"}
                      </p>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
