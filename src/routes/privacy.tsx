import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { TopBar } from "@/components/ml/top-bar";
import { BottomNav } from "@/components/ml/bottom-nav";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — MaeLove" },
      { name: "description", content: "How MaeLove collects, uses, and protects your personal information." },
    ],
  }),
  component: PrivacyPolicy,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-[16px] font-black tracking-tight">{title}</h2>
      <div className="mt-2 space-y-3 text-[13px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPolicy() {
  return (
    <div className="page-enter min-h-screen pb-32">
      <TopBar title="Privacy Policy" />

      <div className="mx-auto max-w-3xl px-5 pt-6">
        <h1 className="text-[27px] font-black leading-[1.1] tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-[12px] font-bold text-muted-foreground">Last updated: September 2026</p>

        <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground">
          MaeLove ("we", "us", "our") operates a marketplace connecting independent East African fashion
          boutiques with buyers. This policy explains what personal information we collect, how we use it,
          who we share it with, and the choices you have.
        </p>

        <Section title="1. Information we collect">
          <p><strong className="font-black text-foreground">Account information:</strong> name, email address, phone number, and profile details you provide when you sign up as a buyer, boutique seller, or delivery agent.</p>
          <p><strong className="font-black text-foreground">Transaction information:</strong> orders, cart contents, wishlist items, delivery addresses, and payment confirmation details (we do not store full card numbers — these are handled by our payment processor).</p>
          <p><strong className="font-black text-foreground">Content you provide:</strong> product reviews, ratings, messages to sellers, and any images or descriptions boutiques upload.</p>
          <p><strong className="font-black text-foreground">Location & device information:</strong> approximate location (derived from your IP address) used to show local currency and delivery estimates, plus basic device and browser information for security and performance.</p>
          <p><strong className="font-black text-foreground">Cookies & similar technologies:</strong> see Section 4 below.</p>
        </Section>

        <Section title="2. How we use your information">
          <ul className="list-disc space-y-2 pl-5">
            <li>To create and manage your account, and to process orders, payments, and deliveries.</li>
            <li>To verify sellers and delivery agents before they can operate on the platform.</li>
            <li>To send transactional emails — order confirmations, delivery updates, and account notifications.</li>
            <li>To detect your approximate location so prices and delivery estimates display in your local currency.</li>
            <li>To show you relevant products, maintain your wishlist and cart across devices, and improve search and filtering.</li>
            <li>To investigate fraud, enforce our terms, and keep the platform safe for buyers and sellers.</li>
          </ul>
        </Section>

        <Section title="3. Who we share information with">
          <p>We do not sell your personal information. We share it only where necessary to operate MaeLove:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="font-black text-foreground">Boutique sellers</strong> — see your name, delivery address, and order details needed to fulfil your purchase.</li>
            <li><strong className="font-black text-foreground">Delivery agents</strong> — see the delivery address and contact details needed to complete delivery.</li>
            <li><strong className="font-black text-foreground">Service providers</strong> we use to run the platform, including our database and authentication provider (Supabase), our transactional email provider (Resend), and geolocation/currency lookup services used to detect your approximate region.</li>
            <li><strong className="font-black text-foreground">Legal & safety</strong> — where required by law, or to protect the rights, property, or safety of MaeLove, our users, or the public.</li>
          </ul>
        </Section>

        <Section title="4. Cookies & similar technologies">
          <p>We use cookies and local storage to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Keep you signed in between visits.</li>
            <li>Remember your cart and wishlist if you're browsing as a guest.</li>
            <li>Remember your appearance preference (light/dark) and cookie choice itself.</li>
            <li>Understand basic usage patterns so we can improve the platform.</li>
          </ul>
          <p>You can choose "Necessary only" in the cookie banner to limit non-essential cookies, or clear cookies at any time through your browser settings. Blocking essential cookies may prevent sign-in and cart features from working correctly.</p>
        </Section>

        <Section title="5. International data transfers">
          <p>
            MaeLove serves buyers and sellers across multiple countries. Your information may be processed
            or stored on servers located outside your home country, including by service providers based
            outside East Africa. Where this happens, we take steps intended to keep your information
            protected consistent with this policy.
          </p>
        </Section>

        <Section title="6. Data retention">
          <p>
            We retain account and order information for as long as your account is active, and for a
            reasonable period afterward to meet legal, accounting, tax, and fraud-prevention obligations.
            You can request deletion of your account at any time in Settings, or by contacting us directly.
          </p>
        </Section>

        <Section title="7. Your rights">
          <p>Depending on where you live, you may have the right to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Access the personal information we hold about you.</li>
            <li>Correct inaccurate information, most of which you can edit directly in your account settings.</li>
            <li>Request deletion of your account and associated personal information.</li>
            <li>Object to or restrict certain uses of your information.</li>
            <li>Withdraw consent where processing is based on consent (such as non-essential cookies).</li>
          </ul>
          <p>To exercise any of these rights, contact us using the details in Section 10.</p>
        </Section>

        <Section title="8. Children's privacy">
          <p>
            MaeLove is not directed at children, and we do not knowingly collect personal information from
            anyone under the age of 18. If you believe a child has provided us with personal information,
            please contact us so we can remove it.
          </p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>
            We may update this policy from time to time as MaeLove grows and changes. We'll update the
            "Last updated" date above, and where changes are significant, we'll take reasonable steps to
            notify you directly.
          </p>
        </Section>

        <Section title="10. Contact us">
          <p>
                        Questions about this policy or your personal information can be sent to{" "}
            <span className="font-bold text-primary">officialmaelove@gmail.com</span>.
          </p>
        </Section>

        <div className="mt-10 border-t border-border pt-6">
          <Link to="/" className="press inline-flex items-center text-[12px] font-extrabold text-primary">
            Back to MaeLove
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}