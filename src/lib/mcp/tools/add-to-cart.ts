import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_to_cart",
  title: "Add to cart",
  description: "Add a product to the signed-in shopper's bag, or increase its quantity.",
  inputSchema: {
    product_id: z.string().uuid().describe("Product id to add."),
    quantity: z.number().int().min(1).max(99).optional().describe("Quantity (default 1)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ product_id, quantity }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const qty = quantity ?? 1;

    const { data: existing, error: readError } = await supabase
      .from("cart_items")
      .select("id,quantity")
      .eq("user_id", userId)
      .eq("product_id", product_id)
      .maybeSingle();
    if (readError) return { content: [{ type: "text", text: readError.message }], isError: true };

    const { data, error } = existing
      ? await supabase
          .from("cart_items")
          .update({ quantity: (existing.quantity ?? 0) + qty })
          .eq("id", existing.id)
          .select()
      : await supabase
          .from("cart_items")
          .insert({ user_id: userId, product_id, quantity: qty })
          .select();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data?.[0] ?? null) }],
      structuredContent: { item: data?.[0] ?? null },
    };
  },
});
