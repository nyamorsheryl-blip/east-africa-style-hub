import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2, RefreshCw } from "lucide-react";

const search = z.object({ email: z.string().email().optional() });

export const Route = createFileRoute("/auth/verify")({
  component: VerifyPage,
  validateSearch: search,
});

function VerifyPage() {
  const { email } = useSearch({ from: "/auth/verify" });
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/auth/onboarding" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    if (!email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup", email,
        options: { emailRedirectTo: `${window.location.origin}/auth/verify` },
      });
      if (error) throw error;
      toast.success("Verification email sent");
      setCooldown(45);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not resend");
    } finally { setResending(false); }
  }

  return (
    <div className="glass rounded-3xl p-8 text-center animate-in fade-in duration-300">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blush/60">
        <Mail className="h-9 w-9 text-berry" />
      </div>
      <h1 className="mt-4 font-display text-2xl font-black">Verify your email</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a link to <br />
        <span className="font-semibold text-plum">{email ?? "your inbox"}</span>.
        <br />Click it to activate your MaeLove account.
      </p>

      <div className="mt-6 space-y-2.5">
        <button
          onClick={resend} disabled={resending || cooldown > 0 || !email}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full glass px-6 py-3 text-sm font-semibold text-plum disabled:opacity-60"
        >
          {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
        </button>
        <Link
          to="/auth/login"
          className="block w-full rounded-full bg-berry px-6 py-3 text-sm font-semibold text-cream"
        >
          Back to sign in
        </Link>
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">
        Check spam if you don't see it within 2 minutes.
      </p>
    </div>
  );
}
