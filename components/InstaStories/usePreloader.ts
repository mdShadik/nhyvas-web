// usePreloader.ts
import { useEffect, useRef } from "react";
import { Story } from "./types";

export function usePreloader(stories: Story[], currentIndex: number, preloadCount: number = 2) {
  const preloadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const toPreload: Story[] = [];

    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < stories.length) {
        toPreload.push(stories[nextIndex]);
      }
    }

    toPreload.forEach((story) => {
      if (!story.url || preloadedRef.current.has(story.url)) return;

      if (story.type === "video") {
        const video = document.createElement("video");
        video.preload = "auto";
        video.muted = true;
        video.src = story.url;
        video.load();
      } else {
        const img = new Image();
        img.src = story.url;
      }

      preloadedRef.current.add(story.url);
    });
  }, [currentIndex, stories, preloadCount]);
}