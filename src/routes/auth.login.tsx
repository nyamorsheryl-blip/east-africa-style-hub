import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signInSchema } from "@/lib/auth-schemas";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, Lock } from "lucide-react";
import { Field } from "./auth.signup";

export const Route = createFileRoute("/auth/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<"email" | "password" | "form", string>>>({});
  const [form, setForm] = useState({ email: "", password: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ ...form, remember });
    if (!parsed.success) {
      const fe: typeof errors = {};
      parsed.error.issues.forEach((i) => { fe[i.path[0] as "email" | "password"] = i.message; });
      setErrors(fe);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) throw error;
      localStorage.setItem("maelove:remember", remember ? "1" : "0");
      toast.success("Welcome back");
      if (next) { window.location.href = next; return; }
      navigate({ to: "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      if (/invalid login|invalid credentials/i.test(msg)) {
        setErrors({ form: "Wrong email or password" });
      } else if (/email not confirmed/i.test(msg)) {
        setErrors({ form: "Please verify your email first" });
      } else {
        setErrors({ form: msg });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-3xl p-6">
      <Link to="/auth" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-plum">
        <ArrowLeft className="h-3 w-3" /> Back
      </Link>
      <h1 className="mt-3 font-display text-2xl font-black">Welcome back</h1>
      <p className="text-sm text-muted-foreground">Sign in to continue shopping and selling.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3.5" noValidate>
        <Field icon={<Mail className="h-4 w-4" />} label="Email" error={errors.email}>
          <input
            type="email" autoComplete="email" value={form.email}
            onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setErrors({}); }}
            placeholder="you@maelove.co"
            className="w-full bg-transparent outline-none text-sm"
          />
        </Field>

        <Field icon={<Lock className="h-4 w-4" />} label="Password" error={errors.password}>
          <input
            type={showPw ? "text" : "password"} autoComplete="current-password" value={form.password}
            onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setErrors({}); }}
            placeholder="Your password"
            className="w-full bg-transparent outline-none text-sm"
          />
          <button type="button" onClick={() => setShowPw((s) => !s)} className="text-muted-foreground hover:text-plum">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </Field>

        {errors.form && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            {errors.form}
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-berry/40 text-berry focus:ring-berry/30"
            />
            <span className="text-plum/80 font-medium">Remember me</span>
          </label>
          <Link to="/auth/forgot" className="font-semibold text-berry">Forgot password?</Link>
        </div>

        <button
          type="submit" disabled={loading}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-full bg-berry py-3.5 text-sm font-semibold text-cream shadow-[var(--shadow-glow)] disabled:opacity-60 active:scale-[0.98] transition"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        New to MaeLove?{" "}
        <Link to="/auth/signup" className="font-semibold text-berry">Create an account</Link>
      </p>
    </div>
  );
}
