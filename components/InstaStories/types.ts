// types.ts
import React from "react";

export type NumberOrString = number | string;

export interface StoryHeader {
  heading: string;
  subheading: string;
  profileImage: string;
}

export type Action = (action: "play" | "pause" | "reset", bufferAction?: boolean) => void;

export type SlideUpAction = (context: {
  storyIndex: number;
  story: Story;
  close: () => void;
}) => void;

export type StoryContentRenderer = React.FC<{
  action: Action;
  isPaused: boolean;
  story: Story;
  config: StoryConfig;
}>;

export type StoryTester = (story: Story) => {
  condition: boolean;
  priority: number;
};

export interface Story {
  id?: string;
  url?: string;
  type?: "image" | "video" | "custom";
  duration?: number;
  header?: StoryHeader;
  content?: StoryContentRenderer;
  styles?: React.CSSProperties;
  preloadResource?: boolean;
  muted?: boolean;
  seeMore?: boolean;
  seeMoreLabel?: string;
  slideUpLabel?: string;
  slideUpIcon?: React.ReactNode;
}

export interface StoryConfig {
  width: NumberOrString;
  height: NumberOrString;
  loader?: React.ReactNode;
  header?: React.FC<StoryHeader & { onClose: () => void }>;
  storyStyles?: React.CSSProperties;
}

export interface InstaStoriesProps {
  stories: Story[];
  width?: NumberOrString;
  height?: NumberOrString;
  loader?: React.ReactNode;
  header?: React.FC<StoryHeader & { onClose: () => void }>;

  // Styling
  containerStyles?: React.CSSProperties;
  innerContainerStyles?: React.CSSProperties;
  storyStyles?: React.CSSProperties;
  progressContainerStyles?: React.CSSProperties;
  progressBarStyles?: React.CSSProperties;
  progressFillStyles?: React.CSSProperties;

  // Behavior
  loop?: boolean;
  defaultInterval?: number;
  isPaused?: boolean;
  currentIndex?: number;
  keyboardNavigation?: boolean;
  preventDefault?: boolean;
  preloadCount?: number;

  // Custom renderers
  renderers?: {
    renderer: StoryContentRenderer;
    tester: StoryTester;
  }[];

  // Callbacks
  onStoryStart?: (index: number, story: Story) => void;
  onStoryEnd?: (index: number, story: Story) => void;
  onAllStoriesEnd?: () => void;
  onNext?: (index: number, story: Story) => void;
  onPrevious?: (index: number, story: Story) => void;
  onClose?: () => void;

  // Slide Up Action - the key differentiator
  slideUpAction?: SlideUpAction;
  slideUpContent?: React.FC<{
    story: Story;
    storyIndex: number;
    close: () => void;
  }>;
  slideUpThreshold?: number;

  // Close button
  showCloseButton?: boolean;
  closeButtonPosition?: "top-left" | "top-right";
  closeIcon?: React.ReactNode;

  // Gestures
  enableGestures?: boolean;
  swipeDownToClose?: boolean;
  swipeUpToAction?: boolean;

  // Transitions
  transitionEffect?: "none" | "cube" | "fade" | "slide";
}

export interface StoryTimerHook {
  progress: number;
  isRunning: boolean;
  play: () => void;
  pause: () => void;
  reset: () => void;
}