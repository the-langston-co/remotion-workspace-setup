import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { z } from "zod";

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

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
  gold: `linear-gradient(135deg, ${BRAND.naplesYellow} 0%, ${BRAND.burntSienna} 100%)`,
};

export const WorkspaceChallengeSchema = z.object({
  transitionDurationSec: z.number().min(0.1).max(2).default(0.5),
});

export type WorkspaceChallengeProps = z.infer<typeof WorkspaceChallengeSchema>;

const LogoFooter = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [20, 40], [0, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        right: 50,
        opacity,
      }}
    >
      <Img
        src={staticFile("langston-logo-full.png")}
        style={{ height: 32, width: "auto" }}
      />
    </div>
  );
};

const HeroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 200 } });
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const trophyBounce = spring({
    frame: frame - 10,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        background: GRADIENTS.gold,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${trophyBounce})`,
            fontSize: 140,
            marginBottom: 30,
          }}
        >
          🏆
        </div>
        <h1
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleSpring})`,
            color: "#ffffff",
            fontSize: 90,
            fontWeight: 800,
            marginBottom: 20,
            textShadow: "0 6px 30px rgba(0,0,0,0.4)",
          }}
        >
          The Workspace Challenge
        </h1>
        <p
          style={{
            opacity: subtitleOpacity,
            color: "rgba(255,255,255,0.95)",
            fontSize: 42,
            fontWeight: 400,
          }}
        >
          A fun, friendly competition with real rewards
        </p>
      </div>
    </AbsoluteFill>
  );
};

const WhyScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 25], [40, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const items = [
    "We've released powerful new workspace tools",
    "We need your feedback to make them better",
    "Hands-on experience is the best way to learn",
  ];

  return (
    <AbsoluteFill
      style={{
        background: GRADIENTS.primary,
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
          fontSize: 72,
          fontWeight: 700,
          marginBottom: 60,
          textShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        Why This Challenge?
      </h1>
      <div style={{ maxWidth: 1000 }}>
        {items.map((item, i) => {
          const itemDelay = 30 + i * 20;
          const itemOpacity = interpolate(
            frame,
            [itemDelay, itemDelay + 15],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const itemX = interpolate(
            frame,
            [itemDelay, itemDelay + 15],
            [-40, 0],
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
                fontSize: 38,
                display: "flex",
                alignItems: "center",
                gap: 20,
                marginBottom: 30,
              }}
            >
              <span style={{ color: BRAND.naplesYellow, fontSize: 32 }}>→</span>
              <span>{item}</span>
            </div>
          );
        })}
      </div>
      <LogoFooter />
    </AbsoluteFill>
  );
};

const MissionScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleSpring = spring({ frame, fps, config: { damping: 200 } });

  const boxOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const boxScale = spring({
    frame: Math.max(0, frame - 30),
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
      <h1
        style={{
          opacity: titleOpacity,
          transform: `scale(${titleSpring})`,
          color: "#ffffff",
          fontSize: 64,
          fontWeight: 700,
          marginBottom: 50,
          textShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        🎯 Your Mission
      </h1>
      <div
        style={{
          opacity: boxOpacity,
          transform: `scale(${boxScale})`,
          background: `rgba(21, 95, 108, 0.5)`,
          borderRadius: 24,
          padding: 50,
          maxWidth: 1100,
          border: `2px solid ${BRAND.tiffanyBlue}50`,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        }}
      >
        <p
          style={{
            color: "#ffffff",
            fontSize: 36,
            lineHeight: 1.6,
            textAlign: "center",
            margin: 0,
          }}
        >
          Be the <strong style={{ color: BRAND.naplesYellow }}>first</strong> to
          answer a series of research questions by going{" "}
          <strong style={{ color: BRAND.tiffanyBlue }}>end-to-end</strong> through
          our workspace tools — from raw Decipher data to insights in Atlas &
          Crosstabs.
        </p>
      </div>
      <LogoFooter />
    </AbsoluteFill>
  );
};

const StepsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const steps = [
    { num: "1", text: "Create a new workspace" },
    { num: "2", text: "Configure datasets from Decipher" },
    { num: "3", text: "Recode columns & add static values" },
    { num: "4", text: "Merge datasets" },
    { num: "5", text: "Run cleaning (multi-scope, bulk, OE)" },
    { num: "6", text: "Generate fetch configs" },
    { num: "7", text: "Query in Atlas/Crosstabs → Get Answers!" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: GRADIENTS.warm,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        fontFamily: FONT_FAMILY,
      }}
    >
      <h1
        style={{
          opacity: titleOpacity,
          color: "#ffffff",
          fontSize: 56,
          fontWeight: 700,
          marginBottom: 40,
          textShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        The Journey
      </h1>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 20,
          maxWidth: 1400,
        }}
      >
        {steps.map((step, i) => {
          const stepDelay = 20 + i * 12;
          const stepOpacity = interpolate(
            frame,
            [stepDelay, stepDelay + 12],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const stepY = interpolate(
            frame,
            [stepDelay, stepDelay + 15],
            [30, 0],
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

          const isLast = i === steps.length - 1;

          return (
            <div
              key={i}
              style={{
                opacity: stepOpacity,
                transform: `translateY(${stepY}px) scale(${stepScale})`,
                background: isLast
                  ? `linear-gradient(135deg, ${BRAND.naplesYellow} 0%, ${BRAND.mossGreen} 100%)`
                  : "rgba(255,255,255,0.15)",
                borderRadius: 16,
                padding: "20px 28px",
                minWidth: 280,
                display: "flex",
                alignItems: "center",
                gap: 16,
                backdropFilter: "blur(10px)",
                border: isLast
                  ? "none"
                  : "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <span
                style={{
                  background: isLast ? BRAND.midnightGreen : BRAND.naplesYellow,
                  color: isLast ? "#fff" : BRAND.midnightGreen,
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 20,
                }}
              >
                {step.num}
              </span>
              <span
                style={{
                  color: isLast ? BRAND.midnightGreen : "#ffffff",
                  fontSize: 22,
                  fontWeight: isLast ? 700 : 500,
                }}
              >
                {step.text}
              </span>
            </div>
          );
        })}
      </div>
      <LogoFooter />
    </AbsoluteFill>
  );
};

const RewardsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const rewards = [
    { place: "🥇", prize: "$200", label: "1st Place" },
    { place: "🥈", prize: "$100", label: "2nd Place" },
    { place: "🍕", prize: "Free Lunch", label: "All Participants" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: GRADIENTS.gold,
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
          color: "#ffffff",
          fontSize: 72,
          fontWeight: 700,
          marginBottom: 60,
          textShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        The Rewards
      </h1>
      <div style={{ display: "flex", gap: 50 }}>
        {rewards.map((reward, i) => {
          const rewardDelay = 25 + i * 20;
          const rewardOpacity = interpolate(
            frame,
            [rewardDelay, rewardDelay + 15],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const rewardScale = spring({
            frame: Math.max(0, frame - rewardDelay),
            fps,
            config: { damping: 12, stiffness: 100 },
          });

          return (
            <div
              key={i}
              style={{
                opacity: rewardOpacity,
                transform: `scale(${rewardScale})`,
                background: "rgba(255,255,255,0.95)",
                borderRadius: 24,
                padding: "40px 50px",
                textAlign: "center",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
                minWidth: 250,
              }}
            >
              <div style={{ fontSize: 80, marginBottom: 15 }}>{reward.place}</div>
              <div
                style={{
                  color: BRAND.midnightGreen,
                  fontSize: 48,
                  fontWeight: 800,
                  marginBottom: 8,
                }}
              >
                {reward.prize}
              </div>
              <div
                style={{
                  color: BRAND.lapisLazuli,
                  fontSize: 22,
                  fontWeight: 500,
                }}
              >
                {reward.label}
              </div>
            </div>
          );
        })}
      </div>
      <LogoFooter />
    </AbsoluteFill>
  );
};

const CTAScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 200 } });
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const detailsOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaScale = spring({
    frame: Math.max(0, frame - 60),
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        background: GRADIENTS.success,
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
          transform: `scale(${titleSpring})`,
          color: "#ffffff",
          fontSize: 72,
          fontWeight: 700,
          marginBottom: 40,
          textShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        Ready to Compete?
      </h1>
      <div
        style={{
          opacity: detailsOpacity,
          display: "flex",
          gap: 60,
          marginBottom: 50,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ color: BRAND.naplesYellow, fontSize: 48, fontWeight: 700 }}>
            ~2 hours
          </div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 24 }}>
            Duration
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: BRAND.naplesYellow, fontSize: 48, fontWeight: 700 }}>
            Learn by doing
          </div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 24 }}>
            Ask questions as you go
          </div>
        </div>
      </div>
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
          background: BRAND.naplesYellow,
          color: BRAND.midnightGreen,
          padding: "24px 60px",
          borderRadius: 16,
          fontSize: 36,
          fontWeight: 700,
          boxShadow: "0 15px 40px -10px rgba(0,0,0,0.4)",
        }}
      >
        Let's Do This! 🚀
      </div>
      <LogoFooter />
    </AbsoluteFill>
  );
};

