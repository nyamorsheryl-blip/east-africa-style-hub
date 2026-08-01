import prodBlazer from "@/assets/prod-blazer.jpg";
import prodPendant from "@/assets/prod-pendant.jpg";
import prodStreet from "@/assets/prod-streetset.jpg";
import prodMandala from "@/assets/prod-mandala.jpg";
import catWomen from "@/assets/cat-women.jpg";
import catMen from "@/assets/cat-men.jpg";
import catJewellery from "@/assets/cat-jewellery.jpg";
import catShoes from "@/assets/cat-shoes.jpg";
import heroWomen from "@/assets/hero-women.jpg";

export const IMAGES = {
  blazer: prodBlazer,
  pendant: prodPendant,
  street: prodStreet,
  mandala: prodMandala,
  women: catWomen,
  men: catMen,
  jewellery: catJewellery,
  shoes: catShoes,
  hero: heroWomen,
};

export type DemoProduct = {
  id: string;
  title: string;
  store: string;
  price_cents: number;
  sale_price_cents?: number | null;
  image: string;
  rating: number;
  reviews: number;
  badge?: string | null;
  tag?: string;
};

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: "demo-1", title: "Noir Satin Blazer Dress", store: "MaeLove Studio", price_cents: 24000, sale_price_cents: 18900, image: IMAGES.blazer, rating: 4.9, reviews: 214, badge: "SALE" },
  { id: "demo-2", title: "Gold Teardrop Pendant", store: "Lumière Fine", price_cents: 22000, image: IMAGES.pendant, rating: 4.8, reviews: 132, badge: "TRENDING" },
  { id: "demo-3", title: "Street Colour Block Set", store: "Grid Supply", price_cents: 13200, image: IMAGES.street, rating: 4.7, reviews: 88 },
  { id: "demo-4", title: "Silver Mandala Necklace", store: "Lumière Fine", price_cents: 19500, image: IMAGES.mandala, rating: 5.0, reviews: 46, badge: "NEW" },
  { id: "demo-5", title: "Sculpted Leather Heel", store: "Atelier Nairobi", price_cents: 28900, sale_price_cents: 21900, image: IMAGES.shoes, rating: 4.6, reviews: 301, badge: "FLASH" },
  { id: "demo-6", title: "Tailored Linen Shirt", store: "Kampala Cloth Co.", price_cents: 9800, image: IMAGES.men, rating: 4.8, reviews: 175 },
  { id: "demo-7", title: "Silk Wrap Midi", store: "MaeLove Studio", price_cents: 17400, image: IMAGES.women, rating: 4.9, reviews: 92, badge: "NEW" },
  { id: "demo-8", title: "Beaded Statement Cuff", store: "Zanzi Craft", price_cents: 7600, sale_price_cents: 5900, image: IMAGES.jewellery, rating: 4.7, reviews: 58, badge: "SALE" },
];

export const CATEGORY_CHIPS = [
  "All", "Women", "Men", "Shoes", "Jewellery", "Bags", "Accessories", "Handmade", "Luxury",
];

export const POPULAR_CATEGORIES = [
  { label: "Women", slug: "women", image: IMAGES.women },
  { label: "Men", slug: "men", image: IMAGES.men },
  { label: "Jewellery", slug: "jewellery", image: IMAGES.jewellery },
  { label: "Shoes", slug: "shoes", image: IMAGES.shoes },
];

export const DEMO_STORES = [
  { slug: "maelove-studio", name: "MaeLove Studio", city: "Nairobi, KE", rating: 4.9, followers: "12.4k", trust: 98, image: IMAGES.women, verified: true },
  { slug: "lumiere-fine", name: "Lumière Fine", city: "Kigali, RW", rating: 4.8, followers: "8.1k", trust: 95, image: IMAGES.jewellery, verified: true },
  { slug: "grid-supply", name: "Grid Supply", city: "Kampala, UG", rating: 4.6, followers: "5.7k", trust: 91, image: IMAGES.street, verified: false },
  { slug: "atelier-nairobi", name: "Atelier Nairobi", city: "Nairobi, KE", rating: 4.7, followers: "9.3k", trust: 94, image: IMAGES.shoes, verified: true },
];

export const FUTURE_LANES = [
  { key: "live", title: "Live Shopping", copy: "Shoppable streams from your favourite boutiques", emoji: "🎥" },
  { key: "rental", title: "Rentals", copy: "Borrow occasion-wear for a weekend", emoji: "👗" },
  { key: "auction", title: "Auctions", copy: "Bid on one-of-one archive pieces", emoji: "🔨" },
  { key: "digital", title: "Digital Goods", copy: "Patterns, presets and lookbooks", emoji: "⬇️" },
  { key: "services", title: "Services", copy: "Tailoring, styling and alterations", emoji: "✂️" },
];

export const AI_FEATURES = [
  { title: "AI Shopping Assistant", copy: "Ask for a look, get a full basket", emoji: "✨" },
  { title: "Virtual Try-On", copy: "See the fit before you buy", emoji: "🪞" },
  { title: "AI Size Recommendation", copy: "Your measurements, remembered", emoji: "📐" },
  { title: "Outfit Generator", copy: "Style a week in one tap", emoji: "🧵" },
];
