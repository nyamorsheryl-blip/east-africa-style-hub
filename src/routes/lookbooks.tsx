import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { TopBar } from "@/components/ml/top-bar";
import { BottomNav } from "@/components/ml/bottom-nav";
import { LOOKBOOKS } from "@/lib/social-data";

export const Route = createFileRoute("/lookbooks")({
  head: () => ({
    meta: [
      { title: "Lookbooks — MaeLove Editorials" },
      { name: "description", content: "Luxury seasonal lookbooks from East African ateliers — shop the look, matching shoes, bags and jewellery." },
      { property: "og:title", content: "Lookbooks — MaeLove Editorials" },
      { property: "og:description", content: "Editorial photography and shoppable outfits from MaeLove boutiques." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LookbooksPage,
});

function LookbooksPage() {
  return (
    <div className="page-enter min-h-screen pb-32">
      <TopBar title="Lookbooks" />
      <header className="rise px-5 pt-4">
        <h1 className="text-[30px] font-black leading-[1.05] tracking-tight">Editorials worth<br />getting dressed for</h1>
        <p className="mt-2 max-w-md text-[13px] text-muted-foreground">
          Seasonal stories shot with East African ateliers. Every frame is shoppable.
        </p>
      </header>

      <div className="mt-8 space-y-6 px-5">
        {LOOKBOOKS.map((l, i) => (
          <Link
            key={l.id}
            to="/lookbook/$id"
            params={{ id: l.id }}
            className="press slide-up relative block overflow-hidden rounded-[2rem]"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <img src={l.cover} alt={l.title} loading="lazy" decoding="async" className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-105 sm:aspect-[16/9]" />
            <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, color-mix(in oklab, black 18%, transparent), transparent 45%, color-mix(in oklab, black 76%, transparent))" }} />
            <span className="absolute inset-x-6 bottom-6 text-white">
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{l.season}</span>
              <span className="mt-1 block text-[28px] font-black leading-none tracking-tight">{l.title}</span>
              <span className="mt-2 block max-w-sm text-[12px] opacity-90">{l.subtitle}</span>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/18 px-4 py-2 text-[11px] font-extrabold backdrop-blur-md">
                View lookbook <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </span>
          </Link>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
