import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { signUpSchema, passwordStrength } from "@/lib/auth-schemas";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, User, AtSign, Lock, CheckCircle2, AlertCircle } from "lucide-react";

const search = z.object({ intent: z.enum(["shop", "sell"]).optional() });

export const Route = createFileRoute("/auth/signup")({
  component: SignUpPage,
  validateSearch: search,
});

type Errors = Partial<Record<"full_name" | "username" | "email" | "password", string>>;

function SignUpPage() {
  const { intent } = useSearch({ from: "/auth/signup" });
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState({ full_name: "", username: "", email: "", password: "" });

  const strength = passwordStrength(form.password);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(form);
    if (!parsed.success) {
      const fe: Errors = {};
      parsed.error.issues.forEach((i) => { fe[i.path[0] as keyof Errors] = i.message; });
      setErrors(fe);
      return;
    }
    setLoading(true);
    try {
      // Pre-check username availability
      const { data: taken } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", parsed.data.username.toLowerCase())
        .maybeSingle();
      if (taken) {
        setErrors({ username: "That username is taken" });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            full_name: parsed.data.full_name,
            username: parsed.data.username.toLowerCase(),
          },
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        },
      });
      if (error) throw error;

      // Store intent so onboarding preselects
      if (intent) sessionStorage.setItem("maelove:intent", intent);

      if (data.session) {
        // Auto-confirmed (no email verification) → go straight to onboarding
        toast.success("Welcome to MaeLove!");
        navigate({ to: "/auth/onboarding" });
      } else {
        navigate({ to: "/auth/verify", search: { email: parsed.data.email } as never });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign up failed";
      if (/already registered|already exists/i.test(msg)) {
        setErrors({ email: "This email is already registered" });
      } else {
        toast.error(msg);
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
      <h1 className="mt-3 font-display text-2xl font-black">Create your account</h1>
      <p className="text-sm text-muted-foreground">
        {intent === "sell" ? "Set up your boutique in a few taps." : "Shop, sell and connect across East Africa."}
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3.5" noValidate>
        <Field icon={<User className="h-4 w-4" />} label="Full name" error={errors.full_name}>
          <input
            type="text" autoComplete="name" value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            placeholder="Amara Okoye"
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
          />
        </Field>

        <Field icon={<AtSign className="h-4 w-4" />} label="Username" error={errors.username}>
          <input
            type="text" autoComplete="username" value={form.username}
            onChange={(e) => update("username", e.target.value.replace(/\s/g, ""))}
            placeholder="amara"
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/70 lowercase"
          />
        </Field>

        <Field icon={<Mail className="h-4 w-4" />} label="Email" error={errors.email}>
          <input
            type="email" autoComplete="email" value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@maelove.co"
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
          />
        </Field>

        <Field icon={<Lock className="h-4 w-4" />} label="Password" error={errors.password}>
          <input
            type={showPw ? "text" : "password"} autoComplete="new-password" value={form.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="At least 8 characters"
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
          />
          <button type="button" onClick={() => setShowPw((s) => !s)} className="text-muted-foreground hover:text-plum">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </Field>

        {form.password && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : "bg-muted"}`}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Password strength: <span className="font-semibold text-plum">{strength.label}</span></p>
          </div>
        )}

        <button
          type="submit" disabled={loading}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-full bg-berry py-3.5 text-sm font-semibold text-cream shadow-[var(--shadow-glow)] disabled:opacity-60 active:scale-[0.98] transition"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Already a member?{" "}
        <Link to="/auth/login" className="font-semibold text-berry">Sign in</Link>
      </p>
    </div>
  );
}

export function Field({
  icon, label, error, children,
}: { icon: React.ReactNode; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-plum/70">{label}</label>
      <div className={`flex items-center gap-2.5 rounded-2xl border bg-white/70 px-3.5 py-3 transition ${
        error ? "border-destructive" : "border-white/80 focus-within:border-berry focus-within:ring-2 focus-within:ring-berry/20"
      }`}>
        <span className="text-berry">{icon}</span>
        {children}
      </div>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-destructive">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}

export { CheckCircle2 };
