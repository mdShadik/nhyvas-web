import { requestJson } from "@/services/apiService/http";

export type ChatRoomSummary = {
  room_id: string;
  listing_id: string;
  property_title: string | null;
  property_thumbnail: string | null;
  tenant_id: string;
  landlord_id: string;
  room_created_at: string;
  updated_at: string;
  last_message_id: string | null;
  last_message_content: string | null;
  last_message_type: string | null;
  last_message_created_at: string | null;
  last_message_sender_id: string | null;
  last_message_is_read: boolean | null;
  counterparty?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

type ChatRoomRpcRow = Omit<ChatRoomSummary, "counterparty"> & {
  counterparty_id: string | null;
  counterparty_full_name: string | null;
  counterparty_avatar_url: string | null;
};

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string | null;
  content: string;
  message_type: 'text' | 'system' | 'image';
  is_read: boolean;
  created_at: string;
};

export type ChatMessagesPage = {
  messages: ChatMessage[];
  hasMore: boolean;
};

export const chatService = {
  async getChatRooms(): Promise<ChatRoomSummary[]> {
    const { rows } = await requestJson<{ rows: any[] }>("/api/chat/rooms", { method: "POST" });
    return (rows ?? []).map((row: any) => {
      const r = row as ChatRoomRpcRow;
      return {
        ...r,
        counterparty: r.counterparty_id
          ? {
              id: r.counterparty_id,
              full_name: r.counterparty_full_name,
              avatar_url: r.counterparty_avatar_url,
            }
          : undefined,
      } satisfies ChatRoomSummary;
    });
  },

  async getChatMessages(roomId: string): Promise<ChatMessage[]> {
    const { rows } = await requestJson<{ rows: ChatMessage[] }>("/api/chat/messages", {
      method: "POST",
      body: JSON.stringify({ roomId }),
    });
    return rows ?? [];
  },

  async getChatMessagesPage(
    roomId: string,
    page: number,
    pageSize = 10
  ): Promise<ChatMessagesPage> {
    const { rows, pageSize: usedPageSize } = await requestJson<{ rows: ChatMessage[]; pageSize: number }>(
      "/api/chat/messages-page",
      { method: "POST", body: JSON.stringify({ roomId, page, pageSize }) }
    );
    const messages = (rows ?? []) as ChatMessage[];

    return {
      messages,
      hasMore: messages.length === (usedPageSize ?? pageSize),
    };
  },

  async sendMessage(
    roomId: string,
    senderId: string,
    content: string,
    type: 'text' | 'system' | 'image' = 'text'
  ): Promise<ChatMessage> {
    void senderId;
    const { row } = await requestJson<{ row: ChatMessage }>("/api/chat/send", {
      method: "POST",
      body: JSON.stringify({ roomId, content, type }),
    });
    return row;
  },

  async createRoom(listingId: string, otherUserId: string, _legacyLandlordId?: string): Promise<string> {
    const { roomId } = await requestJson<{ roomId: string }>("/api/chat/create-room", {
      method: "POST",
      body: JSON.stringify({ listingId, otherUserId }),
    });
    return roomId;
  },

  async getRoomDetails(roomId: string, currentUserId: string): Promise<ChatRoomSummary> {
    void currentUserId;
    const { row } = await requestJson<{ row: ChatRoomSummary }>("/api/chat/room-details", {
      method: "POST",
      body: JSON.stringify({ roomId }),
    });
    return row;
  },

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    void blockerId;
    await requestJson("/api/chat/block", { method: "POST", body: JSON.stringify({ blockedId }) });
  },

  async reportUser(reporterId: string, reportedId: string, reason: string): Promise<void> {
    void reporterId;
    await requestJson("/api/chat/report", { method: "POST", body: JSON.stringify({ reportedId, reason }) });
  }
};
