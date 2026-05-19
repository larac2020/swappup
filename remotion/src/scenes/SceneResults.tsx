import { useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import { theme } from "../theme";
import type { copy } from "../copy";
import { Phone, Eyebrow, Heading, SceneLayout, ScreenHeader } from "./Shared";

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
          <ScreenHeader title={c.s5_screen} />
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
                  {/* Destination image */}
                  <div
                    style={{
                      height: 90,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Img
                      src={card.image}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />
                  </div>
                  <div style={{ padding: "8px 10px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{card.route}</span>
                      <span style={{ fontSize: 10, color: theme.muted }}>{card.date} · {card.airline}</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#F59E0B", whiteSpace: "nowrap" }}>{card.price}</span>
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