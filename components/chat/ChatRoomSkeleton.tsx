import { Skeleton } from "@/components/ui/skeleton";

export function ChatRoomSkeleton() {
  return (
    <div className="flex h-full flex-col bg-bg-page">
      {/* Header Skeleton */}
      <div className="border-b border-border bg-bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <div className={`flex gap-3 max-w-[70%] ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
              {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-xl mt-auto" />}
              <div className="flex flex-col gap-1">
                <Skeleton className={`h-12 w-48 rounded-[20px] ${i % 2 === 0 ? "rounded-bl-none" : "rounded-br-none"}`} />
                <Skeleton className={`h-2 w-10 ${i % 2 === 0 ? "self-start" : "self-end"}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Skeleton */}
      <div className="border-t border-border bg-bg-card p-4">
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
