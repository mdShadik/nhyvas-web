import { requestJson } from "@/services/apiService/http";

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
  imageUri?: string | null;
};

type SendTicketMessageInput = {
  ticketId: string;
  body: string;
  imageUri?: string | null;
};

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
    if (!description && !input.imageUri) {
      throw new Error("Please add a message or image for the ticket.");
    }
    const imageUrl =
      input.imageUri && (input.imageUri.startsWith("http://") || input.imageUri.startsWith("https://"))
        ? input.imageUri
        : null;
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

    if (!body && !input.imageUri) {
      throw new Error("Please type a message or attach an image.");
    }
    const imageUrl =
      input.imageUri && (input.imageUri.startsWith("http://") || input.imageUri.startsWith("https://"))
        ? input.imageUri
        : null;
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
