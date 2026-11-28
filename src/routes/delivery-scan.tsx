import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { ArrowLeft, Camera, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/delivery-scan")({
  head: () => ({ meta: [{ title: "Confirm delivery - MaeLove" }] }),
  component: DeliveryScanPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function DeliveryScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [working, setWorking] = useState(false);
  const [manual, setManual] = useState("");
  const [done, setDone] = useState<{ earned_cents: number; currency: string } | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }
  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  async function confirm(raw: string) {
    setWorking(true);
    stopCamera();
    const { data, error } = await db.rpc("confirm_delivery", { p_code: raw });
    setWorking(false);
    if (error) { toast.error(error.message); return; }
    setDone({ earned_cents: data?.earned_cents ?? 0, currency: data?.currency ?? "KES" });
    toast.success("Delivery confirmed");
  }

  async function startScan() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = s;
      setScanning(true);
    } catch {
      toast.error("Please allow camera access, or type the code instead.");
    }
  }

  useEffect(() => {
    if (!scanning || !videoRef.current || !streamRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    v.srcObject = streamRef.current;
    void v.play();
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    let stop = false;
    let last = 0;
    let raf = 0;
    const tick = (t: number) => {
      if (stop) return;
      if (t - last > 200 && v.videoWidth) {
        last = t;
        const scale = Math.min(1, 640 / v.videoWidth);
        c.width = Math.round(v.videoWidth * scale);
        c.height = Math.round(v.videoHeight * scale);
        ctx.drawImage(v, 0, 0, c.width, c.height);
        const img = ctx.getImageData(0, 0, c.width, c.height);
        const res = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        if (res?.data) { stop = true; void confirm(res.data); return; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stop = true; cancelAnimationFrame(raf); };
  }, [scanning]);

  return (
    <div className="min-h-screen px-5 pt-8 pb-16">
      <div className="mx-auto max-w-sm">
        <Link to="/delivery" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-plum">
          <ArrowLeft className="h-3 w-3" /> My deliveries
        </Link>
        <h1 className="mt-3 font-display text-2xl font-black">Confirm delivery</h1>
        <p className="text-sm text-muted-foreground">Hand over the order, then scan the customer's QR code.</p>

        {done ? (
          <div className="glass mt-6 rounded-3xl p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-berry" />
            <p className="mt-3 font-display text-lg font-black">Delivery confirmed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You earned {(done.earned_cents / 100).toLocaleString()} {done.currency} for this drop-off.
            </p>
            <button onClick={() => setDone(null)} className="mt-5 rounded-full bg-berry px-6 py-2.5 text-sm font-semibold text-cream">Scan another</button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {scanning ? (
              <div className="overflow-hidden rounded-3xl bg-black">
                <video ref={videoRef} playsInline muted className="aspect-square w-full object-cover" />
              </div>
            ) : (
              <button onClick={startScan} disabled={working} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-berry py-3.5 text-sm font-semibold text-cream shadow-[var(--shadow-glow)] disabled:opacity-60">
                {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} Scan QR code
              </button>
            )}
            <canvas ref={canvasRef} className="hidden" />

            <form onSubmit={(e) => { e.preventDefault(); if (manual.trim()) void confirm(manual.trim()); }} className="glass rounded-3xl p-4">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-plum/70">
                Or type the code
                <input value={manual} onChange={(e) => setManual(e.target.value.toUpperCase())} maxLength={16} placeholder="A1B2C3D4E5F6"
                  className="mt-1.5 w-full rounded-2xl border border-white/80 bg-white/70 px-3.5 py-3 font-mono text-sm normal-case tracking-widest outline-none focus:border-berry" />
              </label>
              <button type="submit" disabled={working || !manual.trim()} className="mt-3 w-full rounded-full glass py-3 text-sm font-semibold text-plum disabled:opacity-50">Confirm with code</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}