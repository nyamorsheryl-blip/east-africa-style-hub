import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useCart } from "@/lib/cart";
import { Heart, ShoppingBag, Search, User, LogOut, Store, Sparkles } from "lucide-react";
import { useState } from "react";
import { CherryMark } from "@/components/ml/cherry-mark";
import { ThemeToggle } from "@/components/ml/theme-toggle";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { user } = useSession();
  const { count } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-4 z-50 mx-4 md:mx-8">
      <div className="glass mx-auto flex max-w-7xl items-center gap-3 rounded-full px-4 py-2.5 md:gap-6 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl p-1.5" style={{ background: "color-mix(in oklab, var(--vanilla) 70%, transparent)" }}>
            <CherryMark className="h-full w-full" />
          </span>
          <span className="font-display text-xl font-semibold hidden sm:inline">MaeLove</span>
        </Link>

        <form
          onSubmit={(e) => { e.preventDefault(); navigate({ to: "/shop", search: { q: q || undefined } as never }); }}
          className="hidden md:flex flex-1 items-center gap-2 rounded-full bg-card/60 px-4 py-1.5 border border-border"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search kitenge dresses, jewellery, boutiques…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </form>

        <Link to="/shop" className="hidden md:inline text-sm font-medium hover:text-primary">Shop</Link>

        <ThemeToggle />

        <Link to="/wishlist" className="rounded-full p-2 hover:bg-accent/25" aria-label="Wishlist">
          <Heart className="h-5 w-5" />
        </Link>

        <Link to="/cart" className="relative rounded-full p-2 hover:bg-accent/25" aria-label="Cart">
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{count}</span>
          )}
        </Link>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full p-2 hover:bg-accent/25"><User className="h-5 w-5" /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild><Link to="/seller"><Store className="h-4 w-4 mr-2" />Seller dashboard</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/orders">My orders</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Sparkles className="h-3.5 w-3.5" /> Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
