import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";
import type { copy } from "../copy";
import { Phone, Eyebrow, Heading, SceneLayout } from "./Shared";

export const SceneUpload: React.FC<{ c: (typeof copy)["en"] }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: frame - 15, fps, config: { damping: 12, stiffness: 120 } });
  const py = interpolate(drop, [0, 1], [-180, 0]);
  const pulse = (Math.sin(frame * 0.15) + 1) / 2;

  return (
    <SceneLayout
      left={
        <>
          <Eyebrow>{c.s1_eyebrow}</Eyebrow>
          <Heading>{c.s1_title}</Heading>
        </>
      }
      right={
        <Phone>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, marginBottom: 16 }}>
            Swappup / Sell
          </div>
          <div
            style={{
              flex: 1,
              border: `2px dashed ${theme.primary}${pulse > 0.5 ? "" : "80"}`,
              borderRadius: 20,
              background: `${theme.primary}10`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: 20,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Falling PDF */}
            <div
              style={{
                position: "absolute",
                top: "30%",
                width: 110,
                height: 140,
                background: theme.surface,
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                transform: `translateY(${py}px) rotate(-6deg)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                boxShadow: `0 10px 30px ${theme.primary}30`,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: theme.primary }}>PDF</div>
              <div style={{ fontSize: 8, color: theme.muted, padding: "0 8px", textAlign: "center" }}>{c.s1_filename}</div>
            </div>
          </div>
        </Phone>
      }
    />
  );
};