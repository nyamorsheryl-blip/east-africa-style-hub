import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/ml/top-bar";
import { BottomNav } from "@/components/ml/bottom-nav";
import { SearchBar } from "@/components/ml/search-bar";
import { MasonryFeed } from "@/components/ml/masonry";
import { ComingSoonCard } from "@/components/ml/coming-soon";
import { Section, Rail } from "@/components/ml/section";
import { AI_PLACEHOLDERS } from "@/lib/social-data";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover — MaeLove Fashion Inspiration" },
      { name: "description", content: "An endless feed of products, collections, boutiques, videos and luxury editorials from East African fashion." },
      { property: "og:title", content: "Discover — MaeLove Fashion Inspiration" },
      { property: "og:description", content: "Pinterest-style discovery for boutique fashion across East Africa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiscoverPage,
});

const LENSES = ["For you", "Trending", "Boutiques", "Creators", "Editorials", "Seasonal", "Handmade", "Luxury"];

function DiscoverPage() {
  const [lens, setLens] = useState(LENSES[0]);

  return (
    <div className="page-enter min-h-screen pb-32">
      <TopBar title="Discover" />

      <div className="px-5 pt-2">
        <SearchBar placeholder="Search looks, boutiques, creators" />
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {LENSES.map((l) => (
          <button
            key={l}
            onClick={() => setLens(l)}
            aria-pressed={lens === l}
            className={`press min-h-11 shrink-0 rounded-full px-4 text-[13px] font-bold ${lens === l ? "bg-foreground text-background" : "glass"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-4 px-5">
        <div className="glass-cherry flex items-center gap-3 rounded-3xl p-4">
          <span className="text-xl">✨</span>
          <p className="min-w-0 flex-1 text-[12px] font-bold leading-snug">
            Follow creators and boutiques to shape this feed.
          </p>
          <Link to="/social" className="press shrink-0 rounded-full bg-white/18 px-4 py-2 text-[11px] font-extrabold backdrop-blur-md">
            Style feed
          </Link>
        </div>
      </div>

      <div className="mt-5">
        <MasonryFeed />
      </div>

      <Section title="Coming to MaeLove" subtitle="Smart shopping, in the works">
        <Rail>
          {AI_PLACEHOLDERS.slice(0, 4).map((f) => <ComingSoonCard key={f.title} {...f} />)}
        </Rail>
      </Section>

      <BottomNav />
    </div>
  );
}
