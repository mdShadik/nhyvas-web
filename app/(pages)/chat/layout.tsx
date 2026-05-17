"use client";

import { usePathname } from "next/navigation";
import { ChatList } from "@/components/chat/ChatList";
import { RequireAuth } from "@/components/profile/RequireAuth";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const roomId = segments.length > 1 ? segments[1] : undefined;

  return (
    <RequireAuth>
      <div className="flex h-dvh md:h-[calc(100dvh-84px)] overflow-hidden bg-bg-page">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-80 lg:w-[400px] border-r border-border h-full flex-shrink-0">
          <ChatList activeRoomId={roomId} />
        </aside>

        {/* Main Content (List on mobile, Room on both) */}
        <main className="flex-1 h-full relative overflow-hidden">
          {children}
        </main>
      </div>
    </RequireAuth>
  );
}
