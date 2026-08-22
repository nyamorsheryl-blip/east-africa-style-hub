import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signInSchema } from "@/lib/auth-schemas";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { Field } from "./auth.signup";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"email" | "password" | "form", string>>>({});
  const [form, setForm] = useState({ email: "", password: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ ...form, remember: true });
    if (!parsed.success) {
      const fe: typeof errors = {};
      parsed.error.issues.forEach((i) => { fe[i.path[0] as "email" | "password"] = i.message; });
      setErrors(fe);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) throw error;

      const userId = signInData.user?.id;
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleRow) {
        await supabase.auth.signOut();
        setErrors({ form: "This account does not have admin access." });
        return;
      }

      toast.success("Welcome back, admin");
      navigate({ to: "/admin" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      if (/invalid login|invalid credentials/i.test(msg)) {
        setErrors({ form: "Wrong email or password" });
      } else {
        setErrors({ form: msg });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-5 pt-16">
      <Link to="/" aria-label="Back" className="press inline-flex h-11 w-11 items-center justify-center rounded-full glass mb-6">
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="mx-auto max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary">Admin</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight">Sign in to Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Restricted to MaeLove staff accounts.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field icon={<Mail className="h-4 w-4" />} label="Email" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="you@maelove.co"
              autoComplete="email"
            />
          </Field>
          <Field icon={<Lock className="h-4 w-4" />} label="Password" error={errors.password}>
            <input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
            </button>
          </Field>

          {errors.form && (
            <p className="flex items-center gap-1.5 rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-[12px] font-semibold text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.form}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-base btn-primary w-full py-3.5 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}