import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

const COLORS = {
  purple: "#7c3aed",
  blue: "#2563eb",
  teal: "#0d9488",
  pink: "#ec4899",
  dark: "#1e1b4b",
  light: "#f8fafc",
};

type SceneProps = {
  title: string;
  subtitle?: string;
  items?: string[];
  gradient: string;
  emoji?: string;
};

const Scene = ({ title, subtitle, items, gradient, emoji }: SceneProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 200 } });
  const titleY = interpolate(titleSpring, [0, 1], [50, 0]);
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className={`${gradient} items-center justify-center p-20`}>
      <div className="text-center max-w-4xl">
        {emoji && (
          <div
            style={{
              opacity: titleOpacity,
              transform: `scale(${titleSpring})`,
            }}
            className="text-8xl mb-8"
          >
            {emoji}
          </div>
        )}
        <h1
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
          className="text-white text-6xl font-bold mb-6 leading-tight"
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{ opacity: subtitleOpacity }}
            className="text-white/90 text-3xl font-light"
          >
            {subtitle}
          </p>
        )}
        {items && items.length > 0 && (
          <div className="mt-12 space-y-4">
            {items.map((item, i) => {
              const itemDelay = 30 + i * 12;
              const itemOpacity = interpolate(
                frame,
                [itemDelay, itemDelay + 15],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
              const itemX = interpolate(
                frame,
                [itemDelay, itemDelay + 15],
                [-30, 0],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.out(Easing.quad),
                }
              );
              return (
                <div
                  key={i}
                  style={{
                    opacity: itemOpacity,
                    transform: `translateX(${itemX}px)`,
                  }}
                  className="text-white/90 text-2xl flex items-center justify-center gap-3"
                >
                  <span className="text-green-300">✓</span>
                  <span>{item}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const TypewriterScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const text = "Just describe what you want...";
  const charIndex = Math.min(
    Math.floor(frame / 2),
    text.length
  );
  const displayText = text.slice(0, charIndex);

  const cursorOpacity = interpolate(
    frame % 20,
    [0, 10, 20],
    [1, 0, 1]
  );

  const responseDelay = text.length * 2 + 15;
  const responseOpacity = interpolate(
    frame,
    [responseDelay, responseDelay + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const responseScale = spring({
    frame: Math.max(0, frame - responseDelay),
    fps,
    config: { damping: 200 },
  });

  return (
    <AbsoluteFill className="bg-gradient-to-br from-slate-900 to-slate-800 items-center justify-center p-20">
      <div className="w-full max-w-4xl">
        <div className="bg-slate-700/50 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-400 text-sm ml-2">OpenCode</span>
          </div>
          <div className="text-white text-2xl font-mono">
            <span className="text-blue-400">You:</span>{" "}
            <span>{displayText}</span>
            <span style={{ opacity: cursorOpacity }} className="text-blue-400">
              |
            </span>
          </div>
        </div>
        <div
          style={{
            opacity: responseOpacity,
            transform: `scale(${responseScale})`,
          }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8"
        >
          <div className="text-white text-2xl">
            <span className="text-purple-200">AI:</span> I'll create that video
            for you! Let me set up a new composition with animated text...
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Welcome = () => {
  const { fps } = useVideoConfig();

  const sceneDuration = 4 * fps; // 4 seconds per scene
  const transitionDuration = Math.round(0.5 * fps); // 0.5 second transitions

  return (
    <TransitionSeries>
      {/* Scene 1: Welcome */}
      <TransitionSeries.Sequence durationInFrames={sceneDuration}>
        <Scene
          emoji="🎬"
          title="Welcome to Langston Videos!"
          subtitle="Your AI-powered video creation studio"
          gradient="bg-gradient-to-br from-purple-600 to-blue-600"
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      {/* Scene 2: What's Set Up */}
      <TransitionSeries.Sequence durationInFrames={sceneDuration + 30}>
        <Scene
          emoji="✅"
          title="You're All Set Up!"
          gradient="bg-gradient-to-br from-teal-600 to-emerald-600"
          items={[
            "Remotion Studio for previewing videos",
            "OpenCode AI to help you build",
            "Tailwind CSS for easy styling",
            "Ready-to-use templates",
          ]}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      {/* Scene 3: How It Works */}
      <TransitionSeries.Sequence durationInFrames={sceneDuration + 60}>
        <TypewriterScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      {/* Scene 4: Tips */}
      <TransitionSeries.Sequence durationInFrames={sceneDuration + 30}>
        <Scene
          emoji="💡"
          title="Quick Tips"
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          items={[
            "Preview at localhost:3000",
            "New video = new component + register in Root.tsx",
            "Use spring() for smooth animations",
            "Never use CSS animations!",
          ]}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      {/* Scene 5: Get Started */}
      <TransitionSeries.Sequence durationInFrames={sceneDuration}>
        <Scene
          emoji="🚀"
          title="Let's Create Something!"
          subtitle="Ask the AI: 'Create a 10-second promo video for...'"
          gradient="bg-gradient-to-br from-pink-600 to-rose-600"
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
