import { IMAGES, DEMO_PRODUCTS, DEMO_STORES } from "@/lib/demo-data";

/* ── Product experience ─────────────────────────────────────── */

export const SWATCHES = [
  { name: "Cherry", hex: "#A8002A" },
  { name: "Vanilla", hex: "#FFF0B5" },
  { name: "Peach", hex: "#FFA096" },
  { name: "Honey", hex: "#FFD34D" },
  { name: "Noir", hex: "#1B1013" },
];

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const SIZE_GUIDE = [
  { size: "XS", bust: "78–82", waist: "60–64", hip: "86–90" },
  { size: "S", bust: "83–87", waist: "65–69", hip: "91–95" },
  { size: "M", bust: "88–92", waist: "70–74", hip: "96–100" },
  { size: "L", bust: "93–98", waist: "75–80", hip: "101–106" },
  { size: "XL", bust: "99–104", waist: "81–86", hip: "107–112" },
  { size: "XXL", bust: "105–110", waist: "87–92", hip: "113–118" },
];

export const SPECS: [string, string][] = [
  ["Materials", "72% silk satin, 28% viscose lining"],
  ["Care", "Dry clean only · cool iron on reverse"],
  ["Fit", "True to size, relaxed shoulder"],
  ["Made in", "Nairobi, Kenya"],
  ["Weight", "480 g"],
  ["Condition", "New with tags"],
];

export const PRODUCT_FAQ: [string, string][] = [
  ["Is this true to size?", "Yes — the atelier recommends your usual size, or size down for a sharper silhouette."],
  ["Can I request alterations?", "Every boutique offers tailoring at checkout. Add your measurements in the notes field."],
  ["How is it packaged?", "Wrapped in recycled tissue inside a rigid MaeLove gift box, ready to give."],
  ["Do you ship internationally?", "We deliver to 42 countries. Duties are calculated at checkout — no surprises."],
];

export type Review = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  date: string;
  body: string;
  photos: string[];
  video?: boolean;
  verified: boolean;
  helpful: number;
  fit?: string;
};

export const REVIEWS: Review[] = [
  { id: "r1", name: "Amina K.", initials: "AK", rating: 5, date: "2 weeks ago", body: "Impeccable finish — the satin has real weight to it. Arrived in four days, beautifully boxed.", photos: [IMAGES.blazer, IMAGES.women], verified: true, helpful: 42, fit: "True to size" },
  { id: "r2", name: "Joy M.", initials: "JM", rating: 5, date: "3 weeks ago", body: "Fits exactly as the size guide promised. I've worn it to two weddings already.", photos: [IMAGES.women], video: true, verified: true, helpful: 28, fit: "True to size" },
  { id: "r3", name: "Peter O.", initials: "PO", rating: 4, date: "1 month ago", body: "Gorgeous piece. Slightly long on me at 5'4\" but the tailoring add-on sorted it.", photos: [], verified: true, helpful: 11, fit: "Runs long" },
  { id: "r4", name: "Nadia S.", initials: "NS", rating: 5, date: "1 month ago", body: "The colour is richer in person. Seller answered my questions within the hour.", photos: [IMAGES.street, IMAGES.mandala, IMAGES.jewellery], verified: false, helpful: 7 },
  { id: "r5", name: "Wanjiru T.", initials: "WT", rating: 4, date: "2 months ago", body: "Lovely quality for the price. Would like more colour options.", photos: [], verified: true, helpful: 3, fit: "Runs small" },
];

export const RATING_BREAKDOWN = [
  { stars: 5, count: 168 },
  { stars: 4, count: 32 },
  { stars: 3, count: 9 },
  { stars: 2, count: 3 },
  { stars: 1, count: 2 },
];

/* ── AI placeholders ────────────────────────────────────────── */

export const AI_PLACEHOLDERS = [
  { title: "AI Stylist", copy: "Describe an occasion, get a full look", emoji: "✨" },
  { title: "Virtual Stylist", copy: "A personal edit, refreshed weekly", emoji: "🧑‍🎨" },
  { title: "Complete the Outfit", copy: "Shoes, bag and jewellery in one tap", emoji: "🧵" },
  { title: "Perfect Size Prediction", copy: "No more guessing between S and M", emoji: "🎯" },
  { title: "Colour Recommendations", copy: "Shades tuned to your palette", emoji: "🎨" },
  { title: "Occasion Recommendations", copy: "Weddings, work, weekends", emoji: "🥂" },
];

/* ── Social commerce ────────────────────────────────────────── */

export const CREATORS = [
  { handle: "@amaristyles", name: "Amari Njoki", followers: "48.2k", image: IMAGES.women, badge: "Top creator" },
  { handle: "@thekampalaedit", name: "Brian Ssemwanga", followers: "31.7k", image: IMAGES.men, badge: "Rising" },
  { handle: "@goldbyzuri", name: "Zuri Achieng", followers: "22.9k", image: IMAGES.jewellery, badge: "Jewellery" },
  { handle: "@soleofkigali", name: "Ines Umuhoza", followers: "18.4k", image: IMAGES.shoes, badge: "Footwear" },
];

