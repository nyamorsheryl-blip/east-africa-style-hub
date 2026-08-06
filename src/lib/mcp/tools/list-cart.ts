import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_cart",
  title: "List cart",
  description: "List the signed-in shopper's bag, with quantities and a total.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("cart_items")
      .select("id,quantity,products(id,title,price_cents,sale_price_cents,currency,stock,published)")
      .eq("user_id", ctx.getUserId());
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const items = data ?? [];
    const total_cents = items.reduce((sum: number, row: { quantity?: number; products?: unknown }) => {
      const p = row.products as { price_cents?: number; sale_price_cents?: number | null } | null;
      const unit = p?.sale_price_cents ?? p?.price_cents ?? 0;
      return sum + unit * (row.quantity ?? 0);
    }, 0);

    return {
      content: [{ type: "text", text: JSON.stringify({ items, total_cents }) }],
      structuredContent: { items, total_cents },
    };
  },
});
