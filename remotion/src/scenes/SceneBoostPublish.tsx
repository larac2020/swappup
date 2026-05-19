import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";
import type { copy } from "../copy";
import { Phone, Eyebrow, Heading, SceneLayout, ScreenHeader } from "./Shared";

export const SceneBoostPublish: React.FC<{ c: (typeof copy)["en"] }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const toggle = spring({ frame: frame - 18, fps, config: { damping: 14, stiffness: 200 } });
  const optsReveal = spring({ frame: frame - 28, fps, config: { damping: 18 } });
  const tapScale = spring({ frame: frame - 75, fps, config: { damping: 8, stiffness: 220 } });
  const tapped = frame > 75;
  const pressScale = tapped ? interpolate(tapScale, [0, 0.5, 1], [1, 0.93, 1]) : 1;
  const toggleOn = toggle > 0.4;

  const feeReveal = spring({ frame: frame - 50, fps, config: { damping: 18 } });
  const feeY = interpolate(feeReveal, [0, 1], [12, 0]);

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
          <ScreenHeader title={c.s3_screen} />

          {/* Boost toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 14px",
              border: `1px solid ${theme.border}`,
              background: theme.surface,
              borderRadius: 14,
              marginBottom: 10,
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
                border: `1px solid ${toggleOn ? theme.primary : theme.border}`,
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
                  background: toggleOn ? theme.primary : theme.muted,
                  borderRadius: 999,
                }}
              />
            </div>
          </div>

          {/* Boost pricing options — appear when toggle on, first auto-selected */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5, opacity: optsReveal }}>
            {c.s3_boost_options.map((opt, i) => {
              const selected = i === 0;
              const reveal = spring({ frame: frame - 30 - i * 5, fps, config: { damping: 18 } });
              return (
                <div
                  key={i}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: selected ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
                    background: selected ? `${theme.primary}15` : theme.surface,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    opacity: reveal,
                    transform: `translateY(${interpolate(reveal, [0, 1], [8, 0])}px)`,
                    boxShadow: selected ? `0 6px 18px ${theme.primary}30` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {selected && (
                      <span style={{ width: 14, height: 14, borderRadius: 999, background: theme.primary, color: "#000", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900 }}>✓</span>
                    )}
                    <span style={{ fontSize: 11, fontWeight: selected ? 700 : 600, color: selected ? theme.primary : theme.text }}>
                      🔥 {opt.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: selected ? theme.primary : theme.muted }}>{opt.price}</span>
                </div>
              );
            })}
          </div>

          {/* Payout breakdown */}
          <div
            style={{
              marginTop: 10,
              opacity: feeReveal,
              transform: `translateY(${feeY}px)`,
              padding: "10px 12px",
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
              background: theme.surface,
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <div style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
              {c.s3_fee_title}
            </div>
            <FeeRow label={c.s3_fee_listing} value={c.s3_fee_listing_value} />
            <FeeRow label={c.s3_fee_platform} value={c.s3_fee_platform_value} negative />
            <div style={{ height: 1, background: theme.border, margin: "2px 0" }} />
            <FeeRow label={c.s3_fee_payout} value={c.s3_fee_payout_value} bold />
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

const FeeRow: React.FC<{ label: string; value: string; bold?: boolean; negative?: boolean }> = ({ label, value, bold, negative }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
    <span style={{ fontSize: bold ? 12 : 10, color: bold ? theme.text : theme.muted, fontWeight: bold ? 700 : 500 }}>{label}</span>
    <span style={{ fontSize: bold ? 13 : 11, color: bold ? theme.primary : negative ? "#ef4444" : theme.text, fontWeight: bold ? 800 : 700 }}>{value}</span>
  </div>
);

const Cursor: React.FC<{ frame: number }> = ({ frame }) => {
  // Move to toggle, then to publish button
  const startX = 50;
  const startY = 120;
  const midX = 280;
  const midY = 100;
  const endX = 160;
  const endY = 590;
  const t1End = 25;
  const t2Start = 55;
  const t2End = 75;
  let x = startX, y = startY;
  if (frame < t1End) {
    const t = frame / t1End;
    x = interpolate(t, [0, 1], [startX, midX]);
    y = interpolate(t, [0, 1], [startY, midY]);
  } else if (frame < t2Start) {
    x = midX;
    y = midY;
  } else if (frame < t2End) {
    const t = (frame - t2Start) / (t2End - t2Start);
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