import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Sparkles } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ mode: z.enum(["buy", "sell"]).optional() });

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: searchSchema,
});

function AuthPage() {
  const { mode } = useSearch({ from: "/auth" });
  const [tab, setTab] = useState<"signin" | "signup">(mode === "sell" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Welcome to MaeLove!");
        navigate({ to: mode === "sell" ? "/seller" : "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 pt-12">
        <div className="glass rounded-3xl p-8">
          <div className="text-center mb-6">
            <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"><Sparkles className="h-3 w-3 text-primary" /> MaeLove</span>
            <h1 className="mt-3 font-display text-3xl font-semibold">{tab === "signin" ? "Welcome back" : "Join MaeLove"}</h1>
            <p className="text-sm text-muted-foreground mt-1">{mode === "sell" ? "Create an account to open your boutique" : "Buy and sell across East Africa"}</p>
          </div>

          <div className="grid grid-cols-2 gap-1 mb-6 rounded-full bg-muted p-1 text-sm">
            {(["signin","signup"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-full py-1.5 font-medium transition ${tab===t ? "bg-white shadow" : "text-muted-foreground"}`}>
                {t === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {tab === "signup" && (
              <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" required />
            )}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8}
              className="w-full rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" required />
            <button type="submit" disabled={loading}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60">
              {loading ? "Please wait…" : tab === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing you agree to MaeLove's <Link to="/" className="underline">Terms</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
