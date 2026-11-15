import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 50 * 1024 * 1024;
const TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export function ProductVideoPlayer({ src, className = "" }: { src: string; className?: string }) {
  return (
    <video
      src={src}
      controls
      playsInline
      preload="metadata"
      className={`w-full rounded-2xl bg-black ${className}`}
    />
  );
}

export function ProductVideoUpload({
  userId,
  value,
  onChange,
}: {
  userId: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!TYPES.includes(file.type)) return setError("Please choose an MP4, WebM or MOV video.");
    if (file.size > MAX_BYTES) return setError("Video is too large. The limit is 50 MB.");

    setBusy(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage
      .from("product-videos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      setBusy(false);
      return setError(upErr.message);
    }
    const { data } = supabase.storage.from("product-videos").getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
  }

  async function remove() {
    if (value) {
      const marker = "/product-videos/";
      const i = value.indexOf(marker);
      if (i >= 0) await supabase.storage.from("product-videos").remove([decodeURIComponent(value.slice(i + marker.length))]);
    }
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {busy && <p className="text-sm opacity-70">Uploading video...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {value && (
        <div className="space-y-2">
          <ProductVideoPlayer src={value} />
          <button type="button" onClick={remove} className="text-sm underline">
            Remove video
          </button>
        </div>
      )}
    </div>
  );
}