import { supabase } from "@/integrations/supabase/client";

export type ActivityAction =
  | "login"
  | "logout"
  | "signup"
  | "page_view"
  | "chat_message"
  | "password_reset";

export async function logActivity(
  action: ActivityAction,
  details: Record<string, unknown> = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      user_email: user.email ?? "",
      action,
      details,
    } as any);
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
