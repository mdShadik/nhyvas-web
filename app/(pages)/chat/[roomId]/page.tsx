"use client";

import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { RequireAuth } from "@/components/profile/RequireAuth";
import { ListingChatRoom } from "@/components/chat/ListingChatRoom";

export default function ChatRoomPage() {
  const { t } = useTranslation();
  const params = useParams<{ roomId: string }>();
  const roomId = (params?.roomId ?? "").trim();

  if (!roomId) {
    return (
      <RequireAuth>
        <div className="p-10 text-center text-text-secondary">
          {t("chat.room.invalid_room", "This conversation link is invalid.")}
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <ListingChatRoom roomId={roomId} />
    </RequireAuth>
  );
}
