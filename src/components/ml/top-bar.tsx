import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Heart, ShoppingBag, Store, ClipboardList, MessageCircle, Sun } from "lucide-react";
import { CherryMark } from "@/components/ml/cherry-mark";
import { useTheme } from "@/components/ml/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/**
 * Global top bar: cherry mark (left), page title (centre), animated
 * three-dot menu (right). Purely presentational — no data behaviour.
 */
export function TopBar({ title }: { title: string }) {
  const { dark, toggle } = useTheme();

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

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Menu"
            className="press glass group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 data-[state=open]:rotate-90 data-[state=open]:nav-glow"
          >
            <MoreHorizontal className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="glass-strong w-56 rounded-3xl border-0 p-2"
          >
            <MenuLink to="/cart" icon={<ShoppingBag className="h-4 w-4" />} label="Your bag" />
            <MenuLink to="/wishlist" icon={<Heart className="h-4 w-4" />} label="Wishlist" />
            <MenuLink to="/orders" icon={<ClipboardList className="h-4 w-4" />} label="Orders" />
            <MenuLink to="/messages" icon={<MessageCircle className="h-4 w-4" />} label="Messages" />
            <MenuLink to="/seller" icon={<Store className="h-4 w-4" />} label="Seller dashboard" />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={toggle}
              className="cursor-pointer rounded-2xl px-3 py-2.5 text-sm font-bold"
            >
              <Sun className="mr-2 h-4 w-4" />
              {dark ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function MenuLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <DropdownMenuItem asChild className="cursor-pointer rounded-2xl px-3 py-2.5 text-sm font-bold">
      <Link to={to}>
        <span className="mr-2 text-primary">{icon}</span>
        {label}
      </Link>
    </DropdownMenuItem>
  );
}

export default TopBar;
