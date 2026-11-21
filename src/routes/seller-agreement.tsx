import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/seller-agreement")({
  head: () => ({ meta: [{ title: "Seller agreement - MaeLove" }] }),
  component: () => (
    <LegalPage
      title="Seller agreement"
      updated="21 November 2026"
      intro="This agreement applies to everyone who sells on MaeLove. By opening a boutique you accept it."
      sections={[
        { heading: "1. Approval", body: [
          "New sellers are reviewed by MaeLove before they can sell. We may ask for identity and business details, and we may refuse, suspend or remove sellers at our discretion where these terms or the law are breached.",
        ]},
        { heading: "2. Your listings", body: [[
          "Describe products honestly, with accurate photos, prices, sizes and stock.",
          "Only list items you are legally allowed to sell. Counterfeit, stolen, illegal or unsafe goods are prohibited.",
          "Keep stock up to date and fulfil confirmed orders promptly.",
        ]]},
        { heading: "3. Commission", body: [
          "MaeLove charges a commission on each sale, based on the product category:",
          [
            "Men's, women's, shoes, home, handmade, sports and other: 10%",
            "Bags and accessories, and beauty: 12%",
            "Food, books and stationery: 8%",
            "Electronics: 5%",
          ],
          "Commission is calculated on the item price after any seller coupon is applied. The delivery fee is charged separately and is not part of your commission. The rate that applies to an order is fixed when the order is placed, finalised when the order is completed, and reversed if the order is refunded or cancelled.",
          "New sellers may receive a reduced introductory rate for an initial period. Current rates are shown in your seller dashboard and we will give notice of changes.",
        ]},
        { heading: "4. Payouts", body: [
          "Your earnings are your sales minus commission. They are paid to your registered M-Pesa number after the order is delivered and its return window has closed. You can see your earnings and payout status in your dashboard.",
        ]},
        { heading: "5. Orders, returns and refunds", body: [
          "You must prepare orders promptly and handle returns according to MaeLove's Refunds and returns policy. If a refund is due, it may be deducted from your earnings.",
        ]},
        { heading: "6. Customer data", body: [
          "You may use customer details only to fulfil the order and must protect them in line with Kenyan data protection law. Do not use them for marketing or share them with anyone else.",
        ]},
        { heading: "7. Suspension and ending", body: [
          "You can close your boutique at any time after completing open orders. We may suspend a boutique and hide its listings where there is suspected fraud, repeated complaints or a breach of this agreement.",
        ]},
        { heading: "8. Liability", body: [
          "You are responsible for the products you sell. To the extent allowed by Kenyan law, MaeLove is not liable for losses caused by your products or listings.",
        ]},
        { heading: "9. Governing law", body: [
          "This agreement is governed by the laws of Kenya and any dispute will be handled by the courts of Kenya.",
        ]},
      ]}
    />
  ),
});