import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 px-4 pb-10 md:px-8">
      <div className="glass-dark mx-auto max-w-7xl rounded-3xl p-10 md:p-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-white font-display font-bold text-xl" style={{ background: "var(--gradient-hero)" }}>M</div>
              <span className="font-display text-2xl">MaeLove</span>
            </div>
            <p className="text-sm opacity-80">East Africa's boutique fashion marketplace. Handcrafted. Bold. Global.</p>
          </div>
          <div>
            <h4 className="font-display text-lg mb-3">Shop</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/shop">All products</Link></li>
              <li><Link to="/shop">New arrivals</Link></li>
              <li><Link to="/shop">Boutiques</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg mb-3">Sell</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/seller">Open a boutique</Link></li>
              <li><Link to="/seller">Seller dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg mb-3">Company</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>About</li>
              <li>Careers</li>
              <li>Contact</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 text-xs opacity-60">
          © {new Date().getFullYear()} MaeLove. Made with love across East Africa.
        </div>
      </div>
    </footer>
  );
}
