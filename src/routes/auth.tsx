import { Outlet, createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-blush/70 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-berry/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-lime/30 blur-3xl" />

      <div className="relative mx-auto max-w-md px-5 pt-10 pb-24">
        <Link to="/" className="mx-auto flex w-fit items-center gap-2">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl font-display font-black text-white text-xl shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-hero)" }}
          >
            M
          </div>
          <div className="leading-tight">
            <div className="font-display text-xl font-extrabold tracking-tight">MaeLove</div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Sparkles className="h-2.5 w-2.5 text-berry" /> East Africa's boutique marketplace
            </div>
          </div>
        </Link>

        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
