import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MPESA_BASE_URL = "https://sandbox.safaricom.co.ke";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 9) return `254${digits}`;
  if (digits.startsWith("1") && digits.length === 9) return `254${digits}`;
  return null;
}

function timestampNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

/**
 * Orders created by the server-side place_order function are priced in KES
 * (total_cents is KES cents), so they are charged exactly as stored.
 *
 * Older orders were stored in USD cents regardless of their currency label,
 * so for those we still convert with a live USD->KES rate (falling back to a
 * fixed approximate rate if the lookup fails). The amount is always taken
 * from the order in the database, never from the client.
 */
const FALLBACK_USD_KES_RATE = 129;

async function getUsdToKesRate(): Promise<number> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) return FALLBACK_USD_KES_RATE;
    const data = await res.json();
    const rate = data?.rates?.KES;
    return typeof rate === "number" && rate > 0 ? rate : FALLBACK_USD_KES_RATE;
  } catch {
    return FALLBACK_USD_KES_RATE;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderId, phone } = await req.json();
    if (!orderId || !phone) {
      return new Response(JSON.stringify({ error: "orderId and phone are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedPhone = normalizePhone(String(phone));
    if (!normalizedPhone) {
      return new Response(JSON.stringify({ error: "Invalid phone number format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuthed = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabaseAuthed.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const buyerId = userData.user.id;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, buyer_id, total_cents, currency, payment_status")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (order.buyer_id !== buyerId) {
      return new Response(JSON.stringify({ error: "Order does not belong to this user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (order.payment_status === "paid") {
      return new Response(JSON.stringify({ error: "Order already paid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY")!;
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET")!;
    const shortcode = Deno.env.get("MPESA_SHORTCODE")!;
    const passkey = Deno.env.get("MPESA_PASSKEY")!;

    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authString}` },
    });
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Daraja OAuth failed: ${errText}`);
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const timestamp = timestampNow();
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    // KES orders (placed by place_order) are charged exactly as stored.
    // Legacy orders hold USD cents, so they are converted to whole KES.
    let kesAmount: number;
    if (order.currency === "KES") {
      kesAmount = Math.max(1, Math.round(order.total_cents / 100));
    } else {
      const usdAmount = order.total_cents / 100;
      const usdToKesRate = await getUsdToKesRate();
      kesAmount = Math.max(1, Math.round(usdAmount * usdToKesRate));
    }

    const callbackUrl = `${Deno.env.get("SUPABASE_URL")!.replace(".supabase.co", ".functions.supabase.co")}/mpesa-callback`;

    const stkRes = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: kesAmount,
        PartyA: normalizedPhone,
        PartyB: shortcode,
        PhoneNumber: normalizedPhone,
        CallBackURL: callbackUrl,
        AccountReference: order.id.slice(0, 12),
        TransactionDesc: "MaeLove order payment",
      }),
    });

    const stkData = await stkRes.json();

    if (!stkRes.ok || stkData.ResponseCode !== "0") {
      return new Response(
        JSON.stringify({ error: stkData.errorMessage || stkData.ResponseDescription || "STK push failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: insertErr } = await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      buyer_id: buyerId,
      amount_cents: order.total_cents,
      mpesa_amount_kes: kesAmount,
      phone: normalizedPhone,
      method: "mpesa",
      status: "pending",
      merchant_request_id: stkData.MerchantRequestID,
      checkout_request_id: stkData.CheckoutRequestID,
    });
    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({
        success: true,
        checkoutRequestId: stkData.CheckoutRequestID,
        customerMessage: stkData.CustomerMessage,
        kesAmount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
