import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";
import type { copy } from "../copy";
import { Phone, Eyebrow, Heading, SceneLayout } from "./Shared";

export const ScenePayout: React.FC<{ c: (typeof copy)["en"] }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const check = spring({ frame: frame - 6, fps, config: { damping: 10, stiffness: 180 } });
  const notif = spring({ frame: frame - 30, fps, config: { damping: 14 } });
  const ny = interpolate(notif, [0, 1], [-80, 0]);

  return (
    <SceneLayout
      left={
        <>
          <Eyebrow>{c.s6_eyebrow}</Eyebrow>
          <Heading>{c.s6_title}</Heading>
        </>
      }
      right={
        <Phone>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, marginBottom: 14 }}>Swappup</div>

          {/* Notification */}
          <div
            style={{
              transform: `translateY(${ny}px)`,
              opacity: notif,
              padding: 12,
              background: theme.surface,
              border: `1px solid ${theme.primary}40`,
              borderRadius: 12,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              marginBottom: 20,
              boxShadow: `0 8px 24px ${theme.primary}30`,
            }}
          >
            <span style={{ fontSize: 18 }}>🔔</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.text }}>Swappup</div>
              <div style={{ fontSize: 10, color: theme.muted, marginTop: 2 }}>{c.s6_notif}</div>
            </div>
          </div>

          {/* Big check */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: `${theme.success}25`,
                border: `2px solid ${theme.success}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${check})`,
              }}
            >
              <span style={{ fontSize: 56, color: theme.success, lineHeight: 1 }}>✓</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, textAlign: "center", padding: "0 12px" }}>
              {c.s6_title}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: theme.primary }}>
              {c.s6_sub}
            </div>
          </div>
        </Phone>
      }
    />
  );
};