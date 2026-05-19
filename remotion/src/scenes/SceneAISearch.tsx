import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { theme } from "../theme";
import type { copy } from "../copy";
import { Phone, Eyebrow, Heading, SceneLayout, ScreenHeader } from "./Shared";

export const SceneAISearch: React.FC<{ c: (typeof copy)["en"] }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Typewriter
  const chars = Math.min(c.s4_query.length, Math.floor((frame - 8) * 1.2));
  const typed = chars > 0 ? c.s4_query.slice(0, chars) : "";
  const showCursor = Math.floor(frame / 8) % 2 === 0;
  const glow = spring({ frame: frame - 4, fps, config: { damping: 14 } });

  return (
    <SceneLayout
      left={
        <>
          <Eyebrow>{c.s4_eyebrow}</Eyebrow>
          <Heading>{c.s4_title}</Heading>
        </>
      }
      right={
        <Phone>
          <ScreenHeader title={c.s4_screen} />
          <div
            style={{
              border: `2px solid ${theme.primary}`,
              background: `${theme.primary}10`,
              borderRadius: 16,
              padding: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: `0 0 ${glow * 30}px ${theme.primary}50`,
            }}
          >
            <span style={{ color: theme.primary, fontSize: 20 }}>✦</span>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: theme.text }}>
              {typed}
              {showCursor && <span style={{ color: theme.primary }}>|</span>}
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
            <span
              style={{
                fontSize: 10,
                padding: "3px 8px",
                borderRadius: 999,
                background: theme.primary,
                color: "#000",
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              {c.s4_chip}
            </span>
          </div>
        </Phone>
      }
    />
  );
};