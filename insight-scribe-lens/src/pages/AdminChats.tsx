import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Search, RefreshCw, Clock, User, Bot, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  metadata: Record<string, any> | null;
  session_id: string | null;
  created_at: string;
}

interface UserChat {
  user_id: string;
  user_email?: string;
  messages: ChatMessage[];
  last_message_at: string;
}

export default function AdminChats() {
  const [chats, setChats] = useState<UserChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    setLoading(true);

    // Get all chat messages
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching chats:", error);
      setLoading(false);
      return;
    }

    // Get profiles for user emails
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name");
    const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p.display_name]) || []);

    // Get user emails from activity logs
    const { data: activities } = await supabase
      .from("activity_logs")
      .select("user_id, user_email")
      .not("user_email", "is", null);
    const emailMap = new Map(activities?.map((a: any) => [a.user_id, a.user_email]) || []);

    // Group messages by user
    const userGroups = new Map<string, ChatMessage[]>();
    (messages || []).forEach((m: any) => {
      const existing = userGroups.get(m.user_id) || [];
      existing.push(m);
      userGroups.set(m.user_id, existing);
    });

    // Convert to UserChat array
    const userChats: UserChat[] = Array.from(userGroups.entries())
      .map(([user_id, messages]) => ({
        user_id,
        user_email: emailMap.get(user_id) || profileMap.get(user_id) || undefined,
        messages,
        last_message_at: messages[messages.length - 1]?.created_at || "",
      }))
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

    setChats(userChats);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchChats();

    // Real-time subscription
    const channel = supabase
      .channel("chat_messages_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchChats]);

  const filteredChats = chats.filter((chat) =>
    (chat.user_email || "").toLowerCase().includes(search.toLowerCase()) ||
    chat.user_id.toLowerCase().includes(search.toLowerCase()) ||
    chat.messages.some((m) => m.content.toLowerCase().includes(search.toLowerCase()))
  );

  const totalMessages = chats.reduce((sum, c) => sum + c.messages.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Chat Tracking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all user chat conversations and message history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {chats.length} users • {totalMessages} messages
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchChats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email, user ID, or message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-border rounded-lg bg-card">
            No chat conversations found
          </div>
        ) : (
          filteredChats.map((chat) => (
            <motion.div
              key={chat.user_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-border rounded-lg bg-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedUser(expandedUser === chat.user_id ? null : chat.user_id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">
                      {chat.user_email || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {chat.user_id.slice(0, 8)}... • {chat.messages.length} messages
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Last message</p>
                    <p className="text-sm text-foreground">
                      {format(new Date(chat.last_message_at), "MMM d, HH:mm")}
                    </p>
                  </div>
                  {expandedUser === chat.user_id ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {expandedUser === chat.user_id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <ScrollArea className="max-h-96">
                      <div className="p-4 space-y-3">
                        {chat.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            {msg.role === "assistant" && (
                              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Bot className="h-3.5 w-3.5 text-primary" />
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] ${
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3 py-2"
                                  : "bg-muted rounded-2xl rounded-bl-md px-3 py-2"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              <p className="text-[10px] opacity-50 mt-1">
                                {format(new Date(msg.created_at), "HH:mm:ss")}
                              </p>
                            </div>
                            {msg.role === "user" && (
                              <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
