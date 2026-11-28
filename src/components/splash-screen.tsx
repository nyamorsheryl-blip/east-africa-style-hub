import { useEffect, useState } from "react";

const BG = "#35001C";
const PINK = "#F7C6E6";
const YELLOW = "#FFD84D";

const ICONS: { name: string; svg: string }[] = [
  { name: "bag", svg: '<path d="M14 22h36l-3 32H17z"/><path d="M24 22v-4a8 8 0 0 1 16 0v4"/>' },
  { name: "dress", svg: '<path d="M25 6l3 10 4 4 4-4 3-10"/><path d="M28 16l-4 16-12 26h40L40 32l-4-16"/><path d="M24 32h16"/>' },
  { name: "shirt", svg: '<path d="M22 8L8 16l6 12 6-4v32h24V24l6 4 6-12-14-8c-2 5-18 5-20 0z"/>' },
  { name: "watch", svg: '<rect x="18" y="20" width="28" height="24" rx="8"/><path d="M24 20l2-12h12l2 12M24 44l2 12h12l2-12"/><path d="M32 27v6l4 3"/>' },
  { name: "lipstick", svg: '<rect x="22" y="34" width="20" height="22" rx="3"/><rect x="25" y="25" width="14" height="9"/><path d="M27 25V13l10 5v7"/>' },
  { name: "sunglasses", svg: '<circle cx="20" cy="34" r="10"/><circle cx="44" cy="34" r="10"/><path d="M30 33h4M10 32L5 22M54 32l5-10"/>' },
  { name: "perfume", svg: '<rect x="18" y="26" width="28" height="30" rx="7"/><rect x="26" y="14" width="12" height="12"/><rect x="24" y="8" width="16" height="6" rx="2"/>' },
  { name: "ring", svg: '<circle cx="32" cy="40" r="14"/><path d="M26 18l6-8 6 8-6 7z"/>' },
  { name: "handbag", svg: '<rect x="10" y="26" width="44" height="28" rx="7"/><path d="M24 26c0-12 16-12 16 0"/><path d="M10 38h44"/>' },
];

export function SplashScreen() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % ICONS.length), 650);
    return () => clearInterval(t);
  }, []);
  const icon = ICONS[i];
  const color = i % 2 === 0 ? PINK : YELLOW;

  return (
    <div
      role="status"
      aria-label="Loading MaeLove"
      style={{ position: "fixed", inset: 0, zIndex: 100, background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}
    >
      <style>{`
        @keyframes ml-hop { 0% { transform: translateY(0) scale(1.1, .9); } 18% { transform: translateY(0) scale(.92, 1.08); } 50% { transform: translateY(-34px) scale(1, 1); } 82% { transform: translateY(0) scale(1.08, .92); } 100% { transform: translateY(0) scale(1, 1); } }
        @keyframes ml-shadow { 0%, 100% { transform: scaleX(1); opacity: .35; } 50% { transform: scaleX(.55); opacity: .12; } }
        @media (prefers-reduced-motion: reduce) { .ml-hop, .ml-shadow { animation: none !important; } }
      `}</style>
      <div key={i} className="ml-hop" style={{ width: 96, height: 96, animation: "ml-hop 650ms ease-in-out both" }}>
        <svg
          viewBox="0 0 64 64" width="96" height="96" fill="none" stroke={color}
          strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
          dangerouslySetInnerHTML={{ __html: icon.svg }}
        />
      </div>
      <div key={`s${i}`} className="ml-shadow" style={{ width: 60, height: 8, borderRadius: "50%", background: "#000", marginTop: -8, animation: "ml-shadow 650ms ease-in-out both" }} />
      <div style={{ color: PINK, letterSpacing: "0.35em", fontWeight: 800, fontSize: 14 }}>MAELOVE</div>
    </div>
  );
}