import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;

    function finish(user: { created_at: string }) {
      if (done) return;
      done = true;
      // Brand-new accounts choose what they want to do; returning users go straight in
      const isNew = Date.now() - new Date(user.created_at).getTime() < 2 * 60 * 1000;
      const next = sessionStorage.getItem("maelove:next");
      sessionStorage.removeItem("maelove:next");
      if (isNew) navigate({ to: "/auth/onboarding" });
      else if (next) window.location.href = next;
      else navigate({ to: "/" });
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(data.session.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) finish(session.user);
    });
    const t = setTimeout(() => {
      if (!done) {
        done = true;
        navigate({ to: "/auth/login" });
      }
    }, 8000);

    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="glass rounded-3xl p-8 text-center">
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-berry" />
      <p className="mt-4 text-sm text-muted-foreground">Signing you in...</p>
    </div>
  );
}