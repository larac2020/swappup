import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Locale, copy } from "./copy";
import { theme } from "./theme";
import { inter } from "./fonts";
import { SceneUpload } from "./scenes/SceneUpload";
import { SceneAutofill } from "./scenes/SceneAutofill";
import { SceneBoostPublish } from "./scenes/SceneBoostPublish";
import { SceneAISearch } from "./scenes/SceneAISearch";
import { SceneResults } from "./scenes/SceneResults";
import { SceneCheckout } from "./scenes/SceneCheckout";
import { ScenePayout } from "./scenes/ScenePayout";
import { SceneOutro } from "./scenes/SceneOutro";

// Scene totals: 90+108+126+90+108+108+108+96 = 834, minus 7*12 = 750
const TR = 12;

export const MainVideo: React.FC<{ locale: Locale }> = ({ locale }) => {
  const c = copy[locale];
  return (
    <AbsoluteFill style={{ background: theme.bg, fontFamily: inter, color: theme.text }}>
      <BackgroundLayer />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90}>
          <SceneUpload c={c} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={108}>
          <SceneAutofill c={c} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={126}>
          <SceneBoostPublish c={c} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={90}>
          <SceneAISearch c={c} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={108}>
          <SceneResults c={c} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={108}>
          <SceneCheckout c={c} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={108}>
          <ScenePayout c={c} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={96}>
          <SceneOutro c={c} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

const BackgroundLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;
  const x = interpolate(t, [0, 1], [-100, 100]);
  const y = interpolate(t, [0, 1], [-50, 50]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          width: 900,
          height: 900,
          transform: `translate(calc(-50% + ${x}px), ${y}px)`,
          background: `radial-gradient(circle, ${theme.primary}22 0%, transparent 60%)`,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -200,
          right: -100,
          width: 600,
          height: 600,
          transform: `translate(${-x}px, ${-y}px)`,
          background: `radial-gradient(circle, ${theme.primary}15 0%, transparent 60%)`,
          filter: "blur(40px)",
        }}
      />
    </AbsoluteFill>
  );
};