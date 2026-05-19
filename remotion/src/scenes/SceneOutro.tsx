import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";
import type { copy } from "../copy";

export const SceneOutro: React.FC<{ c: (typeof copy)["en"] }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s1 = spring({ frame, fps, config: { damping: 18 } });
  const s2 = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 140 } });
  const y1 = interpolate(s1, [0, 1], [30, 0]);
  const y2 = interpolate(s2, [0, 1], [40, 0]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: `radial-gradient(circle at center, ${theme.primary}10, transparent 70%)`,
      }}
    >
      <div
        style={{
          fontSize: 38,
          fontWeight: 600,
          color: theme.muted,
          letterSpacing: -1,
          opacity: s1,
          transform: `translateY(${y1}px)`,
        }}
      >
        {c.outro1}
      </div>
      <div
        style={{
          fontSize: 120,
          fontWeight: 800,
          letterSpacing: -4,
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryGlow})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          opacity: s2,
          transform: `translateY(${y2}px)`,
        }}
      >
        {c.outro2}
      </div>
    </div>
  );
};