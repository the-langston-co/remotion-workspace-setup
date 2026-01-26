import { Composition } from "remotion";
import { Welcome, WelcomeSchema } from "./Welcome";

export const RemotionRoot = () => {
  return (
    <Composition
      id="Welcome"
      component={Welcome}
      durationInFrames={780}
      fps={30}
      width={1920}
      height={1080}
      schema={WelcomeSchema}
      defaultProps={{
        sceneDurationSec: 4,
        transitionDurationSec: 0.5,
        welcomeTitle: "Welcome to Langston Videos!",
        welcomeSubtitle: "Your AI-powered video creation studio",
        welcomeEmoji: "🎬",
        setupTitle: "You're All Set Up!",
        setupEmoji: "✅",
        howItWorksIntro: "To create a video, just describe what you want...",
        typewriterText: "Create a welcome video with animated text",
        aiResponse: "I'll create that for you! Setting up a new composition with spring animations...",
        workflowTitle: "Your Workflow",
        ctaTitle: "Let's Create Something!",
        ctaSubtitle: "Just ask: 'Create a 10-second promo video for...'",
        ctaEmoji: "🚀",
      }}
    />
  );
};
