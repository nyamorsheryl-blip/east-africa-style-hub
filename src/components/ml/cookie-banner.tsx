import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

const KEY = "maelove.cookie-consent";

export function CookieBanner() {
  const [choice, setChoice] = useState<"accepted" | "declined" | null>("accepted"); // assume decided until we check, avoids a flash

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      setChoice(stored === "accepted" || stored === "declined" ? stored : null);
    } catch {
      setChoice(null);
    }
  }, []);

  function decide(value: "accepted" | "declined") {
    try { localStorage.setItem(KEY, value); } catch { /* ignore */ }
    setChoice(value);
  }

  if (choice !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fade-in fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:flex sm:justify-center"
    >
      <div className="glass-strong mx-auto flex w-full max-w-2xl flex-col gap-3 rounded-3xl p-5 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full glass-honey">
          <Cookie className="h-4 w-4" />
        </span>
        <p className="flex-1 text-[12.5px] leading-relaxed text-muted-foreground">
          We use cookies to keep you signed in, remember your cart, and understand how MaeLove is used.
          Read our{" "}
          <a href="/privacy" className="font-bold text-primary underline underline-offset-2">Privacy Policy</a>.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => decide("declined")}
            className="press glass rounded-full px-4 py-2.5 text-[12px] font-bold"
          >
            Necessary only
          </button>
          <button
            onClick={() => decide("accepted")}
            className="press glass-cherry rounded-full px-5 py-2.5 text-[12px] font-extrabold"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}