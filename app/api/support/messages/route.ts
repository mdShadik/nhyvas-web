import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { ticketId?: string };
  const ticketId = typeof body?.ticketId === "string" ? body.ticketId.trim() : "";
  if (!ticketId) return jsonError("ticketId is required", 400);

  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const { data, error } = await supabase
    .from("support_ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}

