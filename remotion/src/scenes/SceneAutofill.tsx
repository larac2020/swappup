import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";
import type { copy } from "../copy";
import { Phone, Eyebrow, Heading, SceneLayout } from "./Shared";

export const SceneAutofill: React.FC<{ c: (typeof copy)["en"] }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = [c.s2_route, c.s2_date, c.s2_paid];

  return (
    <SceneLayout
      left={
        <>
          <Eyebrow>{c.s2_eyebrow}</Eyebrow>
          <Heading>{c.s2_title}</Heading>
        </>
      }
      right={
        <Phone>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, marginBottom: 12 }}>{c.s2_eyebrow}</div>
          <div
            style={{
              border: `1px solid ${theme.primary}50`,
              background: `${theme.primary}08`,
              borderRadius: 16,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ color: theme.primary, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>✦ {c.s2_title}</div>
            {rows.map((label, i) => {
              const s = spring({ frame: frame - 10 - i * 12, fps, config: { damping: 18 } });
              const x = interpolate(s, [0, 1], [-20, 0]);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    background: theme.surface,
                    borderRadius: 10,
                    opacity: s,
                    transform: `translateX(${x}px)`,
                    fontSize: 12,
                    color: theme.text,
                  }}
                >
                  <span style={{ color: theme.success, fontSize: 14 }}>✓</span>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </Phone>
      }
    />
  );
};