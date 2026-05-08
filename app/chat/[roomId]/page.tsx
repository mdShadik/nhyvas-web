"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { pageBgClass } from "@/constant";

export default function ChatRoomPlaceholderPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params?.roomId ?? "";

  return (
    <main className={`min-h-screen ${pageBgClass}`}>
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-border bg-bg-card p-6 text-text-secondary">
          <div className="text-lg font-semibold text-text-primary">Chat coming soon</div>
          <div className="mt-2">
            Room id: <span className="font-mono text-text-primary">{roomId}</span>
          </div>
          <div className="mt-4">
            <Link
              href="/"
              className="text-sm font-semibold text-primary-600 transition hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Go back home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

