import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const body = await req.json().catch(() => null);
  console.log("B2C RESULT:", JSON.stringify(body));

  const r = body?.Result;
  if (r?.OriginatorConversationID) {
    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { error } = await db
      .from("payouts")
      .update({
        status: r.ResultCode === 0 ? "completed" : "failed",
        result_code: r.ResultCode,
        result_desc: r.ResultDesc,
        transaction_id: r.TransactionID ?? null,
      })
      .eq("originator_conversation_id", r.OriginatorConversationID);
    if (error) console.error("payout update failed:", error.message);
  }

  return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
    headers: { "Content-Type": "application/json" },
  });
});
