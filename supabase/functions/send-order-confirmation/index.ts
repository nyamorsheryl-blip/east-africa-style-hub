import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const record = payload.record; // Supabase webhook wraps the inserted row here

    if (!record) {
      return new Response(JSON.stringify({ error: "No record in payload" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const { user_id, title, body } = record;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: userRes } = await supabase.auth.admin.getUserById(user_id);
    const email = userRes?.user?.email;
    if (!email) throw new Error("User email not found");

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; color: #2C221E;">
        <h2>${title}</h2>
        <p>${body ?? ""}</p>
        <p style="color:#7A6F63; font-size:13px; margin-top:16px;">— MaeLove</p>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MaeLove <onboarding@resend.dev>",
        to: email,
        subject: title,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      throw new Error(`Resend error: ${errText}`);
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});