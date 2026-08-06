import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description: "Search published MaeLove products by keyword, category, and price range.",
  inputSchema: {
    query: z.string().trim().optional().describe("Keyword matched against product title."),
    category: z.string().trim().optional().describe("Category slug, e.g. women, men, shoes, jewellery."),
    max_price_cents: z.number().int().positive().optional().describe("Only return products at or below this price."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, max_price_cents, limit }, ctx) => {
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("products")
      .select("id,title,category,price_cents,sale_price_cents,currency,stock,images,boutique_id")
      .eq("published", true)
      .limit(limit ?? 20);
    if (query) q = q.ilike("title", `%${query}%`);
    if (category) q = q.eq("category", category);
    if (max_price_cents) q = q.lte("price_cents", max_price_cents);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
