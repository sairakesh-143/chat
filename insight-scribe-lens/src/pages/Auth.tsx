import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Radio, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ADMIN_EMAIL } from "@/lib/constants";
import { motion } from "framer-motion";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      } else if (data.user?.email === ADMIN_EMAIL) {
        await supabase.auth.signOut();
        toast({ title: "Access denied", description: "Admins must use the admin login page.", variant: "destructive" });
      } else {
        toast({ title: "Account created!", description: "You are now signed in." });
      }
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }
    if (data.user?.email === ADMIN_EMAIL) {
      await supabase.auth.signOut();
      toast({ title: "Access denied", description: "Admins must use the admin login page.", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-sidebar">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.15),transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center px-12"
        >
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
            <Radio className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">RAG Monitor</h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Full observability for your RAG pipelines. Track latency, cost, token usage, and AI quality scores in real time.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: "Latency", value: "< 200ms" },
              { label: "Uptime", value: "99.9%" },
              { label: "Evaluations", value: "Real-time" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold font-mono text-primary">{stat.value}</p>
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
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Radio className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">RAG Monitor</h1>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">
            {mode === "forgot" ? "Reset password" : mode === "signup" ? "Create account" : "Welcome back"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "forgot" ? "We'll send you a reset link" : mode === "signup" ? "Sign up to get started" : "Sign in to continue"}
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            {(mode === "login" || mode === "signup") && (
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
            </Button>
          </form>

          {mode !== "forgot" && (
            <p className="text-sm text-center text-muted-foreground mt-6">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary hover:underline font-medium"
              >
                {mode === "login" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          )}

          <p className="text-xs text-center text-muted-foreground mt-4">
            Admin?{" "}
            <button
              onClick={() => navigate("/admin/login")}
              className="text-primary hover:underline font-medium"
            >
              Sign in here
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}