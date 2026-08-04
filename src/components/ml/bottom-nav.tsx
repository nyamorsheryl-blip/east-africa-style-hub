import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Store, ClipboardList, User } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Categories", icon: LayoutGrid },
  { to: "/sell", label: "Sell", icon: Store },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2"
    >
      <div className="glass-strong flex items-center justify-between rounded-full px-3 py-2.5">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              title={label}
              aria-current={active ? "page" : undefined}
              className="press relative flex flex-1 items-center justify-center py-0.5"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  active ? "nav-glow scale-105" : "text-cherry hover:bg-accent/20"
                }`}
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.5 : 2} />
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
