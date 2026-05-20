// index.tsx
import React from "react";
import StoryContainer from "./StoryContainer";
import { InstaStoriesProps } from "./types";

export type {
  InstaStoriesProps,
  Story,
  StoryHeader,
  Action,
  SlideUpAction,
  StoryContentRenderer,
  StoryTester,
  StoryConfig,
} from "./types";

const InstaStories: React.FC<InstaStoriesProps> = (props) => {
  if (!props.stories || props.stories.length === 0) {
    return null;
  }

  return <StoryContainer {...props} />;
};

export default InstaStories;