export const WorkspaceChallenge = (props: WorkspaceChallengeProps) => {
  const { fps, durationInFrames } = useVideoConfig();
  const transitionDuration = Math.round(props.transitionDurationSec * fps);

  const scene1 = 4 * fps;
  const scene2 = 5 * fps;
  const scene3 = 5 * fps;
  const scene4 = 6 * fps;
  const scene5 = 5 * fps;

  const usedFrames =
    scene1 + scene2 + scene3 + scene4 + scene5 - 4 * transitionDuration;
  const scene6 = durationInFrames - usedFrames + transitionDuration;

  return (
    <>
      <Audio
        src={staticFile("corporate_Ascent_10.mp3")}
        playbackRate={26 / 30}
        volume={(f) =>
          interpolate(f, [0, 30, durationInFrames - 45, durationInFrames], [0, 0.35, 0.35, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <TransitionSeries>
      <TransitionSeries.Sequence name="Hero" durationInFrames={scene1}>
        <HeroScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      <TransitionSeries.Sequence name="Why" durationInFrames={scene2}>
        <WhyScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      <TransitionSeries.Sequence name="Mission" durationInFrames={scene3}>
        <MissionScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      <TransitionSeries.Sequence name="Steps" durationInFrames={scene4}>
        <StepsScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      <TransitionSeries.Sequence name="Rewards" durationInFrames={scene5}>
        <RewardsScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: transitionDuration })}
      />

      <TransitionSeries.Sequence name="CTA" durationInFrames={scene6}>
        <CTAScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    </>
  );
};
