import { Link } from "@tanstack/react-router";
import { Search, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import heroWomen from "@/assets/hero-women.jpg";
import catMen from "@/assets/cat-men.jpg";
import catJewellery from "@/assets/cat-jewellery.jpg";

const SLIDES = [
  { image: heroWomen, eyebrow: "NEW SEASON ARRIVALS", title: "Women's Edit", to: "/shop", cat: "Women's Clothing" },
  { image: catMen, eyebrow: "STREET & TAILORED", title: "Men's Drop", to: "/shop", cat: "Men's Clothing" },
  { image: catJewellery, eyebrow: "HANDCRAFTED FINE", title: "Jewellery", to: "/shop", cat: "Jewellery" },
];

export function HeroCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const s = SLIDES[i];

  return (
    <section className="relative mx-3 mt-3 overflow-hidden rounded-[2rem] h-[560px] shadow-[var(--shadow-glow)]">
      {SLIDES.map((slide, idx) => (
        <img
          key={idx}
          src={slide.image}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0"}`}
          {...(idx === 0 ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-plum/70 via-plum/10 to-transparent" />

      {/* Top row: logo + actions */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
        <div className="font-black text-2xl tracking-tight text-white">
          mae<span className="text-blush">love</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-plum"
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <Link
            to="/profile"
            aria-label="Profile"
            className="h-10 w-10 rounded-full ring-2 ring-white overflow-hidden bg-blush"
          >
            <div className="h-full w-full bg-gradient-to-br from-blush to-berry" />
          </Link>
        </div>
      </div>

      {/* Bottom copy */}
      <div className="absolute bottom-6 left-5 right-5">
        <div className="text-[11px] font-extrabold tracking-[0.2em] text-blush mb-2">
          {s.eyebrow}
        </div>
        <h1 className="text-white text-5xl font-black tracking-tight leading-none mb-5">
          {s.title}
        </h1>
        <div className="flex items-center gap-3">
          <Link
            to={s.to}
            search={{ category: s.cat } as never}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-extrabold text-plum shadow-lg"
          >
            Shop Now <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-1.5">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-lime" : "w-1.5 bg-white/60"}`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
