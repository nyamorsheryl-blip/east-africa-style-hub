import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, Share2, BadgeCheck, Bookmark, Plus, Send, TrendingUp } from "lucide-react";
import { TopBar } from "@/components/ml/top-bar";
import { BottomNav } from "@/components/ml/bottom-nav";
import { Section, Rail } from "@/components/ml/section";
import { CREATORS, COLLECTIONS, COMMENTS, LOOKBOOKS } from "@/lib/social-data";
import { DEMO_STORES, DEMO_PRODUCTS } from "@/lib/demo-data";

export const Route = createFileRoute("/social")({
  head: () => ({
    meta: [
      { title: "Style Feed — MaeLove Social Shopping" },
      { name: "description", content: "Follow boutiques and creators, save outfits, like collections and build style boards on the MaeLove fashion feed." },
      { property: "og:title", content: "Style Feed — MaeLove Social Shopping" },
      { property: "og:description", content: "Fashion inspiration, user outfits and curated collections from East African boutiques." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SocialPage,
});

function SocialPage() {
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    key: string,
  ) => setter((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="page-enter min-h-screen pb-32">
      <TopBar title="Style feed" />

      <Section title="Trending creators" subtitle="The stylists shaping the season" action="See all">
        <Rail>
          {CREATORS.map((c) => (
            <div key={c.handle} className="glass w-[168px] shrink-0 snap-start rounded-3xl p-4 text-center">
              <img src={c.image} alt={c.name} loading="lazy" className="mx-auto h-16 w-16 rounded-full object-cover" />
              <div className="mt-3 truncate text-[13px] font-black">{c.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{c.handle}</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full glass-honey px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                <TrendingUp className="h-2.5 w-2.5" /> {c.badge}
              </div>
              <div className="mt-1.5 text-[11px] text-muted-foreground">{c.followers} followers</div>
              <button
                onClick={() => toggle(setFollowing, c.handle)}
                aria-pressed={!!following[c.handle]}
                className={`press mt-3 min-h-11 w-full rounded-full text-[12px] font-extrabold ${following[c.handle] ? "glass" : "glass-cherry"}`}
              >
                {following[c.handle] ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </Rail>
      </Section>

      <Section title="Featured boutiques" subtitle="Verified ateliers worth a follow">
        <Rail>
          {DEMO_STORES.map((s) => (
            <Link key={s.slug} to="/store/$slug" params={{ slug: s.slug }} className="press glass w-[220px] shrink-0 snap-start overflow-hidden rounded-3xl">
              <img src={s.image} alt={s.name} loading="lazy" className="h-24 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-[13px] font-black">
                  <span className="truncate">{s.name}</span>
                  {s.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </div>
                <div className="text-[11px] text-muted-foreground">{s.city} · {s.followers} followers</div>
              </div>
            </Link>
          ))}
        </Rail>
      </Section>

      <Section title="Style boards" subtitle="Collections saved by the community">
        <div className="grid grid-cols-2 gap-3 px-5">
          {COLLECTIONS.map((c) => (
            <div key={c.id} className="press glass overflow-hidden rounded-3xl">
              <div className="relative aspect-[4/5] bg-muted">
                <img src={c.image} alt={c.title} loading="lazy" className="h-full w-full object-cover" />
                <button
                  onClick={() => toggle(setSaved, c.id)}
                  aria-label={saved[c.id] ? "Remove from boards" : "Save to boards"}
                  className={`press absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full backdrop-blur-md ${saved[c.id] ? "bg-primary text-primary-foreground" : "bg-card/85"}`}
                >
                  <Bookmark className="h-4 w-4" fill={saved[c.id] ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="p-3">
                <div className="line-clamp-2 text-[13px] font-black leading-snug">{c.title}</div>
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.curator} · {c.items} items</div>
                <div className="mt-2 flex items-center gap-3 text-[11px] font-bold">
                  <button onClick={() => toggle(setLikes, c.id)} aria-pressed={!!likes[c.id]} className={`press inline-flex min-h-9 items-center gap-1 ${likes[c.id] ? "text-primary" : "text-muted-foreground"}`}>
                    <Heart className="h-3.5 w-3.5" fill={likes[c.id] ? "currentColor" : "none"} /> {c.likes}
                  </button>
                  <button onClick={() => setOpenComments(openComments === c.id ? null : c.id)} className="press inline-flex min-h-9 items-center gap-1 text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5" /> {COMMENTS.length}
                  </button>
                  <button aria-label="Share collection" className="press inline-flex min-h-9 items-center text-muted-foreground">
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div
                  className="grid transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ gridTemplateRows: openComments === c.id ? "1fr" : "0fr", opacity: openComments === c.id ? 1 : 0 }}
                >
                  <div className="overflow-hidden">
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      {COMMENTS.map((m) => (
                        <div key={m.name} className="flex gap-2">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full glass-blush text-[9px] font-black">{m.initials}</span>
                          <p className="min-w-0 text-[11px] leading-snug text-muted-foreground">
                            <span className="font-black text-foreground">{m.name}</span> {m.body}
                          </p>
                        </div>
                      ))}
                      <div className="glass mt-2 flex items-center gap-2 rounded-full px-3 py-1.5">
                        <input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          placeholder="Add a comment"
                          aria-label="Add a comment"
                          className="w-full bg-transparent text-[11px] outline-none placeholder:text-muted-foreground"
                        />
                        <Send className="h-3.5 w-3.5 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="User outfits" subtitle="Real looks, shot by the community" action="Post a look">
        <Rail>
          {DEMO_PRODUCTS.slice(0, 6).map((p, i) => (
            <div key={p.id} className="relative w-[150px] shrink-0 snap-start overflow-hidden rounded-3xl">
              <img src={p.image} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover" />
              <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 55%, color-mix(in oklab, black 70%, transparent))" }} />
              <span className="absolute inset-x-3 bottom-3 text-[11px] font-black text-white">
                {CREATORS[i % CREATORS.length].handle}
              </span>
              <button
                onClick={() => toggle(setLikes, `o-${p.id}`)}
                aria-label="Like outfit"
                className={`press absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full backdrop-blur-md ${likes[`o-${p.id}`] ? "bg-primary text-primary-foreground" : "bg-card/85"}`}
              >
                <Heart className="h-4 w-4" fill={likes[`o-${p.id}`] ? "currentColor" : "none"} />
              </button>
            </div>
          ))}
        </Rail>
      </Section>

      <Section title="Fashion inspiration" subtitle="Luxury editorials from MaeLove ateliers" action="Lookbooks" actionTo="/lookbooks">
        <Rail>
          {LOOKBOOKS.map((l) => (
            <Link key={l.id} to="/lookbook/$id" params={{ id: l.id }} className="press relative w-[260px] shrink-0 snap-start overflow-hidden rounded-3xl">
              <img src={l.cover} alt={l.title} loading="lazy" className="aspect-[4/5] w-full object-cover" />
              <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, color-mix(in oklab, black 72%, transparent))" }} />
              <span className="absolute inset-x-4 bottom-4 text-white">
                <span className="block text-[10px] font-black uppercase tracking-[0.18em] opacity-80">{l.season}</span>
                <span className="mt-0.5 block text-[20px] font-black leading-tight">{l.title}</span>
              </span>
            </Link>
          ))}
        </Rail>
      </Section>

      <div className="mt-12 px-5">
        <button className="btn-base btn-primary w-full py-4">
          <Plus className="h-4 w-4" /> Create a style board
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
