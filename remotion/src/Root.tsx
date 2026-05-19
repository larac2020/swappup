import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

const FPS = 30;
const DURATION = 15 * FPS; // 15s

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="main-en"
        component={MainVideo}
        durationInFrames={DURATION}
        fps={FPS}
        width={1280}
        height={720}
        defaultProps={{ locale: "en" as const }}
      />
      <Composition
        id="main-it"
        component={MainVideo}
        durationInFrames={DURATION}
        fps={FPS}
        width={1280}
        height={720}
        defaultProps={{ locale: "it" as const }}
      />
    </>
  );
};