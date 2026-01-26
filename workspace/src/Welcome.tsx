import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
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
import { z } from "zod";

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

// Zod schema for configurable props in Remotion Studio
export const WelcomeSchema = z.object({
  // Timing (in seconds for easier UI)
  sceneDurationSec: z.number().min(1).max(15).default(4),
  transitionDurationSec: z.number().min(0.1).max(2).default(0.5),

  // Scene 1: Welcome
  welcomeTitle: z.string().default("Welcome to Langston Videos!"),
  welcomeSubtitle: z.string().default("Your AI-powered video creation studio"),
  welcomeEmoji: z.string().default("🎬"),

  // Scene 2: Setup Complete
  setupTitle: z.string().default("You're All Set Up!"),
  setupEmoji: z.string().default("✅"),

  // Scene 3: How It Works (TypewriterScene)
  howItWorksIntro: z.string().default("To create a video, just describe what you want..."),
  typewriterText: z.string().default("Create a welcome video with animated text"),
  aiResponse: z.string().default("I'll create that for you! Setting up a new composition with spring animations..."),

  // Scene 4: Your Workflow
  workflowTitle: z.string().default("Your Workflow"),

  // Scene 5: CTA
  ctaTitle: z.string().default("Let's Create Something!"),
  ctaSubtitle: z.string().default("Just ask: 'Create a 10-second promo video for...'"),
  ctaEmoji: z.string().default("🚀"),
});

export type WelcomeProps = z.infer<typeof WelcomeSchema>;

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

type TypewriterSceneProps = {
  intro: string;
  text: string;
  response: string;
};

const TypewriterScene = ({ intro, text, response }: TypewriterSceneProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introDelay = 0;
  const terminalDelay = 45;

  const introOpacity = interpolate(frame, [introDelay, introDelay + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introY = interpolate(frame, [introDelay, introDelay + 25], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const terminalOpacity = interpolate(frame, [terminalDelay, terminalDelay + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const terminalY = interpolate(frame, [terminalDelay, terminalDelay + 25], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const typewriterStart = terminalDelay + 30;
  const adjustedFrame = Math.max(0, frame - typewriterStart);
  const charIndex = Math.min(Math.floor(adjustedFrame / 2), text.length);
  const displayText = text.slice(0, charIndex);

  const cursorOpacity = interpolate(frame % 20, [0, 10, 20], [1, 0, 1]);

  const responseDelay = typewriterStart + text.length * 2 + 15;
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
        fontFamily: FONT_FAMILY,
      }}
    >
      <h2
        style={{
          opacity: introOpacity,
          transform: `translateY(${introY}px)`,
          color: "#ffffff",
          fontSize: 48,
          fontWeight: 600,
          marginBottom: 50,
          textAlign: "center",
          textShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        {intro}
      </h2>
      <div
        style={{
          width: "100%",
          maxWidth: 1000,
          opacity: terminalOpacity,
          transform: `translateY(${terminalY}px)`,
        }}
      >
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
            <span style={{ color: BRAND.naplesYellow }}>AI:</span> {response}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

type WorkflowStep = {
  icon: string | "opencode";
  title: string;
  description: string;
};

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    icon: "opencode",
    title: "Launch OpenCode",
    description: "Open the app and select your project",
  },
  {
    icon: "💬",
    title: "Describe Your Idea",
    description: "Duration, style, colors, text content",
  },
  {
    icon: "✨",
    title: "Be Specific",
    description: '"Make it pop" → "Add a spring animation"',
  },
  {
    icon: "🖼️",
    title: "Add Images",
    description: "Drop files into public/ folder",
  },
  {
    icon: "🔄",
    title: "Iterate",
    description: "Preview, refine, repeat",
  },
];

const WorkflowScene = ({ title }: { title: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 25], [30, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill
      style={{
        background: GRADIENTS.warm,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
        fontFamily: FONT_FAMILY,
      }}
    >
      <h1
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          color: "#ffffff",
          fontSize: 56,
          fontWeight: 700,
          marginBottom: 60,
          textShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        {title}
      </h1>

      <div
        style={{
          display: "flex",
          gap: 40,
          maxWidth: 1600,
        }}
      >
        {WORKFLOW_STEPS.map((step, i) => {
          const stepDelay = 20 + i * 18;
          const stepOpacity = interpolate(
            frame,
            [stepDelay, stepDelay + 15],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const stepY = interpolate(
            frame,
            [stepDelay, stepDelay + 20],
            [40, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.quad),
            }
          );
          const stepScale = spring({
            frame: Math.max(0, frame - stepDelay),
            fps,
            config: { damping: 200 },
          });

          return (
            <div
              key={i}
              style={{
                opacity: stepOpacity,
                transform: `translateY(${stepY}px) scale(${stepScale})`,
                background: "rgba(255,255,255,0.15)",
                borderRadius: 20,
                padding: 28,
                width: 280,
                textAlign: "center",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <div
                style={{
                  fontSize: step.icon === "opencode" ? 0 : 56,
                  marginBottom: 20,
                  height: 70,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {step.icon === "opencode" ? (
                  <Img
                    src={staticFile("opencode-mark-192x192.png")}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                    }}
                  />
                ) : (
                  step.icon
                )}
              </div>
              <h3
                style={{
                  color: "#ffffff",
                  fontSize: 26,
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 18,
                  lineHeight: 1.4,
                  margin: 0,
                }}
              >
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Welcome = (props: WelcomeProps) => {
  const { fps } = useVideoConfig();

  const sceneDuration = Math.round(props.sceneDurationSec * fps);
  const transitionDuration = Math.round(props.transitionDurationSec * fps);

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Welcome" durationInFrames={sceneDuration}>
        <Scene
          emoji={props.welcomeEmoji}
          title={props.welcomeTitle}
          subtitle={props.welcomeSubtitle}
          gradient="primary"
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      <TransitionSeries.Sequence name="Setup Complete" durationInFrames={sceneDuration + 30}>
        <Scene
          emoji={props.setupEmoji}
          title={props.setupTitle}
          gradient="success"
          items={[
            "Remotion Studio for previewing videos",
            "OpenCode AI to help you build",
            "Inline styles for reliable rendering",
            "Ready-to-use templates",
          ]}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      <TransitionSeries.Sequence name="How It Works" durationInFrames={sceneDuration + 120}>
        <TypewriterScene
          intro={props.howItWorksIntro}
          text={props.typewriterText}
          response={props.aiResponse}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      <TransitionSeries.Sequence name="Your Workflow" durationInFrames={sceneDuration + 60}>
        <WorkflowScene title={props.workflowTitle} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      <TransitionSeries.Sequence name="Call to Action" durationInFrames={sceneDuration}>
        <Scene
          emoji={props.ctaEmoji}
          title={props.ctaTitle}
          subtitle={props.ctaSubtitle}
          gradient="energy"
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
