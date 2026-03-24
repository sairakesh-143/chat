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
    <div className="relative min-h-screen overflow-hidden bg-[#030712]">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(16,185,129,0.12),transparent_38%),radial-gradient(circle_at_85%_70%,rgba(34,211,238,0.12),transparent_36%)]" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-8 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="order-2 rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_120px_-35px_rgba(16,185,129,0.6)] backdrop-blur-xl sm:p-8 lg:order-1 lg:p-10"
        >
          <div className="mb-7 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/80">Insight Scribe</p>
              <h1 className="text-lg font-semibold text-white">RAG Monitor</h1>
            </div>
          </div>

          <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
            {mode === "forgot" ? "Reset your password" : mode === "signup" ? "Create your workspace access" : "Welcome back"}
          </h2>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">
            {mode === "forgot" ? "We will email a secure reset link." : mode === "signup" ? "Get started with real-time AI quality visibility." : "Sign in to continue monitoring model quality."}
          </p>

          {mode === "forgot" && (
            <button
              onClick={() => setMode("login")}
              className="mt-5 flex items-center gap-1.5 text-sm text-slate-300 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </button>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-12 border-white/10 bg-slate-900/70 text-white placeholder:text-slate-500 focus-visible:ring-emerald-400"
              />
            </div>

            {(mode === "login" || mode === "signup") && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="h-12 border-white/10 bg-slate-900/70 pr-11 text-white placeholder:text-slate-500 focus-visible:ring-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
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
                  className="text-sm text-slate-400 transition-colors hover:text-emerald-300"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="h-12 w-full bg-emerald-500 text-slate-950 transition-all hover:bg-emerald-400"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
            </Button>
          </form>

          {mode !== "forgot" && (
            <p className="mt-6 text-center text-sm text-slate-300">
              {mode === "login" ? "Need an account? " : "Already have an account? "}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
              >
                {mode === "login" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="order-1 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-900/75 to-emerald-950/55 p-6 backdrop-blur-xl sm:p-8 lg:order-2 lg:h-full lg:p-10"
        >
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Live AI Operations</p>
          <h3 className="mt-3 max-w-md text-3xl font-bold leading-tight text-white sm:text-4xl">
            Observe quality, speed, and spend from one command center.
          </h3>
          <p className="mt-4 max-w-lg text-slate-300">
            Built for teams running production RAG systems. Detect drift early, compare model performance, and ship better responses with confidence.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Latency", value: "182ms", note: "P95 response" },
              { label: "Quality", value: "+14.7%", note: "Since last week" },
              { label: "Monthly Cost", value: "$4,240", note: "Within budget" },
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + index * 0.1, duration: 0.45 }}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{metric.label}</p>
                <p className="mt-2 font-mono text-2xl font-semibold text-emerald-300">{metric.value}</p>
                <p className="mt-1 text-xs text-slate-400">{metric.note}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}