import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

function resolveMessageType(body: string, imageUrl: string | null): "text" | "image" {
  if (imageUrl && !body.trim()) return "image";
  return "text";
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | {
    subject?: string;
    description?: string;
    imageUrl?: string | null;
  };

  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : null;

  if (!subject) return jsonError("Subject is required.", 400);
  if (!description && !imageUrl) return jsonError("Please add a message or image for the ticket.", 400);

  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonError("You need to be logged in.", 401);
  const userId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!userId) return jsonError("You need to be logged in.", 401);

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .insert({ user_id: userId, subject, status: "open", priority: "normal" })
    .select("*")
    .single();
  if (ticketError) return jsonError(ticketError.message, 400);

  const { error: messageError } = await supabase.from("support_ticket_messages").insert({
    ticket_id: (ticket as any).id,
    sender_id: userId,
    sender_role: "user",
    message_type: resolveMessageType(description, imageUrl),
    body: description,
    image_url: imageUrl,
  });
  if (messageError) return jsonError(messageError.message, 400);

  return jsonOk({ ticket });
}

