import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";

export function useWishlist() {
  const { user } = useSession();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["wishlist-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlist").select("product_id").eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.product_id as string));
    },
  });

  const ids = data ?? new Set<string>();

  async function toggle(productId: string) {
    if (!user) { toast.error("Sign in to save favourites"); return; }
    if (ids.has(productId)) {
      const { error } = await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId);
      if (error) return toast.error(error.message);
      toast.success("Removed from wishlist");
    } else {
      const { error } = await supabase.from("wishlist").insert({ user_id: user.id, product_id: productId });
      if (error && !error.message.includes("duplicate")) return toast.error(error.message);
      toast.success("Saved to wishlist");
    }
    qc.invalidateQueries({ queryKey: ["wishlist-ids", user.id] });
    qc.invalidateQueries({ queryKey: ["wishlist", user.id] });
  }

  return { isSaved: (id: string) => ids.has(id), toggle };
}
