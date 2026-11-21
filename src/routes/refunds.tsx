import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/refunds")({
  head: () => ({ meta: [{ title: "Refunds and returns - MaeLove" }] }),
  component: () => (
    <LegalPage
      title="Refunds and returns"
      updated="21 November 2026"
      intro="We want you to love what you order. If something is not right, this is how returns, cancellations and refunds work."
      sections={[
        { heading: "Returns window", body: [
          "You can request a return within 7 days of your order being delivered.",
        ]},
        { heading: "What can be returned", body: [[
          "Items that arrive damaged, faulty, wrong, or not as described.",
          "Unworn, unused items in their original condition, unless marked as final sale.",
          "Final sale items, and items that are hygiene-sensitive or made to order, cannot be returned unless faulty.",
        ]]},
        { heading: "How to return an item", body: [[
          "Open Orders, choose the order and request a return.",
          "Tell us the reason and add clear photos if the item is damaged or wrong.",
          "We review requests and aim to reply within 2 business days. If approved, we will tell you how to send the item back.",
        ]]},
        { heading: "Refunds", body: [
          "Once a return is approved and the item is received, the refund is sent to the M-Pesa number used for the payment within 7 business days. The delivery fee is refunded when the return is due to our or the seller's error.",
        ]},
        { heading: "Cancelling an order", body: [
          "You can cancel before your order is dispatched by contacting us at officialmaelove@gmail.com with your order number. After dispatch, use the returns process once the item arrives.",
        ]},
        { heading: "Charged twice or charged without an order", body: [
          "Email us the M-Pesa receipt and order number. Confirmed duplicate payments are refunded in full.",
        ]},
        { heading: "Your legal rights", body: [
          "This policy does not limit your rights under Kenyan consumer protection law.",
        ]},
      ]}
    />
  ),
});