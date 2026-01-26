import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {
  title: string;
};

export const HelloWorld = ({ title }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
  });

  return (
    <AbsoluteFill className="bg-gradient-to-br from-blue-600 to-purple-700 items-center justify-center">
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
        }}
        className="text-white text-7xl font-bold"
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};
