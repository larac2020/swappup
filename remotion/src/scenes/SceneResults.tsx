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
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, marginBottom: 12 }}>
            Swappup / Browse
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {c.s5_cards.map((card, i) => {
              const s = spring({ frame: frame - 6 - i * 8, fps, config: { damping: 16 } });
              const y = interpolate(s, [0, 1], [30, 0]);
              return (
                <div
                  key={i}
                  style={{
                    opacity: s,
                    transform: `translateY(${y}px)`,
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 14,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Image placeholder */}
                  <div
                    style={{
                      height: 84,
                      background: `linear-gradient(135deg, hsl(${card.hue}, 65%, 45%), hsl(${card.hue + 30}, 70%, 35%))`,
                      position: "relative",
                      display: "flex",
                      alignItems: "flex-end",
                      padding: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#fff",
                        background: "rgba(0,0,0,0.45)",
                        padding: "2px 7px",
                        borderRadius: 999,
                        letterSpacing: 0.4,
                      }}
                    >
                      {card.city}
                    </span>
                  </div>
                  <div style={{ padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{card.route}</span>
                      <span style={{ fontSize: 10, color: theme.muted }}>{card.date}</span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: theme.primary }}>{card.price}</span>
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