export const COLLECTIONS = [
  { id: "c1", title: "Golden Hour Dressing", curator: "@amaristyles", items: 18, likes: "4.2k", image: IMAGES.hero },
  { id: "c2", title: "The Quiet Luxury Edit", curator: "MaeLove Studio", items: 24, likes: "6.8k", image: IMAGES.blazer },
  { id: "c3", title: "Handmade in Kigali", curator: "Lumière Fine", items: 12, likes: "2.1k", image: IMAGES.mandala },
  { id: "c4", title: "Street Season 03", curator: "Grid Supply", items: 31, likes: "5.5k", image: IMAGES.street },
  { id: "c5", title: "Wedding Guest, Solved", curator: "@thekampalaedit", items: 16, likes: "3.4k", image: IMAGES.women },
  { id: "c6", title: "Shoes That Travel", curator: "Atelier Nairobi", items: 9, likes: "1.9k", image: IMAGES.shoes },
];

export const COMMENTS = [
  { name: "Amina K.", initials: "AK", body: "The second look is unreal — where are the earrings from?", time: "2h" },
  { name: "Joy M.", initials: "JM", body: "Just saved the whole board. Perfect for December.", time: "5h" },
  { name: "Zuri A.", initials: "ZA", body: "Styling the blazer with trainers next 👀", time: "1d" },
];

/* ── Lookbooks ──────────────────────────────────────────────── */

export type Lookbook = {
  id: string;
  title: string;
  season: string;
  subtitle: string;
  cover: string;
  spreads: string[];
  story: string;
  productIds: string[];
};

export const LOOKBOOKS: Lookbook[] = [
  {
    id: "golden-hour",
    title: "Golden Hour",
    season: "Resort 26",
    subtitle: "Satin, sun and slow evenings along the coast",
    cover: IMAGES.hero,
    spreads: [IMAGES.hero, IMAGES.blazer, IMAGES.women, IMAGES.jewellery],
    story: "Shot at dusk in Lamu, Golden Hour is a study in warmth — liquid satins, hand-set gold and silhouettes that move with the breeze. Every piece is made in small runs by East African ateliers.",
    productIds: ["demo-1", "demo-2", "demo-7", "demo-5"],
  },
  {
    id: "city-lines",
    title: "City Lines",
    season: "Autumn 26",
    subtitle: "Sharp tailoring for long Nairobi days",
    cover: IMAGES.men,
    spreads: [IMAGES.men, IMAGES.street, IMAGES.shoes, IMAGES.blazer],
    story: "A wardrobe built on three shapes: the tailored shirt, the relaxed set and the sculpted heel. Neutral until it isn't.",
    productIds: ["demo-6", "demo-3", "demo-5", "demo-8"],
  },
  {
    id: "handmade",
    title: "Handmade",
    season: "Archive",
    subtitle: "One-of-one pieces from craft collectives",
    cover: IMAGES.mandala,
    spreads: [IMAGES.mandala, IMAGES.jewellery, IMAGES.women, IMAGES.street],
    story: "Beadwork, hand-hammered silver and natural dye — an archive edit of pieces that will never be produced twice.",
    productIds: ["demo-4", "demo-8", "demo-2", "demo-7"],
  },
];

/* ── Discover feed ──────────────────────────────────────────── */

export type FeedItem =
  | { kind: "product"; id: string; ratio: number }
  | { kind: "collection"; id: string; ratio: number }
  | { kind: "video"; id: string; title: string; creator: string; image: string; ratio: number }
  | { kind: "boutique"; slug: string; ratio: number }
  | { kind: "editorial"; id: string; title: string; copy: string; image: string; ratio: number };

const RATIOS = [1.25, 1.5, 1, 1.35, 1.15, 1.6];

export function buildFeed(page: number): FeedItem[] {
  const out: FeedItem[] = [];
  const seed = page * 7;
  for (let i = 0; i < 12; i++) {
    const n = seed + i;
    const ratio = RATIOS[n % RATIOS.length];
    const mod = n % 7;
    if (mod === 2) {
      out.push({ kind: "collection", id: COLLECTIONS[n % COLLECTIONS.length].id, ratio });
    } else if (mod === 4) {
      const c = CREATORS[n % CREATORS.length];
      out.push({ kind: "video", id: `v-${n}`, title: "Styling three ways", creator: c.handle, image: c.image, ratio });
    } else if (mod === 5) {
      out.push({ kind: "boutique", slug: DEMO_STORES[n % DEMO_STORES.length].slug, ratio });
    } else if (mod === 6) {
      const lb = LOOKBOOKS[n % LOOKBOOKS.length];
      out.push({ kind: "editorial", id: lb.id, title: lb.title, copy: lb.subtitle, image: lb.cover, ratio });
    } else {
      out.push({ kind: "product", id: DEMO_PRODUCTS[n % DEMO_PRODUCTS.length].id, ratio });
    }
  }
  return out;
}