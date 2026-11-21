import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About - MaeLove" }, { name: "description", content: "MaeLove connects independent East African boutiques with shoppers everywhere." }] }),
  component: () => (
    <LegalPage
      title="About MaeLove"
      intro="MaeLove is a mobile-first marketplace that brings independent East African fashion boutiques and the people who love their work into one place."
      sections={[
        { heading: "What we do", body: [
          "We give boutiques, thrift stores and makers a simple way to open an online store, list products, take orders and get paid, and we give shoppers one place to discover them.",
          "MaeLove looks after the technology, discovery, payments and order tracking so sellers can focus on their craft and customers can shop with confidence.",
        ]},
        { heading: "For shoppers", body: [[
          "Browse boutique fashion, jewellery, shoes, accessories and thrift finds.",
          "Pay securely with M-Pesa.",
          "Track every order from payment to delivery.",
          "Read reviews from verified purchases.",
        ]]},
        { heading: "For sellers", body: [[
          "Open a boutique in minutes and manage products, orders and earnings in one dashboard.",
          "Every seller is reviewed and approved by MaeLove before they can sell.",
          "Reach customers beyond your neighbourhood.",
        ]]},
        { heading: "Contact", body: ["Email us at officialmaelove@gmail.com. We read every message."] },
      ]}
    />
  ),
});