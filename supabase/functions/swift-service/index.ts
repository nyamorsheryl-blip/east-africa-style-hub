import { createClient } from "npm:@supabase/supabase-js@2";

const BASE = "https://sandbox.safaricom.co.ke";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-test-key",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Who is calling? Either the test key (sandbox only) or a signed-in admin.
  let initiatedBy: string | null = null;
  const testKey = Deno.env.get("B2C_TEST_KEY");
  if (testKey && req.headers.get("x-test-key") === testKey) {
    // sandbox test path
  } else {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data } = await db.auth.getUser(token);
    if (!data?.user) return json({ error: "Not signed in" }, 401);
    const { data: isAdmin } = await db.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Admins only" }, 403);
    initiatedBy = data.user.id;
  }

  // 2. Read and check the request
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone ?? "");
  const amount = Math.round(Number(body.amount_kes ?? body.amount));
  if (!/^254[17]\d{8}$/.test(phone)) {
    return json({ error: "phone must look like 254712345678" }, 400);
  }
  if (!Number.isFinite(amount) || amount < 1 || amount > 150000) {
    return json({ error: "amount must be between 1 and 150000 KES" }, 400);
  }

  // 3. Record the payout BEFORE sending money
  const { data: payout, error: insErr } = await db
    .from("payouts")
    .insert({
      boutique_id: body.boutique_id ?? null,
      recipient_phone: phone,
      amount_kes: amount,
      reason: body.reason ?? null,
      initiated_by: initiatedBy,
      status: "pending",
    })
    .select("id")
    .single();
  if (insErr) return json({ step: "record", error: insErr.message }, 500);

  const fail = async (desc: string) => {
    await db.from("payouts").update({ status: "failed", result_desc: desc }).eq("id", payout.id);
  };

  // 4. Get a Safaricom access token
  const basic = btoa(
    `${Deno.env.get("MPESA_CONSUMER_KEY")}:${Deno.env.get("MPESA_CONSUMER_SECRET")}`
  );
  const tokenRes = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${basic}` },
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenData.access_token) {
    await fail("Could not get Safaricom access token");
    return json({ step: "token", tokenData }, 500);
  }

  // 5. Send the payout request
  const resultUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-b2c-result`;
  const payRes = await fetch(`${BASE}/mpesa/b2c/v1/paymentrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      InitiatorName: Deno.env.get("MPESA_B2C_INITIATOR_NAME"),
      SecurityCredential: Deno.env.get("MPESA_B2C_SECURITY_CREDENTIAL"),
      CommandID: "BusinessPayment",
      Amount: amount,
      PartyA: Deno.env.get("MPESA_B2C_SHORTCODE"),
      PartyB: phone,
      Remarks: "MaeLove payout",
      QueueTimeOutURL: resultUrl,
      ResultURL: resultUrl,
      Occasion: "Payout",
    }),
  });
  const payData = await payRes.json().catch(() => ({}));

  // 6. Save what Safaricom said
  if (String(payData.ResponseCode) === "0") {
    await db
      .from("payouts")
      .update({
        status: "processing",
        conversation_id: payData.ConversationID,
        originator_conversation_id: payData.OriginatorConversationID,
      })
      .eq("id", payout.id);
    return json({ payout_id: payout.id, ...payData });
  }

  await fail(payData.errorMessage ?? payData.ResponseDescription ?? "Safaricom rejected the request");
  return json({ payout_id: payout.id, ...payData }, 502);
});
