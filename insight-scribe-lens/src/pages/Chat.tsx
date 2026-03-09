import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Clock, Coins, Hash, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { logActivity } from "@/lib/activityLogger";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    latency: number;
    tokens_used: number;
    cost: number;
    request_id: string;
  };
}

export default function Chat() {
  const { user, signOut } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [systemOnline, setSystemOnline] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(crypto.randomUUID());

  // Load previous messages from DB
  useEffect(() => {
    if (!user) return;
    logActivity("page_view", { page: "/chat" });

    supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (data) {
          setMessages(
            data.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.created_at),
              metadata: m.metadata && Object.keys(m.metadata).length > 0 ? m.metadata : undefined,
            }))
          );
        }
        setInitialLoading(false);
      });
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const persistMessage = async (role: "user" | "assistant", content: string, metadata?: any) => {
    if (!user) return;
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role,
      content,
      metadata: metadata ?? {},
      session_id: sessionId.current,
    } as any);
  };

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: q,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Persist user message
    persistMessage("user", q);
    logActivity("chat_message", { role: "user", preview: q.slice(0, 100) });

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke("query", {
        body: { question: q, history },
      });

      if (error) throw error;

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
        metadata: {
          latency: data.latency,
          tokens_used: data.tokens_used,
          cost: data.cost,
          request_id: data.request_id,
        },
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setSystemOnline(true);

      // Persist assistant message
      persistMessage("assistant", data.answer, assistantMsg.metadata);
    } catch (err: any) {
      console.error("Chat error:", err);
      setSystemOnline(false);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      persistMessage("assistant", errorMsg.content);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI Assistant</h1>
            <div className="flex items-center gap-1.5">
              <div
                className={`h-2 w-2 rounded-full ${
                  systemOnline ? "bg-primary animate-pulse-glow" : "bg-destructive"
                }`}
              />
              <span className="text-xs text-muted-foreground">
                {systemOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-destructive">
          <LogOut className="h-4 w-4 mr-1.5" />
          Logout
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          {initialLoading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <Bot className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                How can I help you?
              </h2>
              <p className="text-muted-foreground text-sm max-w-md">
                Ask me anything. I'm here to help with questions, analysis, writing, and more.
              </p>
            </div>
          ) : null}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-12 w-12 rounded-xl shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message: msg }: { message: ChatMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
    >
      {msg.role === "assistant" && (
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={`max-w-[75%] ${
          msg.role === "user"
            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5"
            : "bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3"
        }`}
      >
        {msg.role === "assistant" ? (
          <div className="prose prose-sm prose-invert max-w-none text-foreground [&_p]:mb-2 [&_p:last-child]:mb-0 text-sm">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        )}

        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] opacity-50">
            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {msg.metadata && (
            <>
              <span className="flex items-center gap-1 text-[10px] opacity-50">
                <Clock className="h-2.5 w-2.5" />
                {(msg.metadata.latency / 1000).toFixed(1)}s
              </span>
              <span className="flex items-center gap-1 text-[10px] opacity-50">
                <Hash className="h-2.5 w-2.5" />
                {msg.metadata.tokens_used} tokens
              </span>
            </>
          )}
        </div>
      </div>
      {msg.role === "user" && (
        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );
}
