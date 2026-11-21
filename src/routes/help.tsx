import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

const FAQ: { q: string; a: string }[] = [
  { q: "How do I place an order?", a: "Add items to your bag, open your bag, choose a delivery option, enter your delivery details and pay with M-Pesa." },
  { q: "How does M-Pesa payment work?", a: "After you confirm, you will get an M-Pesa prompt on your phone. Enter your M-Pesa PIN and your order is confirmed automatically within seconds. MaeLove never sees your PIN." },
  { q: "I paid but my order still shows unpaid.", a: "Wait a minute and refresh your Orders page. If it is still unpaid, email us your order number and the M-Pesa receipt message and we will fix it." },
  { q: "Can I use a coupon?", a: "Yes. Enter the code in your bag. A coupon applies to items from the seller who issued it." },
  { q: "How do I track my order?", a: "Open Orders to see the status of each order. You also get notifications as it is processed, dispatched and delivered." },
  { q: "How do I return an item?", a: "Open Orders, choose the order and request a return. See our Refunds and returns page for details." },
  { q: "Can I see prices in another currency?", a: "Yes, use the currency selector to view prices in your preferred currency. Payments are always charged in Kenyan Shillings (KES) at the rate shown at checkout." },
  { q: "I forgot my password.", a: "On the sign in page tap Forgot password and follow the email we send you." },
  { q: "How do I become a seller?", a: "Create an account, choose Open a boutique and complete the onboarding. MaeLove reviews and approves new sellers before they can sell." },
  { q: "How do I deliver and earn?", a: "Choose Deliver and Earn after signing up and complete the delivery partner onboarding." },
  { q: "How do I report a problem with a seller or product?", a: "Email officialmaelove@gmail.com with the order number or a link to the product and we will investigate." },
];

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help and support - MaeLove" }] }),
  component: () => (
    <LegalPage
      title="Help and support"
      intro="Quick answers below. If you cannot find what you need, email officialmaelove@gmail.com and include your order number if you have one. We aim to reply within 2 business days."
    >
      <div>
        {FAQ.map((f) => (
          <details key={f.q} className="border-b border-white/40 py-3 last:border-0">
            <summary className="cursor-pointer text-sm font-semibold">{f.q}</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </LegalPage>
  ),
});