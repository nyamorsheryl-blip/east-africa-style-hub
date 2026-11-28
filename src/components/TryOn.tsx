import { useEffect, useRef, useState } from "react";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

/*
  MaeLove virtual try-on.
  - Everything runs in the browser: the photo is never uploaded or stored.
  - Scanner model files are downloaded from Google / jsDelivr at runtime.
  Usage: <TryOnButton imageUrl={product image url} title={product title} defaultGarment="top" />
*/

const COUNTDOWN_SECONDS = 1;
const MAX_PHOTO_SIDE = 960;
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

type Garment = "top" | "bottom" | "dress";
type Phase = "intro" | "camera" | "countdown" | "scanning" | "result" | "error";
type Pt = { x: number; y: number; v: number };
type Scan = { photo: HTMLCanvasElement; pts: Pt[]; mask: Float32Array | null; mw: number; mh: number };

let landmarkerPromise: Promise<PoseLandmarker> | null = null;
function getLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: "IMAGE",
        numPoses: 1,
        outputSegmentationMasks: true,
      });
    })().catch((e) => {
      landmarkerPromise = null;
      throw e;
    });
  }
  return landmarkerPromise;
}

async function scanPhoto(photo: HTMLCanvasElement): Promise<Scan> {
  const lm = await getLandmarker();
  let found = null as Scan | null;
  lm.detect(photo, (res) => {
    const l = res.landmarks?.[0];
    if (!l) return;
    const m = res.segmentationMasks?.[0];
    found = {
      photo,
      pts: l.map((p) => ({ x: p.x * photo.width, y: p.y * photo.height, v: p.visibility ?? 0 })),
      mask: m ? m.getAsFloat32Array().slice() : null,
      mw: m ? m.width : 0,
      mh: m ? m.height : 0,
    };
  });
  const result = found as Scan | null;
  if (!result) throw new Error("no-person");
  return result;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

// Removes the plain background around a flat product photo and crops to the garment.
function prepareGarment(img: HTMLImageElement): HTMLCanvasElement {
  const s = Math.min(1, 500 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * s));
  const h = Math.max(1, Math.round(img.naturalHeight * s));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;

  const corner = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return [d[i], d[i + 1], d[i + 2]];
  };
  const cs = [corner(0, 0), corner(w - 1, 0), corner(0, h - 1), corner(w - 1, h - 1)];
  const bg = [0, 1, 2].map((k) => Math.round(cs.reduce((a, col) => a + col[k], 0) / 4));
  const near = (i: number) => Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) < 70;

  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    const p = y * w + x;
    if (seen[p] || !near(p * 4)) return;
    seen[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }

  let removed = 0;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let p = 0; p < w * h; p++) {
    if (seen[p]) {
      d[p * 4 + 3] = 0;
      removed++;
      continue;
    }
    const x = p % w;
    const y = (p - x) / w;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (maxX < 0 || removed > w * h * 0.9) throw new Error("no-garment");
  ctx.putImageData(id, 0, 0);

  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext("2d")!.drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

function garmentBox(kind: Garment, pts: Pt[]): { x: number; y: number; w: number; h: number } | null {
  const ok = (...ix: number[]) => ix.every((i) => pts[i] && pts[i].v > 0.4);
  const mid = (a: number, b: number) => ({ x: (pts[a].x + pts[b].x) / 2, y: (pts[a].y + pts[b].y) / 2 });
  const span = (a: number, b: number) => Math.abs(pts[a].x - pts[b].x);

  if (kind === "top") {
    if (!ok(11, 12, 23, 24)) return null;
    const sh = mid(11, 12);
    const hp = mid(23, 24);
    const torso = hp.y - sh.y;
    const w = Math.max(span(11, 12) * 1.5, span(23, 24) * 1.6);
    return { x: sh.x - w / 2, y: sh.y - torso * 0.1, w, h: torso * 1.25 };
  }
  if (kind === "bottom") {
    if (!ok(23, 24, 27, 28)) return null;
    const hp = mid(23, 24);
    const an = mid(27, 28);
    const len = an.y - hp.y;
    const w = span(23, 24) * 2;
    return { x: hp.x - w / 2, y: hp.y - len * 0.05, w, h: len * 1.05 };
  }
  if (!ok(11, 12, 25, 26)) return null;
  const sh = mid(11, 12);
  const kn = mid(25, 26);
  const h = (kn.y - sh.y) * 1.08;
  const w = span(11, 12) * 1.7;
  return { x: sh.x - w / 2, y: sh.y - h * 0.05, w, h };
}

function smooth(m: number): number {
  const t = Math.min(1, Math.max(0, (m - 0.4) / 0.2));
  return t * t * (3 - 2 * t);
}

function buildMiniMe(scan: Scan, garment: HTMLCanvasElement | null, kind: Garment | null): HTMLCanvasElement {
  const { photo, pts, mask, mw, mh } = scan;
  const W = photo.width;
  const H = photo.height;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(photo, 0, 0);
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;

  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const m = mask && mw > 0 && mh > 0
        ? mask[Math.min(mh - 1, Math.floor((y * mh) / H)) * mw + Math.min(mw - 1, Math.floor((x * mw) / W))]
        : 1;
      const a = smooth(m);
      d[(y * W + x) * 4 + 3] = Math.round(a * 255);
      if (a > 0.5) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  ctx.putImageData(img, 0, 0);

  if (garment && kind) {
    const box = garmentBox(kind, pts);
    if (box) {
      const sc = Math.min(box.w / garment.width, box.h / garment.height);
      const dw = garment.width * sc;
      const dh = garment.height * sc;
      ctx.globalCompositeOperation = "source-atop"; // only paint where the person is
      ctx.drawImage(garment, box.x + (box.w - dw) / 2, box.y + (box.h - dh) / 2, dw, dh);
      ctx.globalCompositeOperation = "source-over";
    }
  }

  if (maxX <= minX || maxY <= minY) return c;
  const pad = 12;
  const x0 = Math.max(0, minX - pad);
  const y0 = Math.max(0, minY - pad);
  const x1 = Math.min(W, maxX + pad);
  const y1 = Math.min(H, maxY + pad);
  const out = document.createElement("canvas");
  out.width = x1 - x0;
  out.height = y1 - y0;
  out.getContext("2d")!.drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

type Props = { imageUrl: string; title?: string; defaultGarment?: Garment; className?: string };

export function TryOnButton({ imageUrl, title, defaultGarment = "top", className }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "w-full rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur"
        }
      >
        Try it on
      </button>
      {open && (
        <TryOnModal imageUrl={imageUrl} title={title} defaultGarment={defaultGarment} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function TryOnModal({
  imageUrl,
  title,
  defaultGarment,
  onClose,
}: {
  imageUrl: string;
  title?: string;
  defaultGarment: Garment;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [count, setCount] = useState(COUNTDOWN_SECONDS);
  const [message, setMessage] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [miniUrl, setMiniUrl] = useState("");
  const [kind, setKind] = useState<Garment | null>(null);
  const [hasKnees, setHasKnees] = useState(false);
  const [hasAnkles, setHasAnkles] = useState(false);
  const [hasGarment, setHasGarment] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const scanRef = useRef<Scan | null>(null);
  const garmentRef = useRef<HTMLCanvasElement | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if ((phase === "camera" || phase === "countdown") && v && streamRef.current && v.srcObject !== streamRef.current) {
      v.srcObject = streamRef.current;
      v.play().catch(() => {});
    }
  }, [phase]);

  const fail = (text: string) => {
    stopCamera();
    setMessage(text);
    setPhase("error");
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setPhase("camera");
      getLandmarker().catch(() => {}); // start loading the scanner now
    } catch {
      fail("We couldn't open your camera. Allow camera access in your browser settings and try again.");
    }
  };

  const capture = (): HTMLCanvasElement | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const s = Math.min(1, MAX_PHOTO_SIDE / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(v.videoWidth * s);
    c.height = Math.round(v.videoHeight * s);
    const ctx = c.getContext("2d")!;
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1); // mirror, like the preview
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return c;
  };

  const render = (k: Garment | null) => {
    const scan = scanRef.current;
    if (!scan) return;
    const out = buildMiniMe(scan, k ? garmentRef.current : null, k);
    setMiniUrl(out.toDataURL("image/png"));
  };

  const snap = async () => {
    const photo = capture();
    if (!photo) {
      fail("The camera didn't give us a picture. Please try again.");
      return;
    }
    stopCamera();
    setPhotoUrl(photo.toDataURL("image/jpeg", 0.85));
    setPhase("scanning");
    try {
      const garmentPromise = loadImage(imageUrl).then(prepareGarment).catch(() => null);
      const [scan, g] = await Promise.all([
        scanPhoto(photo),
        garmentPromise,
        new Promise((r) => setTimeout(r, 1800)),
      ]);
      const seen = (i: number) => scan.pts[i] && scan.pts[i].v > 0.5;
      if (!(seen(11) && seen(12) && seen(23) && seen(24))) throw new Error("partial");

      scanRef.current = scan;
      garmentRef.current = g;
      const knees = !!(seen(25) && seen(26));
      const ankles = !!(seen(27) && seen(28));
      setHasKnees(knees);
      setHasAnkles(ankles);
      setHasGarment(!!g);

      let start: Garment | null = defaultGarment;
      if ((start === "bottom" && !ankles) || (start === "dress" && !knees)) start = "top";
      if (!g) start = null;
      setKind(start);
      render(start);
      setPhase("result");
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      if (m === "no-person" || m === "partial") {
        fail("We couldn't see your whole body. Step back so you're in frame from head to toe, with good light.");
      } else {
        fail("We couldn't load the scanner. Check your internet connection and try again.");
      }
    }
  };

  const begin = () => {
    let n = COUNTDOWN_SECONDS;
    setCount(n);
    setPhase("countdown");
    timerRef.current = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        void snap();
      } else {
        setCount(n);
      }
    }, 1000);
  };

  const pick = (k: Garment | null) => {
    setKind(k);
    render(k);
  };

  const close = () => {
    stopCamera();
    if (timerRef.current) window.clearInterval(timerRef.current);
    onClose();
  };

  const options: { key: Garment | null; label: string; enabled: boolean }[] = [
    { key: "top", label: "Top", enabled: hasGarment },
    { key: "bottom", label: "Bottom", enabled: hasGarment && hasAnkles },
    { key: "dress", label: "Dress", enabled: hasGarment && hasKnees },
    { key: null, label: "None", enabled: true },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true">
      <style>{`@keyframes mlscan{0%{top:0}100%{top:100%}}`}</style>
      <div className="relative w-full max-w-md rounded-3xl bg-neutral-900 p-4 text-white shadow-2xl">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 h-9 w-9 rounded-full bg-white/10 text-lg"
        >
          x
        </button>
        <h2 className="mb-3 pr-10 text-lg font-semibold">Try it on{title ? `: ${title}` : ""}</h2>

        {phase === "intro" && (
          <div className="space-y-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-white/80">
              <li>Stand about 2 metres back so you are in frame from head to toe.</li>
              <li>Face the camera in good light, ideally against a plain background.</li>
              <li>Your photo stays on your phone. It is never uploaded or saved.</li>
            </ul>
            <button type="button" onClick={startCamera} className="w-full rounded-full bg-white py-3 font-semibold text-black">
              Start camera
            </button>
          </div>
        )}

        {(phase === "camera" || phase === "countdown") && (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: "3 / 4" }}>
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-contain"
                style={{ transform: "scaleX(-1)" }}
              />
              <svg viewBox="0 0 100 133" className="pointer-events-none absolute inset-0 h-full w-full opacity-60">
                <g fill="none" stroke="white" strokeWidth="0.8" strokeDasharray="3 2">
                  <circle cx="50" cy="20" r="9" />
                  <rect x="33" y="31" width="34" height="48" rx="8" />
                  <rect x="36" y="79" width="12" height="46" rx="5" />
                  <rect x="52" y="79" width="12" height="46" rx="5" />
                </g>
              </svg>
              {phase === "countdown" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-8xl font-bold">
                  {count}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={begin}
              disabled={phase === "countdown"}
              className="w-full rounded-full bg-white py-3 font-semibold text-black disabled:opacity-50"
            >
              {phase === "countdown" ? "Hold still..." : "Take my photo"}
            </button>
          </div>
        )}

        {phase === "scanning" && (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: "3 / 4" }}>
              <img src={photoUrl} alt="" className="h-full w-full object-contain" />
              <div
                className="absolute left-0 h-1 w-full bg-white/90 shadow-[0_0_16px_6px_rgba(255,255,255,0.6)]"
                style={{ animation: "mlscan 1.2s ease-in-out infinite alternate" }}
              />
            </div>
            <p className="text-center text-sm text-white/80">Scanning and building your mini-me...</p>
          </div>
        )}

        {phase === "result" && (
          <div className="space-y-3">
            <div className="flex flex-col items-center justify-end rounded-2xl bg-gradient-to-b from-neutral-700 to-neutral-800 px-4 pb-4 pt-6">
              <img
                src={miniUrl}
                alt="Your mini avatar"
                className="max-h-[48vh] w-auto"
                style={{
                  filter:
                    "drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 1.5px #fff) drop-shadow(0 6px 10px rgba(0,0,0,.35))",
                }}
              />
              <div className="mt-1 h-3 w-32 rounded-full bg-black/40 blur-md" />
            </div>
            {!hasGarment && (
              <p className="text-center text-xs text-white/60">
                This product photo can't be placed on you automatically yet, so here is just your mini-me.
              </p>
            )}
            <div className="grid grid-cols-4 gap-2">
              {options.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  disabled={!o.enabled}
                  onClick={() => pick(o.key)}
                  className={`rounded-full px-2 py-2 text-sm ${
                    kind === o.key ? "bg-white text-black" : "bg-white/10 text-white"
                  } disabled:opacity-30`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={startCamera} className="flex-1 rounded-full bg-white/10 py-3 text-sm font-semibold">
                Retake
              </button>
              <button type="button" onClick={close} className="flex-1 rounded-full bg-white py-3 text-sm font-semibold text-black">
                Done
              </button>
            </div>
            <p className="text-center text-xs text-white/50">Your photo stayed on your device.</p>
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-4">
            <p className="text-sm text-white/90">{message}</p>
            <button type="button" onClick={startCamera} className="w-full rounded-full bg-white py-3 font-semibold text-black">
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}