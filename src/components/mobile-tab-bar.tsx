import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Diamond, ShoppingBag, Heart, User } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shop", label: "Shop", icon: Diamond },
  { to: "/cart", label: "Bag", icon: ShoppingBag },
  { to: "/wishlist", label: "Saved", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function MobileTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 w-[min(94vw,440px)]">
      <div className="glass rounded-full flex items-center justify-between px-2 py-2 shadow-[var(--shadow-glow)]">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              search={to === "/shop" ? ({} as never) : undefined}
              className="relative flex-1 flex flex-col items-center gap-0.5 py-1"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${
                  active
                    ? "bg-white shadow-[var(--shadow-soft)] text-plum"
                    : "text-plum/60"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span
                className={`text-[10px] font-bold tracking-tight ${
                  active ? "text-plum" : "text-plum/50"
                }`}
              >
                {label}
              </span>
              {active && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-lime" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
