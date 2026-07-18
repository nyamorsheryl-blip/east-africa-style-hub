import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Store, Sparkles, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/onboarding")({
  component: OnboardingPage,
});

type Choice = "shopper" | "seller" | "both";

const OPTIONS: { id: Choice; emoji: string; icon: React.ComponentType<{ className?: string }>; title: string; body: string; grad: string }[] = [
  { id: "shopper",  emoji: "🛍️", icon: ShoppingBag, title: "Shop",             body: "Discover boutique fashion, jewellery and one-of-a-kind pieces.", grad: "linear-gradient(135deg, var(--blush), var(--berry))" },
  { id: "seller", emoji: "🏪", icon: Store,       title: "Open a boutique",  body: "List products, manage orders, get paid.",                          grad: "linear-gradient(135deg, var(--plum), var(--berry))" },
  { id: "both",   emoji: "✨", icon: Sparkles,    title: "Both",             body: "Shop what you love and sell what you make.",                       grad: "linear-gradient(135deg, var(--berry), var(--lime))" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate({ to: "/auth/login" }); return; }
      setUserId(data.user.id);
    });
    const intent = sessionStorage.getItem("maelove:intent");
    if (intent === "sell") setChoice("seller");
    else if (intent === "shop") setChoice("shopper");
  }, [navigate]);

  async function save() {
    if (!choice || !userId) return;
    setSaving(true);
    try {
      const { error: roleErr } = await supabase
        .from("profiles")
        .update({ role: choice })
        .eq("id", userId);
      if (roleErr) throw roleErr;

      // Create boutique shell if seller or both
      if (choice === "seller" || choice === "both") {
        const { data: existing } = await supabase.from("boutiques").select("id").eq("owner_id", userId).maybeSingle();
        if (!existing) {
          const { data: prof } = await supabase.from("profiles").select("full_name, username").eq("id", userId).maybeSingle();
          const { error: bErr } = await supabase.from("boutiques").insert({
            owner_id: userId,
            name: prof?.full_name ? `${prof.full_name}'s boutique` : `@${prof?.username ?? "boutique"}`,
            slug: `${prof?.username ?? userId.slice(0, 8)}-${Date.now().toString(36)}`,
          });
          if (bErr) throw bErr;
        }
      }

      sessionStorage.removeItem("maelove:intent");
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: choice === "shopper" ? "/" : "/seller" });
      }, 1200);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your choice");
    } finally { setSaving(false); }
  }

  if (success) {
    return (
      <div className="glass rounded-3xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-lime/50 animate-in zoom-in duration-500">
          <Check className="h-10 w-10 text-berry animate-in zoom-in duration-700" strokeWidth={3} />
        </div>
        <h1 className="mt-4 font-display text-2xl font-black">You're all set</h1>
        <p className="mt-2 text-sm text-muted-foreground">Welcome to MaeLove ✨</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="font-display text-3xl font-black">What would you like to do on MaeLove?</h1>
        <p className="mt-2 text-sm text-muted-foreground">You can change this later in your profile.</p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((o) => {
          const active = choice === o.id;
          return (
            <button
              key={o.id} onClick={() => setChoice(o.id)}
              className={`w-full text-left rounded-3xl p-5 transition-all active:scale-[0.98] ${
                active ? "text-cream shadow-[var(--shadow-glow)] ring-2 ring-berry/40" : "glass text-plum hover:scale-[1.01]"
              }`}
              style={active ? { backgroundImage: o.grad } : undefined}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${active ? "bg-white/20" : "bg-blush/60"}`}>
                  {o.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-display text-lg font-black">{o.title}</div>
                  <p className={`text-xs ${active ? "text-cream/90" : "text-muted-foreground"}`}>{o.body}</p>
                </div>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  active ? "border-cream bg-cream" : "border-plum/30"
                }`}>
                  {active && <Check className="h-4 w-4 text-berry" strokeWidth={3} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={save} disabled={!choice || saving}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-berry py-4 text-sm font-semibold text-cream shadow-[var(--shadow-glow)] disabled:opacity-50 active:scale-[0.98] transition"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? "Setting up…" : "Continue"}
      </button>
    </div>
  );
}
