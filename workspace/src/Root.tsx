import { Composition } from "remotion";
import { Welcome } from "./Welcome";

export const RemotionRoot = () => {
  return (
    <Composition
      id="Welcome"
      component={Welcome}
      durationInFrames={690}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
