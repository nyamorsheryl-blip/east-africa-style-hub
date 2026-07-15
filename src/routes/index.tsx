import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CATEGORIES } from "@/lib/format";
import { Sparkles, ShoppingBag, Store, Zap, Globe2, Heart, TrendingUp, Wand2 } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="px-4 pt-12 md:px-8 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> East Africa's boutique marketplace
              </span>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] md:text-7xl">
                Fashion woven <br/>with <span className="gradient-text">Mae</span> and <span className="gradient-text">Love</span>.
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                A modern boutique marketplace for clothing, shoes, jewellery and accessories — for women and men — from independent designers across East Africa, shipped worldwide.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90">
                  <ShoppingBag className="h-4 w-4" /> Shop the marketplace
                </Link>
                <Link to="/seller" className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold hover:bg-white/70">
                  <Store className="h-4 w-4" /> Open a boutique
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
                <div><span className="font-display text-2xl text-foreground">100k+</span><div>Products</div></div>
                <div><span className="font-display text-2xl text-foreground">2,400</span><div>Boutiques</div></div>
                <div><span className="font-display text-2xl text-foreground">40+</span><div>Countries shipped</div></div>
              </div>
            </div>

            {/* Liquid glass hero collage */}
            <div className="relative h-[480px] md:h-[560px]">
              <div className="absolute inset-0 rounded-[3rem] overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 40%)" }} />
              </div>
              {[
                { t: "Kitenge Wrap Dress", p: "$68", top: "8%", left: "6%", rot: -6 },
                { t: "Beaded Maasai Cuff", p: "$42", top: "22%", right: "8%", rot: 8 },
                { t: "Leather Sandals", p: "$54", bottom: "22%", left: "10%", rot: 4 },
                { t: "Ankara Blazer", p: "$120", bottom: "8%", right: "6%", rot: -5 },
              ].map((c, i) => (
                <div key={i} className="glass absolute rounded-2xl p-4 w-40 md:w-48" style={{ ...c, transform: `rotate(${c.rot}deg)` } as React.CSSProperties}>
                  <div className="aspect-square rounded-xl mb-3" style={{ background: `linear-gradient(135deg, var(--jewel-${["saffron","crimson","teal","ink"][i]}) 0%, color-mix(in oklab, var(--jewel-cream) 60%, transparent) 100%)` }} />
                  <div className="text-xs font-semibold">{c.t}</div>
                  <div className="text-xs text-muted-foreground">{c.p}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 mt-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Shop by category</h2>
            <Link to="/shop" className="text-sm text-primary font-medium">View all →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {CATEGORIES.slice(0, 10).map((c, i) => (
              <Link key={c} to="/shop" search={{ category: c } as never} className="glass group rounded-2xl p-5 hover:scale-[1.02] transition-transform">
                <div className="aspect-square rounded-xl mb-3" style={{ background: `linear-gradient(135deg, var(--jewel-${["crimson","saffron","teal","ink","crimson","saffron","teal","ink","crimson","saffron"][i]}), color-mix(in oklab, white 40%, transparent))` }} />
                <div className="text-sm font-semibold">{c}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 mt-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-center">Built for the modern African boutique</h2>
          <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">Everything you need to launch, grow and scale — from AI-powered listings to global logistics.</p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { i: Wand2, t: "AI-powered listings", d: "Auto-generate descriptions, remove backgrounds, translate to 12 languages and predict trending products." },
              { i: TrendingUp, t: "Creator & reseller program", d: "Boost sales with influencers earning commissions on every referral link they share." },
              { i: Globe2, t: "Global shipping, local payments", d: "M-Pesa, Airtel Money, cards and PayPal — reach customers in 40+ countries." },
              { i: Store, t: "Beautiful storefronts", d: "Design a professional boutique in minutes with videos, collections and brand pages." },
              { i: Zap, t: "Real-time analytics", d: "Track sales, conversions and inventory across every channel from one dashboard." },
              { i: Heart, t: "Ethical & sustainable", d: "Support small businesses building the future of African fashion, one order at a time." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="glass rounded-3xl p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-white mb-4" style={{ background: "var(--gradient-warm)" }}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 mt-24 md:px-8">
        <div className="mx-auto max-w-6xl relative rounded-[3rem] p-10 md:p-16 overflow-hidden text-white text-center" style={{ background: "var(--gradient-hero)" }}>
          <h2 className="font-display text-4xl md:text-5xl font-semibold">Ready to open your boutique?</h2>
          <p className="mt-4 opacity-90 max-w-xl mx-auto">Join thousands of designers turning craft into a thriving global business on MaeLove.</p>
          <Link to="/auth" search={{ mode: "sell" } as never} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-primary hover:scale-105 transition-transform">
            Start selling — free <Sparkles className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
