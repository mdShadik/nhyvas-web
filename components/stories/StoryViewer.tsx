"use client";

import { useEffect, useMemo, useState } from "react";
import { X, ChevronUp } from "lucide-react";
import { type StoryGroup } from "@/services/apiService/stories";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import InstaStories, { type Story as InstaStory } from "@/components/InstaStories";

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

  const stories: InstaStory[] = useMemo(() => {
    return currentGroup.stories.map((s) => ({
      id: s.story_id,
      url: s.media_url,
      type: s.media_url.match(/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i) ? "video" : "image",
      duration: 5000,
      header: {
        heading: currentGroup.landlordName,
        subheading: s.property_title,
        profileImage: currentGroup.landlordAvatar || "/assets/images/default-avatar.png",
      },
      slideUpLabel: t("property.view_details", "View Details"),
      slideUpIcon: <ChevronUp className="h-5 w-5" />,
    }));
  }, [currentGroup.landlordAvatar, currentGroup.landlordName, currentGroup.stories, t]);

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

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black">
      <div className="relative h-full w-full max-w-md overflow-hidden">
        <InstaStories
          stories={stories}
          width="100%"
          height="100%"
          defaultInterval={5000}
          keyboardNavigation
          showCloseButton
          closeButtonPosition="top-right"
          closeIcon={<X className="h-5 w-5" />}
          onClose={onClose}
          onAllStoriesEnd={onAllStoriesEnd}
          onPrevious={() => {
            // If user is at the first story of a group and keeps tapping left,
            // allow backing out to the previous group.
            onPrevious();
          }}
          slideUpThreshold={80}
          swipeUpToAction
          slideUpAction={({ story, close }) => {
            close();
            onClose();
            const storyId = typeof story?.id === "string" ? story.id : "";
            const match = currentGroup.stories.find((s) => s.story_id === storyId);
            if (match) router.push(`/property?id=${match.property_id}`);
          }}
        />
      </div>
    </div>
  );
}
