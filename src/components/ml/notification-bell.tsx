import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  related_order_id: string | null;
  created_at: string;
};

export function NotificationBell({ userId }: { userId: string }) {
  const qc = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Notification[];
    },
  });

  // Live updates: new notifications push in without needing a refresh
  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", userId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, qc]);

  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  async function markAllRead() {
    if (!notifications || unread === 0) return;
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    await supabase.from("notifications").update({ read: true }).in("id", ids);
    qc.invalidateQueries({ queryKey: ["notifications", userId] });
  }

  async function markOneRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications", userId] });
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) markAllRead(); }}>
      <DropdownMenuTrigger className="relative rounded-full p-2 hover:bg-accent/25" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        {!notifications || notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : (
          <>
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => markOneRead(n.id)}
                className={`flex flex-col items-start gap-0.5 py-2.5 ${!n.read ? "bg-accent/20" : ""}`}
              >
                <span className="text-sm font-semibold">{n.title}</span>
                {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
                <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
