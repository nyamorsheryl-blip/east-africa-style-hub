import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Store, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/")({
  component: AuthWelcome,
});

const SLIDES = [
  {
    tag: "Discover",
    title: "Boutique fashion,\ncurated for you",
    body: "Shop kitenge, kikoi, jewellery & one-of-a-kind pieces from East African designers.",
    grad: "linear-gradient(135deg, var(--berry), var(--blush))",
  },
  {
    tag: "Create",
    title: "Open your\nboutique in minutes",
    body: "List products, manage orders, get paid via M-Pesa, Airtel & Stripe.",
    grad: "linear-gradient(135deg, var(--plum), var(--berry))",
  },
  {
    tag: "Belong",
    title: "Join a community\nof makers & buyers",
    body: "Reviews, referrals and verified boutiques — the way commerce should feel.",
    grad: "linear-gradient(135deg, var(--blush), var(--lime))",
  },
];

function AuthWelcome() {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4200);
    return () => clearInterval(t);
  }, []);

  const s = SLIDES[slide];

  return (
    <div className="space-y-6">
      <div
        className="glass rounded-[32px] p-6 min-h-[380px] flex flex-col justify-end relative overflow-hidden transition-all"
        style={{ backgroundImage: s.grad }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-plum/70 via-plum/10 to-transparent" />
        <div className="relative text-cream">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest">
            <Sparkles className="h-3 w-3" /> {s.tag}
          </span>
          <h1 className="mt-3 font-display text-3xl leading-tight font-black whitespace-pre-line">
            {s.title}
          </h1>
          <p className="mt-2 text-sm text-cream/90 max-w-xs">{s.body}</p>

          <div className="mt-5 flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === slide ? "w-8 bg-cream" : "w-1.5 bg-cream/50"}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <Link
          to="/auth/signup"
          className="flex items-center justify-between rounded-full bg-berry px-6 py-4 text-sm font-semibold text-cream shadow-[var(--shadow-glow)] active:scale-[0.98] transition"
        >
          <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Create your account</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/auth/signup"
          search={{ intent: "sell" } as never}
          className="flex items-center justify-between rounded-full glass px-6 py-4 text-sm font-semibold text-plum active:scale-[0.98] transition"
        >
          <span className="flex items-center gap-2"><Store className="h-4 w-4" /> Open a boutique</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/auth/login" className="font-semibold text-berry underline underline-offset-4">
          Sign in
        </Link>
      </p>

      <p className="text-center text-[11px] text-muted-foreground px-6">
        By continuing you agree to MaeLove's Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
