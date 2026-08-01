import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp, Package, Boxes, MessageCircle, Users, Wallet, Star,
  Megaphone, Activity, Sparkles, ArrowUpRight, Plus,
} from "lucide-react";
import { BottomNav } from "@/components/ml/bottom-nav";
import { Section, Rail } from "@/components/ml/section";
import { DEMO_PRODUCTS } from "@/lib/demo-data";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Seller Dashboard — MaeLove" },
      { name: "description", content: "Run your MaeLove boutique: analytics, orders, inventory, payouts, promotions, reviews and AI insights in one premium dashboard." },
      { property: "og:title", content: "Seller Dashboard — MaeLove" },
      { property: "og:description", content: "Analytics, orders, inventory and payouts for MaeLove boutiques." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sell,
});

const STATS = [
  { label: "Revenue (30d)", value: "$12,480", delta: "+18.2%" },
  { label: "Orders", value: "184", delta: "+9.4%" },
  { label: "Conversion", value: "4.8%", delta: "+0.6pt" },
  { label: "Avg. rating", value: "4.9", delta: "+0.1" },
];

const TOOLS = [
  { label: "Orders", icon: Package, to: "/seller" },
  { label: "Products", icon: Boxes, to: "/seller" },
  { label: "Inventory", icon: Boxes, to: "/seller" },
  { label: "Messages", icon: MessageCircle, to: "/messages" },
  { label: "Customers", icon: Users, to: "/seller" },
  { label: "Payouts", icon: Wallet, to: "/seller" },
  { label: "Reviews", icon: Star, to: "/seller" },
  { label: "Promotions", icon: Megaphone, to: "/seller" },
  { label: "Performance", icon: Activity, to: "/seller" },
] as const;

const BARS = [38, 52, 44, 66, 58, 82, 74];

function Sell() {
  return (
    <div className="min-h-screen pb-32">
      <header className="px-5 pb-2 pt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">MaeLove Seller</div>
            <h1 className="mt-1 text-[34px] font-black leading-none tracking-tight">Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">MaeLove Studio · Level 3 boutique</p>
          </div>
          <Link to="/seller" aria-label="Add product" className="press glass-cherry flex h-12 w-12 items-center justify-center rounded-full">
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <section className="rise mt-6 grid grid-cols-2 gap-3 px-5">
        {STATS.map((s) => (
          <div key={s.label} className="glass rounded-3xl p-4">
            <div className="text-[11px] font-bold text-muted-foreground">{s.label}</div>
            <div className="mt-1.5 text-2xl font-black tracking-tight">{s.value}</div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-extrabold text-primary">
              <ArrowUpRight className="h-3 w-3" /> {s.delta}
            </div>
          </div>
        ))}
      </section>

      <Section title="Analytics" subtitle="Last 7 days of sales">
        <div className="px-5">
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center gap-2 text-sm font-black">
              <TrendingUp className="h-4 w-4 text-primary" /> $3,240 this week
            </div>
            <div className="mt-6 flex h-32 items-end gap-2">
              {BARS.map((h, i) => (
                <div key={i} className="flex-1 rounded-t-xl" style={{ height: `${h}%`, background: i === BARS.length - 1 ? "var(--gradient-hero)" : "color-mix(in oklab, var(--blush) 70%, transparent)" }} />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-bold text-muted-foreground">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Manage">
        <div className="grid grid-cols-3 gap-3 px-5">
          {TOOLS.map(({ label, icon: Icon, to }) => (
            <Link key={label} to={to} className="press glass flex flex-col items-center gap-2 rounded-3xl px-2 py-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full glass-blush">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-bold">{label}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="AI insights" subtitle="Suggestions from your store data">
        <div className="space-y-3 px-5">
          {[
            "Restock “Noir Satin Blazer Dress” — 82% sell-through in 9 days.",
            "Your 3–7 day delivery option converts 24% better. Make it default.",
            "Add 2 more photos to 6 listings to lift saves by an estimated 15%.",
          ].map((t) => (
            <div key={t} className="glass flex gap-3 rounded-3xl p-4">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-[13px] leading-snug">{t}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Top products" action="Manage" actionTo="/seller">
        <Rail>
          {DEMO_PRODUCTS.slice(0, 5).map((p) => (
            <div key={p.id} className="glass w-[164px] shrink-0 snap-start overflow-hidden rounded-3xl">
              <img src={p.image} alt={p.title} loading="lazy" className="aspect-[4/5] w-full object-cover" />
              <div className="p-3">
                <div className="line-clamp-2 text-[12px] font-bold leading-snug">{p.title}</div>
                <div className="mt-1.5 text-sm font-black">{formatMoney(p.sale_price_cents ?? p.price_cents)}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{p.reviews} sold</div>
              </div>
            </div>
          ))}
        </Rail>
      </Section>

      <div className="mt-12 px-5">
        <Link to="/seller" className="press glass-cherry flex items-center justify-between rounded-3xl px-6 py-5 text-sm font-extrabold">
          Open full seller tools <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
