// StoryContainer.tsx
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import styles from "./styles.module.css";
import { InstaStoriesProps, Story, Action } from "./types";
import ProgressBar from "./ProgressBar";
import StoryHeader from "./StoryHeader";
import StoryRenderer from "./StoryRenderer";
import SlideUpPanel from "./SlideUpPanel";
import GestureHandler from "./GestureHandler";
import { useStoryTimer } from "./useStoryTimer";
import { usePreloader } from "./usePreloader";
import { useKeyboardNav } from "./useKeyboardNav";

const StoryContainer: React.FC<InstaStoriesProps> = ({
  stories,
  width = 360,
  height = 640,
  loader,
  header: CustomHeaderComponent,
  containerStyles,
  innerContainerStyles,
  storyStyles,
  progressContainerStyles,
  progressBarStyles,
  progressFillStyles,
  loop = false,
  defaultInterval = 5000,
  isPaused: externalPaused = false,
  currentIndex: externalIndex,
  keyboardNavigation = true,
  preventDefault = false,
  preloadCount = 2,
  renderers,
  onStoryStart,
  onStoryEnd,
  onAllStoriesEnd,
  onNext: onNextCallback,
  onPrevious: onPreviousCallback,
  onClose,
  slideUpAction,
  slideUpContent: SlideUpContent,
  slideUpThreshold = 80,
  showCloseButton = true,
  closeButtonPosition = "top-right",
  closeIcon,
  enableGestures = true,
  swipeDownToClose = true,
  swipeUpToAction = true,
  transitionEffect = "none",
}) => {
  const [currentIndex, setCurrentIndex] = useState(externalIndex || 0);
  const [internalPaused, setInternalPaused] = useState(false);
  const [slideUpOpen, setSlideUpOpen] = useState(false);
  const [storyLoaded, setStoryLoaded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [storyDuration, setStoryDuration] = useState(defaultInterval);

  const currentStory = stories[currentIndex];
  const currentStoryRef = useRef(currentStory);
  currentStoryRef.current = currentStory;

  const isPaused = externalPaused || internalPaused || slideUpOpen || !storyLoaded;

  // Sync external index
  useEffect(() => {
    if (externalIndex !== undefined && externalIndex !== currentIndex) {
      setCurrentIndex(externalIndex);
    }
  }, [externalIndex]);

  // Calculate duration
  useEffect(() => {
    setStoryDuration(currentStory?.duration || defaultInterval);
  }, [currentIndex, currentStory?.duration, defaultInterval]);

  // Preload stories
  usePreloader(stories, currentIndex, preloadCount);

  // Navigation
  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      onStoryEnd?.(currentIndex, stories[currentIndex]);
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setStoryLoaded(false);
      onNextCallback?.(nextIndex, stories[nextIndex]);
    } else {
      onStoryEnd?.(currentIndex, stories[currentIndex]);
      onAllStoriesEnd?.();
      if (loop) {
        setCurrentIndex(0);
        setStoryLoaded(false);
      }
    }
  }, [currentIndex, stories, loop, onStoryEnd, onAllStoriesEnd, onNextCallback]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      onStoryEnd?.(currentIndex, stories[currentIndex]);
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setStoryLoaded(false);
      onPreviousCallback?.(prevIndex, stories[prevIndex]);
    }
  }, [currentIndex, stories, onStoryEnd, onPreviousCallback]);

  // Timer
  const { progress, reset: resetTimer } = useStoryTimer({
    duration: storyDuration,
    onComplete: goToNext,
    isPaused,
  });

  // Reset timer on story change
  useEffect(() => {
    resetTimer();
    onStoryStart?.(currentIndex, stories[currentIndex]);
  }, [currentIndex]);

  // Story loaded callback
  const handleStoryLoaded = useCallback(() => {
    setStoryLoaded(true);
  }, []);

  const handleVideoDuration = useCallback(
    (duration: number) => {
      if (duration > 0 && !currentStory?.duration) {
        setStoryDuration(duration);
        resetTimer();
      }
    },
    [currentStory?.duration, resetTimer]
  );

  const handleVideoEnd = useCallback(() => {
    goToNext();
  }, [goToNext]);

  // Actions
  const action: Action = useCallback(
    (actionType, bufferAction) => {
      switch (actionType) {
        case "play":
          setInternalPaused(false);
          break;
        case "pause":
          setInternalPaused(true);
          break;
        case "reset":
          resetTimer();
          break;
      }
    },
    [resetTimer]
  );

  // Slide up
  const handleSlideUp = useCallback(() => {
    if (slideUpAction) {
      setSlideUpOpen(true);
      slideUpAction({
        storyIndex: currentIndex,
        story: currentStory,
        close: () => setSlideUpOpen(false),
      });
      // If there's a SlideUpContent component, keep panel open
      // Otherwise, the slideUpAction handles everything and we don't show panel
      if (!SlideUpContent) {
        setSlideUpOpen(false);
      }
    } else if (SlideUpContent) {
      setSlideUpOpen(true);
    }
  }, [slideUpAction, currentIndex, currentStory, SlideUpContent]);

  const closeSlideUp = useCallback(() => {
    setSlideUpOpen(false);
  }, []);

  // Close
  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Long press
  const handleLongPressStart = useCallback(() => {
    setInternalPaused(true);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    setInternalPaused(false);
  }, []);

  // Mute toggle
  const handleToggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  // Toggle pause for keyboard
  const handleTogglePause = useCallback(() => {
    setInternalPaused((prev) => !prev);
  }, []);

  // Keyboard navigation
  useKeyboardNav({
    enabled: keyboardNavigation && !preventDefault,
    onNext: goToNext,
    onPrev: goToPrev,
    onClose: handleClose,
    onTogglePause: handleTogglePause,
  });

  const hasSlideUpAction = !!(slideUpAction || SlideUpContent);
  const showSlideUpTrigger =
    hasSlideUpAction && (currentStory?.seeMore || currentStory?.slideUpLabel);

  const containerStyle: React.CSSProperties = useMemo(
    () => ({
      width: typeof width === "number" ? `${width}px` : width,
      height: typeof height === "number" ? `${height}px` : height,
      ...containerStyles,
    }),
    [width, height, containerStyles]
  );

  return (
    <div className={styles.storiesContainer} style={containerStyle}>
      <GestureHandler
        onSwipeDown={swipeDownToClose ? handleClose : undefined}
        onSwipeUp={hasSlideUpAction ? handleSlideUp : undefined}
        onTapLeft={goToPrev}
        onTapRight={goToNext}
        onLongPressStart={handleLongPressStart}
        onLongPressEnd={handleLongPressEnd}
        enableGestures={enableGestures}
        swipeDownToClose={swipeDownToClose}
        swipeUpToAction={swipeUpToAction && hasSlideUpAction}
        swipeThreshold={slideUpThreshold}
      >
        <div className={styles.innerContainer} style={innerContainerStyles}>
          {/* Progress Bar */}
          <ProgressBar
            count={stories.length}
            currentIndex={currentIndex}
            progress={progress}
            containerStyles={progressContainerStyles}
            barStyles={progressBarStyles}
            fillStyles={progressFillStyles}
          />

          {/* Header */}
          <StoryHeader
            header={currentStory?.header}
            customHeader={CustomHeaderComponent}
            showCloseButton={showCloseButton}
            closeButtonPosition={closeButtonPosition}
            closeIcon={closeIcon}
            onClose={handleClose}
          />

          {/* Story Content */}
          <StoryRenderer
            key={currentIndex}
            story={currentStory}
            action={action}
            isPaused={isPaused}
            onLoaded={handleStoryLoaded}
            onVideoEnd={handleVideoEnd}
            onDurationDetected={handleVideoDuration}
            storyStyles={storyStyles}
            loader={loader}
            renderers={renderers}
            muted={currentStory?.muted !== undefined ? currentStory.muted : muted}
            onToggleMute={handleToggleMute}
            width={width}
            height={height}
          />

          {/* Slide Up Trigger */}
          {showSlideUpTrigger && (
            <div className={styles.slideUpTrigger} onClick={handleSlideUp}>
              {currentStory?.slideUpIcon || (
                <svg
                  className={styles.slideUpChevron}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              )}
              <span className={styles.slideUpLabel}>
                {currentStory?.slideUpLabel || "Swipe up"}
              </span>
            </div>
          )}

          {/* Slide Up Panel */}
          {SlideUpContent && (
            <SlideUpPanel isVisible={slideUpOpen} onClose={closeSlideUp}>
              <SlideUpContent
                story={currentStory}
                storyIndex={currentIndex}
                close={closeSlideUp}
              />
            </SlideUpPanel>
          )}
        </div>
      </GestureHandler>
    </div>
  );
};

export default StoryContainer;