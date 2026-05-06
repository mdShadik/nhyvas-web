import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

function resolveMessageType(body: string, imageUrl: string | null): "text" | "image" {
  if (imageUrl && !body.trim()) return "image";
  return "text";
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | {
    ticketId?: string;
    message?: string;
    imageUrl?: string | null;
  };

  const ticketId = typeof body?.ticketId === "string" ? body.ticketId.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : null;

  if (!ticketId) return jsonError("ticketId is required", 400);
  if (!message && !imageUrl) return jsonError("Please type a message or attach an image.", 400);

  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonError("You need to be logged in.", 401);
  const userId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!userId) return jsonError("You need to be logged in.", 401);

  const { data, error } = await supabase
    .from("support_ticket_messages")
    .insert({
      ticket_id: ticketId,
      sender_id: userId,
      sender_role: "user",
      message_type: resolveMessageType(message, imageUrl),
      body: message,
      image_url: imageUrl,
    })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 400);
  return jsonOk({ row: data });
}

