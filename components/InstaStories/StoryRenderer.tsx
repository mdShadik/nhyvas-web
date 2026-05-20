// StoryRenderer.tsx
import React, { useState, useRef, useCallback, useEffect, JSX } from "react";
import styles from "./styles.module.css";
import { Story, Action, StoryContentRenderer, StoryTester } from "./types";

interface StoryRendererProps {
  story: Story;
  action: Action;
  isPaused: boolean;
  onLoaded: () => void;
  onVideoEnd: () => void;
  onDurationDetected: (duration: number) => void;
  storyStyles?: React.CSSProperties;
  loader?: React.ReactNode;
  renderers?: { renderer: StoryContentRenderer; tester: StoryTester }[];
  muted: boolean;
  onToggleMute: () => void;
  width: string | number;
  height: string | number;
}

const StoryRenderer: React.FC<StoryRendererProps> = ({
  story,
  action,
  isPaused,
  onLoaded,
  onVideoEnd,
  onDurationDetected,
  storyStyles,
  loader,
  renderers,
  muted,
  onToggleMute,
  width,
  height,
}) => {
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check custom renderers
  const matchedRenderer = React.useMemo(() => {
    if (!renderers || renderers.length === 0) return null;

    let bestMatch: { renderer: StoryContentRenderer; priority: number } | null = null;

    for (const { renderer, tester } of renderers) {
      const result = tester(story);
      if (result.condition) {
        if (!bestMatch || result.priority > bestMatch.priority) {
          bestMatch = { renderer, priority: result.priority };
        }
      }
    }

    return bestMatch?.renderer || null;
  }, [renderers, story]);

  // Handle video pause/play
  useEffect(() => {
    if (!videoRef.current || story.type !== "video") return;

    if (isPaused) {
      videoRef.current.pause();
    } else if (loaded) {
      videoRef.current.play().catch(() => {});
    }
  }, [isPaused, loaded, story.type]);

  const handleImageLoad = useCallback(() => {
    setLoaded(true);
    onLoaded();
  }, [onLoaded]);

  const handleVideoLoadedData = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoaded(true);
    onLoaded();

    if (video.duration && isFinite(video.duration)) {
      onDurationDetected(video.duration * 1000);
    }

    if (!isPaused) {
      video.play().catch(() => {});
    }
  }, [onLoaded, onDurationDetected, isPaused]);

  const handleVideoEnded = useCallback(() => {
    onVideoEnd();
  }, [onVideoEnd]);

  // Reset loaded state when story changes
  useEffect(() => {
    setLoaded(false);
  }, [story.url, story.content]);

  // Custom renderer
  if (matchedRenderer) {
    const CustomRenderer = matchedRenderer;
    return (
      <div className={styles.storyContent} style={storyStyles}>
        <CustomRenderer
          action={action}
          isPaused={isPaused}
          story={story}
          config={{
            width,
            height,
            loader: loader as JSX.Element,
            storyStyles,
          }}
        />
      </div>
    );
  }

  // Custom content renderer from story
  if (story.content) {
    const Content = story.content;
    return (
      <div className={styles.storyContent} style={storyStyles}>
        <Content
          action={action}
          isPaused={isPaused}
          story={story}
          config={{
            width,
            height,
            loader: loader as JSX.Element,
            storyStyles,
          }}
        />
      </div>
    );
  }

  const storyType = story.type || (story.url?.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) ? "video" : "image");

  return (
    <div className={styles.storyContent} style={{ ...storyStyles, ...story.styles }}>
      {!loaded && (
        <div className={styles.loader}>
          {loader || <div className={styles.defaultSpinner} />}
        </div>
      )}

      {storyType === "video" ? (
        <>
          <video
            ref={videoRef}
            className={styles.storyVideo}
            src={story.url}
            muted={muted}
            playsInline
            autoPlay={false}
            onLoadedData={handleVideoLoadedData}
            onEnded={handleVideoEnded}
            style={{ opacity: loaded ? 1 : 0 }}
          />
          {loaded && (
            <button
              className={styles.muteButton}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              type="button"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
          )}
        </>
      ) : (
        <img
          className={styles.storyImage}
          src={story.url}
          alt=""
          onLoad={handleImageLoad}
          style={{ opacity: loaded ? 1 : 0 }}
          draggable={false}
        />
      )}
    </div>
  );
};

export default React.memo(StoryRenderer);