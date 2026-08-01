import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function Section({
  title,
  subtitle,
  action,
  actionTo,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: string;
  actionTo?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rise mt-12 ${className}`}>
      <div className="mb-4 flex items-end justify-between gap-4 px-5">
        <div>
          <h2 className="text-[22px] font-black leading-tight tracking-tight">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action &&
          (actionTo ? (
            <Link
              to={actionTo}
              className="press flex shrink-0 items-center gap-0.5 text-[13px] font-bold text-primary"
            >
              {action} <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="flex shrink-0 items-center gap-0.5 text-[13px] font-bold text-muted-foreground">
              {action}
            </span>
          ))}
      </div>
      {children}
    </section>
  );
}

export function Rail({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 ${className}`}>
      {children}
    </div>
  );
}
