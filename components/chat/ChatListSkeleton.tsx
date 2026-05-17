import { Skeleton } from "@/components/ui/skeleton";

export function ChatListSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-border/50">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-row items-center gap-4 px-4 py-4">
            {/* Avatar Skeleton */}
            <Skeleton className="h-14 w-14 shrink-0 rounded-[20px]" />

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center justify-between gap-3">
                {/* Name Skeleton */}
                <Skeleton className="h-4 w-24" />
                {/* Time Skeleton */}
                <Skeleton className="h-3 w-12" />
              </div>
              
              <div className="flex flex-col gap-2">
                {/* Last Message Skeleton */}
                <Skeleton className="h-3 w-full max-w-[200px]" />
                {/* Property Tag Skeleton */}
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
