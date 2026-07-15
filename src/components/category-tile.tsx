import { Link } from "@tanstack/react-router";

export function CategoryTile({
  label,
  image,
  category,
}: {
  label: string;
  image: string;
  category?: string;
}) {
  return (
    <Link
      to="/shop"
      search={category ? ({ category } as never) : ({} as never)}
      className="relative block aspect-square overflow-hidden rounded-3xl shadow-[var(--shadow-soft)]"
    >
      <img
        src={image}
        alt={label}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--plum) 20%, transparent) 0%, color-mix(in oklab, var(--berry) 65%, transparent) 100%)",
          mixBlendMode: "multiply",
        }}
      />
      <div className="absolute inset-0 bg-plum/25" />
      <span className="absolute bottom-4 left-5 text-white font-extrabold text-2xl tracking-tight">
        {label}
      </span>
    </Link>
  );
}
