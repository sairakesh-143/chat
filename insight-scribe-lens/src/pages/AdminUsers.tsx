import { useState, useEffect } from "react";
import { Users, Search, Mail, Calendar, Activity as ActivityIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_login?: string;
  message_count?: number;
  activity_count?: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Get profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
      return;
    }

    // Get message counts per user
    const { data: messageCounts } = await supabase
      .from("chat_messages")
      .select("user_id");

    // Get activity counts per user
    const { data: activityCounts } = await supabase
      .from("activity_logs")
      .select("user_id, action, created_at")
      .order("created_at", { ascending: false });

    const messageMap = new Map<string, number>();
    messageCounts?.forEach((m: any) => {
      messageMap.set(m.user_id, (messageMap.get(m.user_id) || 0) + 1);
    });

    const activityMap = new Map<string, number>();
    const lastLoginMap = new Map<string, string>();
    activityCounts?.forEach((a: any) => {
      activityMap.set(a.user_id, (activityMap.get(a.user_id) || 0) + 1);
      if (a.action === "login" && !lastLoginMap.has(a.user_id)) {
        lastLoginMap.set(a.user_id, a.created_at);
      }
    });

    const enrichedUsers = (profiles || []).map((p: any) => ({
      ...p,
      message_count: messageMap.get(p.user_id) || 0,
      activity_count: activityMap.get(p.user_id) || 0,
      last_login: lastLoginMap.get(p.user_id),
    }));

    setUsers(enrichedUsers);
    setLoading(false);
  };

  const filteredUsers = users.filter((u) =>
    (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    u.user_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor all registered users, their activity, and login history
          </p>
        </div>
        <Badge variant="outline" className="font-mono">
          {users.length} users
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-border rounded-lg overflow-hidden bg-card"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-center">Messages</TableHead>
              <TableHead className="text-center">Activities</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.display_name || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{user.user_id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.last_login ? (
                      <span className="text-sm text-foreground">
                        {format(new Date(user.last_login), "MMM d, yyyy HH:mm")}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-mono">
                      {user.message_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono">
                      {user.activity_count}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
