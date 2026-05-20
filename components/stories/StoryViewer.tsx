"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { X, ChevronUp } from "lucide-react";
import { type StoryGroup } from "@/services/apiService/stories";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

// Dynamic import for react-insta-stories to avoid SSR issues
const ReactInstaStories = dynamic(() => import("react-insta-stories"), {
  ssr: false,
});

type Props = {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
};

export function StoryViewer({ groups, initialGroupIndex, onClose }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);

  const currentGroup = groups[currentGroupIndex];
  if (!currentGroup) return null;

  const stories = currentGroup.stories.map((s) => ({
    url: s.media_url,
    type: s.media_url.match(/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i) ? "video" : "image",
    duration: 5000,
    header: {
      heading: currentGroup.landlordName,
      subheading: s.property_title,
      profileImage: currentGroup.landlordAvatar || "/assets/images/default-avatar.png",
    },
    seeMore: ({ close }: { close: () => void }) => (
        <div 
          className="flex flex-col items-center justify-center p-4 bg-black/40 backdrop-blur-sm cursor-pointer"
          onClick={() => {
            close();
            onClose();
            router.push(`/property?id=${s.property_id}`);
          }}
        >
          <ChevronUp className="h-6 w-6 text-white animate-bounce" />
          <span className="text-white text-sm font-semibold">{t("property.view_details", "View Details")}</span>
        </div>
      ),
  }));

  const onAllStoriesEnd = () => {
    if (currentGroupIndex < groups.length - 1) {
      setCurrentGroupIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const onPrevious = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black">
      <div className="relative h-full w-full max-w-md overflow-hidden">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute right-4 top-10 z-110 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
        >
          <X className="h-6 w-6" />
        </button>

        <ReactInstaStories
          stories={stories}
          defaultInterval={5000}
          width="100%"
          height="100%"
          onAllStoriesEnd={onAllStoriesEnd}
          onStoryStart={(index: number) => {
            // Can track seen status here if needed
          }}
          keyboardNavigation
        />
      </div>

      {/* Navigation areas for desktop */}
      <div 
        className="absolute inset-y-0 left-0 hidden w-1/4 cursor-pointer items-center justify-center md:flex" 
        onClick={onPrevious}
      />
      <div 
        className="absolute inset-y-0 right-0 hidden w-1/4 cursor-pointer items-center justify-center md:flex" 
        onClick={onAllStoriesEnd}
      />
    </div>
  );
}
