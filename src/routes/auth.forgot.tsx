import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { emailSchema } from "@/lib/auth-schemas";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Field } from "./auth.signup";

export const Route = createFileRoute("/auth/forgot")({
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) { setErr(parsed.error.issues[0].message); return; }
    setLoading(true); setErr(undefined);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send reset email");
    } finally { setLoading(false); }
  }

  if (sent) {
    return (
      <div className="glass rounded-3xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime/40">
          <CheckCircle2 className="h-8 w-8 text-berry" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-black">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a reset link to <span className="font-semibold text-plum">{email}</span>. It expires in 1 hour.
        </p>
        <Link to="/auth/login" className="mt-6 inline-flex items-center gap-1 rounded-full bg-berry px-6 py-3 text-sm font-semibold text-cream">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6">
      <Link to="/auth/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-plum">
        <ArrowLeft className="h-3 w-3" /> Back to sign in
      </Link>
      <h1 className="mt-3 font-display text-2xl font-black">Forgot password?</h1>
      <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <Field icon={<Mail className="h-4 w-4" />} label="Email" error={err}>
          <input
            type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(undefined); }}
            placeholder="you@maelove.co"
            className="w-full bg-transparent outline-none text-sm"
          />
        </Field>
        <button
          type="submit" disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-berry py-3.5 text-sm font-semibold text-cream shadow-[var(--shadow-glow)] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}
