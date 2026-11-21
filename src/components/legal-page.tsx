import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export type LegalSection = { heading: string; body: (string | string[])[] };

const LINKS: [string, string][] = [
  ["About", "/about"], ["Help", "/help"], ["Terms", "/terms"], ["Privacy", "/privacy"],
  ["Refunds & returns", "/refunds"], ["Delivery", "/delivery-policy"], ["Seller agreement", "/seller-agreement"],
];

export function LegalPage({ title, updated, intro, sections = [], children }: {
  title: string; updated?: string; intro?: string; sections?: LegalSection[]; children?: ReactNode;
}) {
  return (
    <div className="min-h-screen px-5 pt-8 pb-24">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-plum">
          <ArrowLeft className="h-3 w-3" /> Back to MaeLove
        </Link>
        <h1 className="mt-3 font-display text-3xl font-black">{title}</h1>
        {updated && <p className="mt-1 text-xs text-muted-foreground">Last updated {updated}</p>}
        {intro && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{intro}</p>}
        <div className="glass mt-6 space-y-6 rounded-3xl p-6">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-lg font-extrabold">{s.heading}</h2>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {s.body.map((b, i) =>
                  Array.isArray(b) ? (
                    <ul key={i} className="list-disc space-y-1 pl-5">
                      {b.map((li) => <li key={li}>{li}</li>)}
                    </ul>
                  ) : (
                    <p key={i}>{b}</p>
                  ),
                )}
              </div>
            </section>
          ))}
          {children}
        </div>
        <nav className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} className="underline underline-offset-4 hover:text-plum">{label}</a>
          ))}
        </nav>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">Questions? Email officialmaelove@gmail.com</p>
      </div>
    </div>
  );
}