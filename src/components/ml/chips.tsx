import type { ReactNode } from "react";

export function Chip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`press shrink-0 snap-start whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold ${
        active
          ? "bg-foreground text-background"
          : "glass text-foreground/80"
      }`}
    >
      {children}
    </button>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar mt-4 flex snap-x gap-2 overflow-x-auto px-5 py-1">{children}</div>
  );
}

