import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/delivery-policy")({
  head: () => ({ meta: [{ title: "Delivery policy - MaeLove" }] }),
  component: () => (
    <LegalPage
      title="Delivery policy"
      updated="21 November 2026"
      intro="How your order gets from the seller to you."
      sections={[
        { heading: "Delivery options and fees", body: [
          "At checkout you choose a delivery option. The delivery fee is shown separately from the product price, and you see the final total before you pay. Available options depend on where you are.",
        ]},
        { heading: "How an order moves", body: [[
          "Paid: your payment is confirmed.",
          "Processing: the seller prepares your order.",
          "Ready for dispatch and Shipped: your order is handed to delivery.",
          "Delivered: your order arrives.",
        ]]},
        { heading: "Tracking", body: [
          "Follow your order on the Orders page. You also receive notifications as the status changes.",
        ]},
        { heading: "Delivery times", body: [
          "Estimated delivery times are shown with each delivery option. They are estimates, not guarantees, and can be affected by weather, traffic or the courier.",
        ]},
        { heading: "Your details", body: [
          "Please give a complete address and a phone number that you will answer. Riders may call you to find you.",
        ]},
        { heading: "Missed or failed deliveries", body: [
          "If delivery fails because no one could be reached, we will try to contact you to arrange another attempt. Repeated failed attempts may lead to the order being returned to the seller.",
        ]},
        { heading: "Damaged on arrival", body: [
          "Please check your order when it arrives and report any damage within 48 hours through Orders or by email so we can sort it out quickly.",
        ]},
      ]}
    />
  ),
});