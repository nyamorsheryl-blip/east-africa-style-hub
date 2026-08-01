import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, Store, MessageCircle, User } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/sell", label: "Sell", icon: Store },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-4 left-1/2 z-50 w-[min(94vw,460px)] -translate-x-1/2"
    >
      <div className="glass-strong flex items-center justify-between rounded-full px-2 py-2">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className="press relative flex flex-1 flex-col items-center gap-1 py-1"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.9} />
              </span>
              <span
                className={`text-[10px] font-bold tracking-tight ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
