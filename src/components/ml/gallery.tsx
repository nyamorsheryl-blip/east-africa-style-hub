import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Maximize2, Play, Box, RotateCw } from "lucide-react";

type Slide = { src: string; kind?: "image" | "video" | "360" };

/** Pinch / double-tap / wheel zoomable full-screen viewer. */
function Zoomable({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [z, setZ] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const state = useRef({ z: 1, off: { x: 0, y: 0 } });
  state.current = { z, off };
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; z: number; cx: number; cy: number } | null>(null);
  const lastTap = useRef(0);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const clamp = (v: number) => Math.min(4, Math.max(1, v));

  const zoomAt = useCallback((next: number, px: number, py: number) => {
    const cur = state.current;
    const k = clamp(next) / cur.z;
    setZ(clamp(next));
    setOff(
      clamp(next) === 1
        ? { x: 0, y: 0 }
        : { x: px - (px - cur.off.x) * k, y: py - (py - cur.off.y) * k },
    );
  }, []);

  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const r = el.getBoundingClientRect();
      zoomAtRef.current(state.current.z * Math.exp(-dy * 0.0018), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const r = ref.current!.getBoundingClientRect();
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        z: state.current.z,
        cx: (a.x + b.x) / 2 - r.left,
        cy: (a.y + b.y) / 2 - r.top,
      };
    } else {
      drag.current = { x: e.clientX, y: e.clientY, ox: state.current.off.x, oy: state.current.off.y };
      const now = Date.now();
      if (now - lastTap.current < 300) {
        const r = ref.current!.getBoundingClientRect();
        zoomAtRef.current(state.current.z > 1.2 ? 1 : 2.5, e.clientX - r.left, e.clientY - r.top);
      }
      lastTap.current = now;
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAtRef.current((pinch.current.z * d) / pinch.current.dist, pinch.current.cx, pinch.current.cy);
      return;
    }
    if (drag.current && state.current.z > 1) {
      setOff({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) });
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
  }

  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full select-none object-contain"
        style={{
          transformOrigin: "0 0",
          transform: `translate(${off.x}px, ${off.y}px) scale(${z})`,
          transition: drag.current || pinch.current ? "none" : "transform 0.32s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
      {z === 1 && (
        <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-[11px] font-bold text-white/70">
          Double tap, pinch or scroll to zoom
        </p>
      )}
    </div>
  );
}

export function ProductGallery({ slides, title }: { slides: Slide[]; title: string }) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  useEffect(() => {
    if (full === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(null);
      if (e.key === "ArrowRight") setFull((i) => Math.min(slides.length - 1, (i ?? 0) + 1));
      if (e.key === "ArrowLeft") setFull((i) => Math.max(0, (i ?? 0) - 1));
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [full, slides.length]);

  return (
    <div className="relative">
      <div
        ref={scroller}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        aria-roledescription="carousel"
        aria-label={`${title} images`}
      >
        {slides.map((s, i) => (
          <div key={i} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-muted md:aspect-[16/10]">
            {!loaded[i] && <div className="shimmer absolute inset-0 bg-muted" aria-hidden />}
            <img
              src={s.src}
              alt={`${title} — view ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              onLoad={() => setLoaded((l) => ({ ...l, [i]: true }))}
              className={`h-full w-full object-cover transition-opacity duration-500 ${loaded[i] ? "opacity-100" : "opacity-0"}`}
            />
            {s.kind === "video" && (
              <span className="pointer-events-none absolute inset-0 grid place-items-center">
                <span className="glass-strong flex h-16 w-16 items-center justify-center rounded-full">
                  <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
                </span>
              </span>
            )}
            {s.kind === "360" && (
              <span className="pointer-events-none absolute inset-0 grid place-items-center">
                <span className="glass-strong flex flex-col items-center gap-1 rounded-3xl px-5 py-4 text-center">
                  <RotateCw className="h-5 w-5" />
                  <span className="text-[11px] font-extrabold">360° viewer</span>
                  <span className="text-[10px] text-muted-foreground">Coming soon</span>
                </span>
              </span>
            )}
            <button
              type="button"
              onClick={() => setFull(i)}
              aria-label="Open full screen gallery"
              className="press absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-card/85 backdrop-blur-md"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-primary" : "w-1.5 bg-foreground/25"}`}
          />
        ))}
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5">
        {slides.map((s, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show image ${i + 1}`}
            onClick={() => scroller.current?.scrollTo({ left: i * scroller.current.clientWidth, behavior: "smooth" })}
            className={`press relative h-16 w-14 shrink-0 overflow-hidden rounded-2xl border-2 transition-colors ${i === index ? "border-primary" : "border-transparent"}`}
          >
            <img src={s.src} alt="" loading="lazy" className="h-full w-full object-cover" />
            {s.kind === "video" && <Play className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />}
            {s.kind === "360" && <Box className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />}
          </button>
        ))}
      </div>

      {full !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fade-in fixed inset-0 z-[100] bg-black/95" role="dialog" aria-modal="true" aria-label="Full screen gallery">
            <button
              type="button"
              onClick={() => setFull(null)}
              aria-label="Close gallery"
              className="press absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-md"
            >
              <X className="h-5 w-5" />
            </button>
            <Zoomable src={slides[full].src} alt={`${title} — view ${full + 1}`} />
            <div className="absolute inset-x-0 bottom-8 flex justify-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`View image ${i + 1}`}
                  onClick={() => setFull(i)}
                  className={`h-12 w-10 overflow-hidden rounded-xl border-2 ${i === full ? "border-white" : "border-white/25 opacity-60"}`}
                >
                  <img src={s.src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
