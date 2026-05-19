import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";
import type { copy } from "../copy";
import { Phone, Eyebrow, Heading, SceneLayout, ScreenHeader } from "./Shared";

export const SceneAutofill: React.FC<{ c: (typeof copy)["en"] }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = c.s2_fields;

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
          <ScreenHeader title={c.s2_screen} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((row, i) => {
              const s = spring({ frame: frame - 8 - i * 7, fps, config: { damping: 18 } });
              const y = interpolate(s, [0, 1], [12, 0]);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    padding: "8px 12px",
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    opacity: s,
                    transform: `translateY(${y}px)`,
                  }}
                >
                  <div style={{ fontSize: 9, color: theme.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {row.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: theme.success, fontSize: 12 }}>✓</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{row.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ flex: 1 }} />
          {(() => {
            const note = spring({ frame: frame - 22, fps, config: { damping: 18 } });
            return (
              <div
                style={{
                  marginTop: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: `${theme.primary}12`,
                  border: `1px solid ${theme.primary}40`,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  opacity: note,
                  transform: `translateY(${interpolate(note, [0, 1], [8, 0])}px)`,
                }}
              >
                <span style={{ fontSize: 13, lineHeight: 1 }}>ℹ️</span>
                <span style={{ fontSize: 10.5, lineHeight: 1.35, color: theme.text, fontWeight: 500 }}>
                  {c.s2_note}
                </span>
              </div>
            );
          })()}
          {(() => {
            const cta = spring({ frame: frame - 30, fps, config: { damping: 18 } });
            return (
              <div
                style={{
                  marginTop: 14,
                  padding: "12px",
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryGlow})`,
                  color: "#000",
                  textAlign: "center",
                  fontWeight: 800,
                  fontSize: 14,
                  opacity: cta,
                  transform: `translateY(${interpolate(cta, [0, 1], [10, 0])}px)`,
                  boxShadow: `0 10px 24px ${theme.primary}40`,
                }}
              >
                {c.s2_cta}
              </div>
            );
          })()}
        </Phone>
      }
    />
  );
};