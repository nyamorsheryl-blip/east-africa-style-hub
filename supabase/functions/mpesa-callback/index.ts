import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Called by Safaricom, so it must stay public (verify_jwt: false).
// Safety comes from: only pending payments are accepted, the amount must match,
// and Safaricom is asked directly whether the payment really succeeded.

const MPESA_BASE_URL = "https://sandbox.safaricom.co.ke"; // production: https://api.safaricom.co.ke

const ack = () =>
  new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
    headers: { "Content-Type": "application/json" },
  });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function timestampNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return d.getFullYear().toString() + pad(d.getMonth() + 1) + pad(d.getDate()) +
    pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}

async function darajaVerdict(checkoutRequestId: string): Promise<"success" | "failed" | "unknown"> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const key = Deno.env.get("MPESA_CONSUMER_KEY")!;
      const secret = Deno.env.get("MPESA_CONSUMER_SECRET")!;
      const shortcode = Deno.env.get("MPESA_SHORTCODE")!;
      const passkey = Deno.env.get("MPESA_PASSKEY")!;
      const tokenRes = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${btoa(`${key}:${secret}`)}` },
      });
      if (tokenRes.ok) {
        const { access_token } = await tokenRes.json();
        const ts = timestampNow();
        const res = await fetch(`${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
          method: "POST",
          headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            BusinessShortCode: shortcode,
            Password: btoa(`${shortcode}${passkey}${ts}`),
            Timestamp: ts,
            CheckoutRequestID: checkoutRequestId,
          }),
        });
        const data = await res.json().catch(() => null);
        if (data && data.ResultCode !== undefined) {
          return String(data.ResultCode) === "0" ? "success" : "failed";
        }
      }
    } catch (e) {
      console.error("daraja query error:", e instanceof Error ? e.message : e);
    }
    await sleep(2000);
  }
  return "unknown";
}

Deno.serve(async (req: Request) => {
  try {
    const body = await req.json();
    const cb = body?.Body?.stkCallback;
    if (!cb?.CheckoutRequestID) return ack();

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const checkoutRequestId = String(cb.CheckoutRequestID);
    const resultCode = Number(cb.ResultCode);
    const resultDesc = String(cb.ResultDesc ?? "");

    // The callback can arrive before the payment row is saved: retry briefly.
    let payment: { id: string; order_id: string; status: string; mpesa_amount_kes: number | null } | null = null;
    for (let i = 0; i < 4 && !payment; i++) {
      const { data } = await admin
        .from("payments")
        .select("id, order_id, status, mpesa_amount_kes")
        .eq("checkout_request_id", checkoutRequestId)
        .maybeSingle();
      payment = data;
      if (!payment) await sleep(1000);
    }
    if (!payment) { console.warn("callback for unknown payment", checkoutRequestId); return ack(); }
    if (payment.status !== "pending") return ack(); // duplicate or late callback

    const now = new Date().toISOString();

    if (resultCode === 0) {
      const items: { Name: string; Value: unknown }[] = cb.CallbackMetadata?.Item ?? [];
      const getItem = (n: string) => items.find((i) => i.Name === n)?.Value;
      const receipt = getItem("MpesaReceiptNumber") as string | undefined;
      const paid = Number(getItem("Amount"));
      const expected = Number(payment.mpesa_amount_kes);

      if (!Number.isFinite(paid) || !Number.isFinite(expected) || paid < expected) {
        console.error(`AMOUNT MISMATCH payment=${payment.id} paid=${paid} expected=${expected} receipt=${receipt}`);
        await admin.from("payments")
          .update({ status: "failed", result_desc: `Amount mismatch (paid ${paid}, expected ${expected})`, updated_at: now })
          .eq("id", payment.id).eq("status", "pending");
        return ack();
      }

      if (Deno.env.get("MPESA_SKIP_VERIFY") !== "true") {
        const verdict = await darajaVerdict(checkoutRequestId);
        if (verdict !== "success") {
          console.error(`NOT CONFIRMED by Daraja (${verdict}) payment=${payment.id}; left pending`);
          return ack();
        }
      }

      const { data: claimed } = await admin.from("payments")
        .update({ status: "completed", mpesa_receipt_number: receipt ?? null, result_desc: resultDesc, updated_at: now })
        .eq("id", payment.id).eq("status", "pending").select("id");
      if (!claimed?.length) return ack();

      await admin.from("orders")
        .update({ payment_status: "paid", status: "processing" })
        .eq("id", payment.order_id);
    } else {
      const { data: claimed } = await admin.from("payments")
        .update({ status: resultCode === 1032 ? "cancelled" : "failed", result_desc: resultDesc, updated_at: now })
        .eq("id", payment.id).eq("status", "pending").select("id");
      if (claimed?.length) {
        await admin.from("orders")
          .update({ payment_status: "failed" })
          .eq("id", payment.order_id).neq("payment_status", "paid");
      }
    }
    return ack();
  } catch (err) {
    console.error("mpesa-callback error:", err instanceof Error ? err.message : err);
    return ack();
  }
});