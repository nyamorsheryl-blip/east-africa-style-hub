import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { HeroCarousel } from "@/components/hero-carousel";
import { CategoryTile } from "@/components/category-tile";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import catWomen from "@/assets/cat-women.jpg";
import catMen from "@/assets/cat-men.jpg";
import catJewellery from "@/assets/cat-jewellery.jpg";
import catShoes from "@/assets/cat-shoes.jpg";
import prodBlazer from "@/assets/prod-blazer.jpg";
import prodPendant from "@/assets/prod-pendant.jpg";
import prodStreet from "@/assets/prod-streetset.jpg";
import prodMandala from "@/assets/prod-mandala.jpg";

export const Route = createFileRoute("/")({ component: Landing });

const FEATURED: ProductCardData[] = [
  { id: "demo-1", title: "Noir Satin Blazer Dress", boutique: "MAELOVE STUDIO", price_cents: 24000, sale_price_cents: 18900, image: prodBlazer, badge: "SALE", discountPct: 21, swatches: ["#1a1a2e", "#6B003E"] },
  { id: "demo-2", title: "Gold Teardrop Pendant", boutique: "LUMIÈRE FINE", price_cents: 22000, image: prodPendant, badge: "BESTSELLER", swatches: ["#c9a84c", "#e8c07a"] },
  { id: "demo-3", title: "Street Colour Block Set", boutique: "GRID SUPPLY", price_cents: 13200, image: prodStreet, swatches: ["#e85d3a", "#2d5a9e", "#1a1a1a"] },
  { id: "demo-4", title: "Silver Mandala Necklace", boutique: "LUMIÈRE FINE", price_cents: 19500, image: prodMandala, badge: "LUXURY", swatches: ["#c0c0c0"] },
];

function Landing() {
  return (
    <div className="min-h-screen pb-28">
      <HeroCarousel />

      {/* Categories */}
      <section className="mt-8 px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-plum tracking-tight">Shop by Category</h2>
          <Link to="/shop" search={{}} className="flex items-center gap-1 text-sm font-extrabold text-berry">
            All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CategoryTile label="Women" image={catWomen} category="Women's Clothing" />
          <CategoryTile label="Men" image={catMen} category="Men's Clothing" />
          <CategoryTile label="Jewellery" image={catJewellery} category="Jewellery" />
          <CategoryTile label="Shoes" image={catShoes} category="Shoes" />
        </div>
      </section>

      {/* Featured */}
      <section className="mt-10 px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-plum tracking-tight">Featured Picks</h2>
          <Link to="/shop" search={{}} className="flex items-center gap-1 text-sm font-extrabold text-berry">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FEATURED.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* Boutique CTA */}
      <section className="mt-10 mx-5">
        <div className="relative overflow-hidden rounded-3xl p-6 text-white" style={{ background: "var(--gradient-hero)" }}>
          <div className="text-[11px] font-extrabold tracking-[0.2em] text-white/85 mb-2">FOR CREATORS</div>
          <h3 className="text-2xl font-black tracking-tight mb-2">Open a MaeLove boutique</h3>
          <p className="text-sm text-white/85 mb-4">Sell handmade fashion to a global audience. Free to start.</p>
          <Link to="/seller" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-berry">
            Start selling <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <MobileTabBar />
    </div>
  );
}
