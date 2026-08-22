import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

export type Crumb = {
  label: string;
  to?: string;
};

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="px-5 pt-2">
      <ol className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-muted-foreground">
        <li className="flex items-center gap-1">
          <Link to="/" aria-label="Home" className="press flex items-center gap-1 hover:text-foreground">
            <Home className="h-3 w-3" />
          </Link>
        </li>
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 opacity-50" />
              {c.to && !isLast ? (
                <Link to={c.to} className="press line-clamp-1 max-w-[9rem] hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page" className="line-clamp-1 max-w-[10rem] text-foreground">
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}