"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { type StoryGroup } from "@/services/apiService/stories";

type Props = {
  group: StoryGroup;
  onClick: () => void;
  isSeen?: boolean;
  isOwner?: boolean;
};

export function StoryCircle({ group, onClick, isSeen = false, isOwner = false }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 focus:outline-none transition-transform active:scale-95 shrink-0"
    >
      <div
        className={cn(
          "relative h-18 w-18 rounded-full p-0.5",
          isSeen
            ? "bg-secondary-200 dark:bg-secondary-800"
            : "bg-linear-to-tr from-primary-500 via-tertiary-500 to-secondary-200"
        )}
      >
        <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-white dark:border-bg-page bg-secondary-100 dark:bg-secondary-800">
          <Image
            src={group.landlordAvatar || "/assets/images/default-avatar.png"}
            alt={group.landlordName}
            fill
            unoptimized
            className="object-cover"
            sizes="72px"
          />
        </div>
        
        {isOwner && (
          <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white dark:border-bg-page bg-primary-600 text-white shadow-sm">
            <span className="text-lg font-bold leading-none">+</span>
          </div>
        )}
      </div>
      
      <span className="max-w-20 truncate text-[11px] font-medium text-text-primary">
        {isOwner ? "Your Story" : group.landlordName}
      </span>
    </button>
  );
}
