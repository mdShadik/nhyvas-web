import { getCurrentUserId } from "@/services/apiService/auth";
import { requestJson } from "@/services/apiService/http";
import { uploadToR2 } from "@/services/apiService/media";

export type SupportTicketStatus = "open" | "closed";

export type SupportTicket = {
  id: string;
  ticket_no: number;
  user_id: string;
  subject: string;
  status: SupportTicketStatus;
  priority: "low" | "normal" | "high" | "urgent";
  last_message_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SupportTicketMessage = {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  sender_role: "user" | "admin" | "system";
  message_type: "text" | "image";
  body: string;
  image_url: string | null;
  created_at: string;
};

type CreateTicketInput = {
  subject: string;
  description: string;
  /** Prefer `imageFile` in the browser — remote URLs still supported */
  imageUri?: string | null;
  imageFile?: File | null;
};

type SendTicketMessageInput = {
  ticketId: string;
  body: string;
  imageUri?: string | null;
  imageFile?: File | null;
};

async function resolveSupportImageUrl(
  imageUri: string | undefined | null,
  imageFile: File | null | undefined
): Promise<string | null> {
  if (imageFile && imageFile.size > 0) {
    const userId = await getCurrentUserId();
    const { publicUrl } = await uploadToR2({
      file: imageFile,
      folder: "support",
      userId: userId ?? undefined,
    });
    return publicUrl;
  }
  if (imageUri && (imageUri.startsWith("http://") || imageUri.startsWith("https://"))) return imageUri;
  return null;
}

export const supportService = {
  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    const { row } = await requestJson<{ row: SupportTicket | null }>("/api/support/ticket", {
      method: "POST",
      body: JSON.stringify({ ticketId }),
    });
    return row ?? null;
  },

  async listMyTickets(status: SupportTicketStatus): Promise<SupportTicket[]> {
    const { rows } = await requestJson<{ rows: SupportTicket[] }>("/api/support/my-tickets", {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    return rows ?? [];
  },

  async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
    const subject = input.subject.trim();
    const description = input.description.trim();

    if (!subject) throw new Error("Subject is required.");
    if (!description && !input.imageUri && !(input.imageFile && input.imageFile.size > 0)) {
      throw new Error("Please add a message or image for the ticket.");
    }
    const imageUrl = await resolveSupportImageUrl(input.imageUri ?? null, input.imageFile ?? null);
    const { ticket } = await requestJson<{ ticket: SupportTicket }>("/api/support/create-ticket", {
      method: "POST",
      body: JSON.stringify({ subject, description, imageUrl }),
    });
    return ticket;
  },

  async getTicketMessages(ticketId: string): Promise<SupportTicketMessage[]> {
    const { rows } = await requestJson<{ rows: SupportTicketMessage[] }>("/api/support/messages", {
      method: "POST",
      body: JSON.stringify({ ticketId }),
    });
    return rows ?? [];
  },

  async sendTicketMessage(input: SendTicketMessageInput): Promise<SupportTicketMessage> {
    const body = input.body.trim();

    if (!body && !(input.imageFile && input.imageFile.size > 0) && !input.imageUri) {
      throw new Error("Please type a message or attach an image.");
    }
    const imageUrl = await resolveSupportImageUrl(input.imageUri ?? null, input.imageFile ?? null);
    const { row } = await requestJson<{ row: SupportTicketMessage }>("/api/support/send-message", {
      method: "POST",
      body: JSON.stringify({ ticketId: input.ticketId, message: body, imageUrl }),
    });
    return row;
  },

  async closeTicket(ticketId: string): Promise<void> {
    await requestJson("/api/support/close-ticket", { method: "POST", body: JSON.stringify({ ticketId }) });
  },
};
