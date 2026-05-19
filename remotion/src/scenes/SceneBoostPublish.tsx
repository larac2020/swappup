import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";
import type { copy } from "../copy";
import { Phone, Eyebrow, Heading, SceneLayout } from "./Shared";

export const SceneBoostPublish: React.FC<{ c: (typeof copy)["en"] }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const toggle = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 200 } });
  const tapScale = spring({ frame: frame - 45, fps, config: { damping: 8, stiffness: 220 } });
  const tapped = frame > 45;
  const pressScale = tapped ? interpolate(tapScale, [0, 0.5, 1], [1, 0.93, 1]) : 1;

  return (
    <SceneLayout
      left={
        <>
          <Eyebrow>{c.s3_eyebrow}</Eyebrow>
          <Heading>{c.s3_title}</Heading>
        </>
      }
      right={
        <Phone>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, marginBottom: 14 }}>Swappup / Sell</div>

          {/* Boost toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 14px",
              border: `1px solid ${theme.border}`,
              background: theme.surface,
              borderRadius: 14,
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🚀</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{c.s3_boost}</span>
            </div>
            <div
              style={{
                width: 40,
                height: 22,
                borderRadius: 999,
                background: `${theme.bg}`,
                border: `1px solid ${toggle > 0.4 ? theme.primary : theme.border}`,
                position: "relative",
                transition: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: interpolate(toggle, [0, 1], [2, 18]),
                  width: 16,
                  height: 16,
                  background: toggle > 0.4 ? theme.primary : theme.muted,
                  borderRadius: 999,
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Publish button */}
          <div
            style={{
              padding: "16px",
              borderRadius: 14,
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryGlow})`,
              color: "#000",
              textAlign: "center",
              fontWeight: 800,
              fontSize: 16,
              transform: `scale(${pressScale})`,
              boxShadow: `0 10px 30px ${theme.primary}50`,
            }}
          >
            {c.s3_publish}
          </div>

          {/* Cursor */}
          <Cursor frame={frame} />
        </Phone>
      }
    />
  );
};

const Cursor: React.FC<{ frame: number }> = ({ frame }) => {
  const startX = 50;
  const startY = 100;
  const midX = 240;
  const midY = 90;
  const endX = 160;
  const endY = 540;
  let x = startX, y = startY;
  if (frame < 20) {
    const t = frame / 20;
    x = interpolate(t, [0, 1], [startX, midX]);
    y = interpolate(t, [0, 1], [startY, midY]);
  } else if (frame < 45) {
    const t = (frame - 20) / 25;
    x = interpolate(t, [0, 1], [midX, endX]);
    y = interpolate(t, [0, 1], [midY, endY]);
  } else {
    x = endX;
    y = endY;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.85)",
        border: "2px solid rgba(0,0,0,0.4)",
        zIndex: 10,
        pointerEvents: "none",
      }}
    />
  );
};