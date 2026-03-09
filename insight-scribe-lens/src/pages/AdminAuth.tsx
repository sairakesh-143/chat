import { useState } from "react";
import { Eye, EyeOff, Loader2, Shield, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ADMIN_EMAIL } from "@/lib/constants";
import { useNavigate } from "react-router-dom";

export default function AdminAuth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (email !== ADMIN_EMAIL) {
      setLoading(false);
      toast({
        title: "Access denied",
        description: "Only the configured admin email can use this page.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        toast({ title: "Failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "We sent you a password reset link." });
      }
      return;
    }

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      setLoading(false);

      if (error) {
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Admin account created", description: "You're now signed in." });
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast({
        title: "Login failed",
        description: error.message === "Invalid login credentials"
          ? "Admin account not found. Click 'Create admin account' first."
          : error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — admin branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-sidebar">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--destructive)/0.1),transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center px-12"
        >
          <div className="h-16 w-16 rounded-2xl bg-destructive flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-destructive-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">Admin Portal</h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Restricted access. Monitor RAG pipelines, review metrics, and manage AI quality evaluations.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: "Access", value: "Admin Only" },
              { label: "Security", value: "Protected" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold font-mono text-destructive">{stat.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-8 w-8 rounded-lg bg-destructive flex items-center justify-center">
              <Shield className="h-4 w-4 text-destructive-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">Admin Portal</h1>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">
            {mode === "forgot" ? "Reset password" : mode === "signup" ? "Create admin account" : "Admin Sign In"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "forgot" ? "We'll send you a reset link" : "Restricted to authorized administrators"}
          </p>

          {mode === "forgot" && (
            <button
              onClick={() => setMode("login")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                placeholder="admin@example.com"
                required
              />
            </div>
            {(mode === "login" || mode === "signup") && (
              <div>
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </button>
              </div>
            )}
            <Button type="submit" className="w-full" variant="destructive" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "login" ? "Sign In as Admin" : mode === "signup" ? "Create Admin Account" : "Send Reset Link"}
            </Button>
          </form>

          {mode !== "forgot" && (
            <p className="text-sm text-center text-muted-foreground mt-6">
              {mode === "login" ? "First time admin? " : "Already have an admin account? "}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary hover:underline font-medium"
              >
                {mode === "login" ? "Create admin account" : "Sign in"}
              </button>
            </p>
          )}

          <p className="text-sm text-center text-muted-foreground mt-4">
            Not an admin?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-primary hover:underline font-medium"
            >
              Go to User Login
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

