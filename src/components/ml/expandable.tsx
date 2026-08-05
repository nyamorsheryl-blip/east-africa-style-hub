import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function Expandable({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass overflow-hidden rounded-3xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="press flex min-h-[56px] w-full items-center gap-3 px-5 py-4 text-left"
      >
        {icon && <span className="shrink-0 text-primary">{icon}</span>}
        <span className="min-w-0 flex-1 truncate text-[14px] font-black tracking-tight">{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 text-[13px] leading-relaxed text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}
