Rebuild MaeLove's mobile UI to match the four Figma screenshots (Home, Categories, Shop grid, Profile) using **Montserrat** as the single app font, keeping the current blush/plum/berry/lime palette and Lovable Cloud backend.

## Typography swap
- Replace Fraunces + Plus Jakarta Sans with **Montserrat** (weights 400/500/600/700/800/900) loaded via `<link>` in `src/routes/__root.tsx`.
- In `src/styles.css` set both `--font-display` and `--font-sans` to `"Montserrat"`. Keep headings using `font-black`/`font-extrabold` with tight tracking to match the bold Figma display look.

## Global mobile shell
- New `src/components/mobile-tab-bar.tsx`: fixed bottom glass pill with 5 tabs — Home, Shop, Bag, Saved, Profile. Active tab renders as a raised white circle with lime dot underneath (matches screenshots). Uses TanStack `Link` + `useRouterState` for active state.
- Retire the top `SiteHeader` on mobile routes; each screen gets its own compact top area (logo wordmark + search icon + avatar) matching the Figma.
- Wrap page content with bottom padding so the tab bar never overlaps.

## Screen 1 — Home (`src/routes/index.tsx`)
- Full-bleed hero carousel (3 slides) with overlaid "maelove" wordmark (white + pink "love"), floating search + avatar chips top-right, `NEW SEASON ARRIVALS` eyebrow, huge `Women's Edit` headline, white pill `Shop Now →` button, lime pagination dot.
- "Shop by Category" section on blush background: 2×2 grid of rounded plum-tinted image cards (Women, Men, Jewellery, Shoes) with `All →` link to `/shop`.
- "Featured Picks" horizontal scroller of product cards pulled from Supabase `products` (fallback to seeded demo data if empty), each with SALE/BESTSELLER/LUXURY chips.

## Screen 2 — Categories (part of Home / `/shop` header)
- Reuse the 2×2 category grid component; tapping a card navigates to `/shop?category=…`.

## Screen 3 — Shop grid (`src/routes/shop.tsx`)
- 2-column product card grid matching Figma: rounded image, heart button top-right, boutique name in berry uppercase, bold product title, color swatches row, price + berry pill `+ Add` button.
- Sale/Bestseller/Luxury badge chips top-left on image.
- Keep existing category filter chips but restyle to pill row above grid.

## Screen 4 — Profile (`src/routes/profile.tsx`, new)
- Header: avatar with lime status dot, name, email, berry `GOLD MEMBER ✦` pill.
- Glass stats card: Orders / Saved / Points (3 columns).
- "Recent Orders" list of glass cards (order #, product, date, status in berry, price). Pull from `orders` table for signed-in user; graceful empty state.
- Add `/profile` route + link from tab bar and header dropdown.

## Reusable components (new)
- `src/components/product-card.tsx` — Figma-styled card used on Home + Shop.
- `src/components/category-tile.tsx` — plum-tinted image tile with label.
- `src/components/hero-carousel.tsx` — swipeable hero with 3 slides + dots.
- `src/components/mobile-tab-bar.tsx` — bottom nav.

## Styling details
- Card radius bumped to `rounded-3xl` (28px) to match Figma.
- Category tiles use plum color overlay (`bg-plum/55 mix-blend-multiply`) on the image for that unified berry look.
- `+ Add` and `Shop Now` buttons: solid berry / solid white pills, font-bold Montserrat, no icons except trailing arrow.
- Keep liquid-glass utility for tab bar and stats card.

## Out of scope
- No backend schema changes; uses existing `products`, `orders`, `wishlist` tables.
- Desktop layout stays responsive but is optimized mobile-first (Figma is mobile).
- No new AI features or business logic.

## Files touched
- edit: `src/styles.css`, `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/shop.tsx`, `src/components/site-header.tsx` (hide on mobile / simplify)
- create: `src/routes/profile.tsx`, `src/components/mobile-tab-bar.tsx`, `src/components/product-card.tsx`, `src/components/category-tile.tsx`, `src/components/hero-carousel.tsx`
- assets: generate 4 category images + 3 hero slide images via imagegen (fashion-editorial style matching screenshots)
