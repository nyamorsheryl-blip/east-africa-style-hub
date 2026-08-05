import { Sparkles } from "lucide-react";

export function ComingSoonCard({ title, copy, emoji }: { title: string; copy: string; emoji: string }) {
  return (
    <div className="press glass relative w-[190px] shrink-0 snap-start overflow-hidden rounded-3xl p-5 sm:w-auto">
      <span className="absolute right-3 top-3 rounded-full glass-honey px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
        Soon
      </span>
      <span className="text-2xl">{emoji}</span>
      <h3 className="mt-3 text-[14px] font-black leading-tight tracking-tight">{title}</h3>
      <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{copy}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-extrabold text-primary">
        <Sparkles className="h-3 w-3" /> Join the waitlist
      </span>
    </div>
  );
}
