import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { passwordSchema, passwordStrength } from "@/lib/auth-schemas";
import { toast } from "sonner";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Field } from "./auth.signup";

export const Route = createFileRoute("/auth/reset")({
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const strength = passwordStrength(pw);

  useEffect(() => {
    // Supabase handles recovery link automatically → session is set with recovery event
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(pw);
    if (!parsed.success) { setErr(parsed.error.issues[0].message); return; }
    if (pw !== confirm) { setErr("Passwords don't match"); return; }
    setLoading(true); setErr(undefined);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate({ to: "/auth/login" }), 1800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally { setLoading(false); }
  }

  if (done) {
    return (
      <div className="glass rounded-3xl p-8 text-center animate-in fade-in zoom-in-95">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime/40">
          <CheckCircle2 className="h-8 w-8 text-berry animate-in zoom-in duration-500" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-black">Password updated</h1>
        <p className="mt-2 text-sm text-muted-foreground">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6">
      <h1 className="font-display text-2xl font-black">Set a new password</h1>
      <p className="text-sm text-muted-foreground">
        {ready ? "Choose a strong password you'll remember." : "Verifying your reset link…"}
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3.5" noValidate>
        <Field icon={<Lock className="h-4 w-4" />} label="New password" error={err}>
          <input
            type={show ? "text" : "password"} value={pw} onChange={(e) => { setPw(e.target.value); setErr(undefined); }}
            placeholder="At least 8 characters" disabled={!ready}
            className="w-full bg-transparent outline-none text-sm"
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="text-muted-foreground">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </Field>

        {pw && (
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : "bg-muted"}`} />
            ))}
          </div>
        )}

        <Field icon={<Lock className="h-4 w-4" />} label="Confirm password">
          <input
            type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password" disabled={!ready}
            className="w-full bg-transparent outline-none text-sm"
          />
        </Field>

        <button
          type="submit" disabled={loading || !ready}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-berry py-3.5 text-sm font-semibold text-cream disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs">
        <Link to="/auth/login" className="text-muted-foreground hover:text-plum">Back to sign in</Link>
      </p>
    </div>
  );
}
