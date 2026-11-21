import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms and conditions - MaeLove" }] }),
  component: () => (
    <LegalPage
      title="Terms and conditions"
      updated="21 November 2026"
      intro="Please read these terms before using MaeLove. By creating an account or placing an order you agree to them."
      sections={[
        { heading: "1. Our role", body: [
          "MaeLove is an online marketplace. Products are sold by independent sellers. MaeLove provides the platform, collects payments, processes orders and provides customer support, but the seller is responsible for their products and listings.",
        ]},
        { heading: "2. Your account", body: [[
          "You must be 18 or older, or have a parent or guardian's permission.",
          "Give accurate information and keep your password safe. You are responsible for activity on your account.",
          "We may suspend or close accounts that break these terms, involve fraud or put others at risk.",
        ]]},
        { heading: "3. Orders and prices", body: [
          "Prices may be shown in your chosen display currency for convenience. Orders are charged in Kenyan Shillings (KES) at the rate shown at checkout.",
          "Stock is checked when you place an order. An order is confirmed only after your payment is confirmed.",
          "Delivery fees are shown separately before you pay.",
        ]},
        { heading: "4. Payments", body: [
          "We accept M-Pesa. Your order is marked paid only after M-Pesa confirms the payment to us. We never see or store your M-Pesa PIN.",
          "If you are charged but your order is not confirmed, email us the M-Pesa receipt and we will resolve it.",
        ]},
        { heading: "5. Delivery, returns and refunds", body: [
          "Delivery is covered by our Delivery policy and returns and refunds by our Refunds and returns policy. Both form part of these terms.",
        ]},
        { heading: "6. Seller and listing rules", body: [[
          "Sellers must describe products honestly and only list items they are allowed to sell.",
          "Counterfeit, stolen, illegal or unsafe goods are not allowed.",
          "Sellers agree to the Seller agreement before selling.",
        ]]},
        { heading: "7. Reviews and conduct", body: [[
          "Reviews must be honest and based on your own experience.",
          "Do not harass others, post unlawful content, scrape the site, or interfere with how MaeLove works.",
        ]]},
        { heading: "8. Content and intellectual property", body: [
          "MaeLove branding and software belong to MaeLove. Sellers keep ownership of their product photos and descriptions but give MaeLove permission to display them on the platform and in promotion of the marketplace.",
        ]},
        { heading: "9. Our responsibility", body: [
          "We take reasonable care to run MaeLove well, but we cannot promise it will always be uninterrupted or error-free. To the extent allowed by Kenyan law, our liability for any order is limited to the amount you paid for it. Nothing in these terms limits rights you have under Kenyan consumer protection law.",
        ]},
        { heading: "10. Changes", body: [
          "We may update these terms from time to time. The date at the top shows the latest version. Continuing to use MaeLove means you accept the updated terms.",
        ]},
        { heading: "11. Governing law", body: [
          "These terms are governed by the laws of Kenya and any dispute will be handled by the courts of Kenya.",
        ]},
        { heading: "12. Contact", body: ["officialmaelove@gmail.com"] },
      ]}
    />
  ),
});