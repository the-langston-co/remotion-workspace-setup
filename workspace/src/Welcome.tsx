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

const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const BRAND = {
  midnightGreen: "#155F6C",
  tiffanyBlue: "#73C1BD",
  mossGreen: "#89975D",
  naplesYellow: "#FFDD6F",
  burntSienna: "#DD6A48",
  amaranthPurple: "#9D4254",
  lapisLazuli: "#365D83",
};

const GRADIENTS = {
  primary: `linear-gradient(135deg, ${BRAND.midnightGreen} 0%, ${BRAND.lapisLazuli} 100%)`,
  success: `linear-gradient(135deg, ${BRAND.mossGreen} 0%, ${BRAND.midnightGreen} 100%)`,
  dark: `linear-gradient(135deg, #1a1a2e 0%, ${BRAND.midnightGreen} 100%)`,
  warm: `linear-gradient(135deg, ${BRAND.burntSienna} 0%, ${BRAND.amaranthPurple} 100%)`,
  energy: `linear-gradient(135deg, ${BRAND.burntSienna} 0%, ${BRAND.naplesYellow} 100%)`,
};

type SceneProps = {
  title: string;
  subtitle?: string;
  items?: string[];
  gradient: keyof typeof GRADIENTS;
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
    <AbsoluteFill
      style={{
        background: GRADIENTS[gradient],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 1200 }}>
        {emoji && (
          <div
            style={{
              opacity: titleOpacity,
              transform: `scale(${titleSpring})`,
              fontSize: 120,
              marginBottom: 40,
            }}
          >
            {emoji}
          </div>
        )}
        <h1
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            color: "#ffffff",
            fontSize: 72,
            fontWeight: 700,
            marginBottom: 24,
            lineHeight: 1.2,
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              opacity: subtitleOpacity,
              color: "rgba(255,255,255,0.9)",
              fontSize: 36,
              fontWeight: 300,
            }}
          >
            {subtitle}
          </p>
        )}
        {items && items.length > 0 && (
          <div style={{ marginTop: 60 }}>
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
                    color: "rgba(255,255,255,0.95)",
                    fontSize: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  <span style={{ color: BRAND.naplesYellow, fontSize: 28 }}>✓</span>
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

  const text = "Create a welcome video with animated text";
  const charIndex = Math.min(Math.floor(frame / 2), text.length);
  const displayText = text.slice(0, charIndex);

  const cursorOpacity = interpolate(frame % 20, [0, 10, 20], [1, 0, 1]);

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
    <AbsoluteFill
      style={{
        background: GRADIENTS.dark,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1000 }}>
        <div
          style={{
            background: `rgba(21, 95, 108, 0.4)`,
            borderRadius: 24,
            padding: 40,
            marginBottom: 32,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            border: `1px solid ${BRAND.tiffanyBlue}40`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: BRAND.burntSienna,
              }}
            />
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: BRAND.naplesYellow,
              }}
            />
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: BRAND.mossGreen,
              }}
            />
            <span
              style={{ color: BRAND.tiffanyBlue, fontSize: 18, marginLeft: 12 }}
            >
              OpenCode
            </span>
          </div>
          <div
            style={{
              color: "#ffffff",
              fontSize: 28,
              fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            }}
          >
            <span style={{ color: BRAND.tiffanyBlue }}>You:</span>{" "}
            <span>{displayText}</span>
            <span style={{ opacity: cursorOpacity, color: BRAND.tiffanyBlue }}>|</span>
          </div>
        </div>
        <div
          style={{
            opacity: responseOpacity,
            transform: `scale(${responseScale})`,
            background: `linear-gradient(135deg, ${BRAND.midnightGreen} 0%, ${BRAND.lapisLazuli} 100%)`,
            borderRadius: 24,
            padding: 40,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ color: "#ffffff", fontSize: 28 }}>
            <span style={{ color: BRAND.naplesYellow }}>AI:</span> I'll create that for
            you! Setting up a new composition with spring animations...
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Welcome = () => {
  const { fps } = useVideoConfig();

  const sceneDuration = 4 * fps;
  const transitionDuration = Math.round(0.5 * fps);

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={sceneDuration}>
        <Scene
          emoji="🎬"
          title="Welcome to Langston Videos!"
          subtitle="Your AI-powered video creation studio"
          gradient="primary"
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      <TransitionSeries.Sequence durationInFrames={sceneDuration + 30}>
        <Scene
          emoji="✅"
          title="You're All Set Up!"
          gradient="success"
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

      <TransitionSeries.Sequence durationInFrames={sceneDuration + 60}>
        <TypewriterScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      <TransitionSeries.Sequence durationInFrames={sceneDuration + 30}>
        <Scene
          emoji="💡"
          title="Quick Tips"
          gradient="warm"
          items={[
            "Preview at localhost:3000",
            "New video = new component in src/",
            "Use spring() for smooth animations",
            "Never use CSS animations!",
          ]}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      <TransitionSeries.Sequence durationInFrames={sceneDuration}>
        <Scene
          emoji="🚀"
          title="Let's Create Something!"
          subtitle="Just ask: 'Create a 10-second promo video for...'"
          gradient="energy"
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
