import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";
import type { copy } from "../copy";
import { Phone, Eyebrow, Heading, SceneLayout } from "./Shared";

export const SceneResults: React.FC<{ c: (typeof copy)["en"] }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneLayout
      left={
        <>
          <Eyebrow>{c.s5_eyebrow}</Eyebrow>
          <Heading>{c.s5_title}</Heading>
        </>
      }
      right={
        <Phone>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, marginBottom: 6 }}>
            "{c.s4_query}"
          </div>
          <div style={{ fontSize: 10, color: theme.primary, marginBottom: 14, fontWeight: 600 }}>
            ✦ {c.s5_title}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {c.s5_cards.map((card, i) => {
              const s = spring({ frame: frame - 6 - i * 8, fps, config: { damping: 16 } });
              const y = interpolate(s, [0, 1], [30, 0]);
              return (
                <div
                  key={i}
                  style={{
                    opacity: s,
                    transform: `translateY(${y}px)`,
                    padding: 12,
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{card.route}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: theme.primary }}>{card.price}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: theme.muted }}>{card.date}</span>
                    <span style={{ fontSize: 10, color: theme.muted, textDecoration: "line-through" }}>{card.was}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Phone>
      }
    />
  );
};