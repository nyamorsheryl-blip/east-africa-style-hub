import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  Menu, Heart, ShoppingBag, Store, ClipboardList, MessageCircle, Sun, Moon,
    Home, Compass, Shirt, Settings, LogOut, Sparkles, Truck, Globe,
} from "lucide-react";
import { CherryMark } from "@/components/ml/cherry-mark";
import { useTheme } from "@/components/ml/theme-toggle";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { useCurrencyPicker } from "@/components/currency-provider";
import { getDisplayCurrency } from "@/lib/currency";
import {
  Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Global top bar: cherry mark (left), page title (centre), and a menu
 * trigger (right) that opens the site's primary navigation as a left-side
 * sliding drawer.
 */
export function TopBar({ title }: { title: string }) {
  const { dark, toggle } = useTheme();
  const { user } = useSession();
  const navigate = useNavigate();
  const { openPicker } = useCurrencyPicker();

  const { data: profile } = useQuery({
    queryKey: ["profile-flags", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_seller, is_delivery")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header
      className="sticky top-0 z-40 px-4 pb-3 pt-5 backdrop-blur-xl sm:px-6"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in oklab, var(--background) 94%, transparent), transparent)",
      }}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <Link to="/" aria-label="MaeLove home" className="press shrink-0">
          <span className="glass flex h-11 w-11 items-center justify-center rounded-2xl p-2.5">
            <CherryMark className="h-full w-full" />
          </span>
        </Link>

        <h1 className="fade-in flex-1 truncate text-center text-[17px] font-black tracking-tight">
          {title}
        </h1>

        <Sheet>
          <SheetTrigger
            aria-label="Menu"
            className="press glass flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="glass-strong flex w-[85vw] max-w-xs flex-col gap-1 border-0 p-4 sm:max-w-sm"
          >
            <SheetHeader className="mb-2 text-left">
              <div className="flex items-center gap-2">
                <span className="glass flex h-10 w-10 items-center justify-center rounded-2xl p-2">
                  <CherryMark className="h-full w-full" />
                </span>
                <SheetTitle className="text-lg font-black tracking-tight">MaeLove</SheetTitle>
              </div>
            </SheetHeader>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
              <MenuLink to="/" icon={<Home className="h-4 w-4" />} label="Home" />
              <MenuLink to="/explore" icon={<Compass className="h-4 w-4" />} label="Explore" />
              <MenuLink to="/thrift" icon={<Shirt className="h-4 w-4" />} label="Thrifting" />

              <div className="my-2 border-t border-border" />

              <MenuLink to="/cart" icon={<ShoppingBag className="h-4 w-4" />} label="Your bag" />
              <MenuLink to="/wishlist" icon={<Heart className="h-4 w-4" />} label="Wishlist" />
              <MenuLink to="/orders" icon={<ClipboardList className="h-4 w-4" />} label="Orders" />
              <MenuLink to="/messages" icon={<MessageCircle className="h-4 w-4" />} label="Messages" />

              {profile?.is_seller && (
                <MenuLink to="/seller" icon={<Store className="h-4 w-4" />} label="Seller dashboard" />
              )}
              {profile?.is_delivery && (
                <MenuLink to="/delivery" icon={<Truck className="h-4 w-4" />} label="Delivery dashboard" />
              )}

              <div className="my-2 border-t border-border" />

              <MenuLink to="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />

              <button
                onClick={toggle}
                className="press flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold"
              >
                {dark ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
                {dark ? "Light mode" : "Dark mode"}
              </button>
              <SheetClose asChild>
                <button
                  onClick={() => setTimeout(openPicker, 150)}
                  className="press flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold"
                >
                  <Globe className="h-4 w-4 text-primary" />
                  Currency: {getDisplayCurrency()}
                </button>
              </SheetClose>
            </nav>

            <div className="mt-2 border-t border-border pt-3">
              {user ? (
                <SheetClose asChild>
                  <button
                    onClick={signOut}
                    className="press flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-muted-foreground"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </SheetClose>
              ) : (
                <SheetClose asChild>
                  <Link
                    to="/auth"
                    className="press flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Sign in
                  </Link>
                </SheetClose>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function MenuLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <SheetClose asChild>
      <Link to={to} className="press flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold">
        <span className="text-primary">{icon}</span>
        {label}
      </Link>
    </SheetClose>
  );
}

export default TopBar;