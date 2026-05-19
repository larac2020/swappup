import { useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import { theme } from "../theme";
import type { copy } from "../copy";
import { Phone, Eyebrow, Heading, SceneLayout, ScreenHeader } from "./Shared";

export const SceneCheckout: React.FC<{ c: (typeof copy)["en"] }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = c.s5_cards[0];

  // Selected card slides in
  const cardSpring = spring({ frame: frame - 4, fps, config: { damping: 16 } });
  const cardY = interpolate(cardSpring, [0, 1], [20, 0]);

  // Summary rows fade up
  const sumSpring = spring({ frame: frame - 18, fps, config: { damping: 18 } });
  const sumY = interpolate(sumSpring, [0, 1], [16, 0]);

  // Pay button appears
  const btnSpring = spring({ frame: frame - 34, fps, config: { damping: 16 } });

  // Finger taps button around frame 60
  const tapStart = 58;
  const press = interpolate(frame, [tapStart, tapStart + 4, tapStart + 10], [1, 0.94, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const fingerSpring = spring({ frame: frame - 46, fps, config: { damping: 14 } });
  const fingerY = interpolate(fingerSpring, [0, 1], [40, 0]);
  const fingerOpacity = interpolate(frame, [46, 54, tapStart + 14, tapStart + 22], [0, 1, 1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Paid state takes over
  const paidAt = tapStart + 12;
  const paid = spring({ frame: frame - paidAt, fps, config: { damping: 12, stiffness: 180 } });
  const showPaid = frame >= paidAt;

  return (
    <SceneLayout
      left={
        <>
          <Eyebrow>{c.s5b_eyebrow}</Eyebrow>
          <Heading>{c.s5b_title}</Heading>
        </>
      }
      right={
        <Phone>
          <ScreenHeader title={c.s5b_screen} />

          {/* Selected listing */}
          <div
            style={{
              opacity: cardSpring,
              transform: `translateY(${cardY}px)`,
              background: theme.surface,
              border: `1px solid ${theme.primary}60`,
              borderRadius: 14,
              overflow: "hidden",
              display: "flex",
              gap: 10,
              padding: 8,
              alignItems: "center",
              marginBottom: 12,
              boxShadow: `0 0 0 1px ${theme.primary}30`,
            }}
          >
            <div style={{ width: 64, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
              <Img src={card.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{card.route}</div>
              <div style={{ fontSize: 10, color: theme.muted, marginTop: 2 }}>{card.date} · {card.airline}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#F59E0B" }}>{card.price}</div>
          </div>

          {/* Order summary */}
          <div
            style={{
              opacity: sumSpring,
              transform: `translateY(${sumY}px)`,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {c.s5b_summary}
            </div>
            <Row label={c.s5b_ticket} value={c.s5b_ticket_value} />
            <div style={{ height: 1, background: theme.border, margin: "2px 0" }} />
            <Row label={c.s5b_total} value={c.s5b_total_value} bold />
          </div>

          {/* Escrow note */}
          <div
            style={{
              opacity: sumSpring,
              transform: `translateY(${sumY}px)`,
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 12,
              background: `${theme.primary}10`,
              border: `1px solid ${theme.primary}40`,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1.2 }}>🔒</span>
            <span style={{ fontSize: 10, color: theme.text, lineHeight: 1.4, fontWeight: 500 }}>
              {c.s5b_note}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Pay / Paid button */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                opacity: btnSpring,
                transform: `scale(${press})`,
                padding: "14px",
                borderRadius: 14,
                background: showPaid
                  ? theme.success
                  : `linear-gradient(135deg, ${theme.primary}, ${theme.primaryGlow})`,
                color: "#000",
                textAlign: "center",
                fontWeight: 800,
                fontSize: 15,
                boxShadow: `0 12px 28px ${showPaid ? theme.success : theme.primary}50`,
                transition: "none",
              }}
            >
              {showPaid ? `✓ ${c.s5b_paid}` : c.s5b_pay_cta}
            </div>

            {/* Tap finger */}
            <div
              style={{
                position: "absolute",
                right: 30,
                top: 8,
                transform: `translateY(${fingerY}px)`,
                opacity: fingerOpacity,
                fontSize: 36,
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
                pointerEvents: "none",
              }}
            >
              👆
            </div>

            {/* Ripple on tap */}
            {showPaid && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 14,
                  border: `2px solid ${theme.success}`,
                  opacity: interpolate(paid, [0, 1], [0.8, 0]),
                  transform: `scale(${interpolate(paid, [0, 1], [1, 1.25])})`,
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        </Phone>
      }
    />
  );
};

const Row: React.FC<{ label: string; value: string; bold?: boolean }> = ({ label, value, bold }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ fontSize: bold ? 13 : 11, color: bold ? theme.text : theme.muted, fontWeight: bold ? 700 : 500 }}>{label}</span>
    <span style={{ fontSize: bold ? 14 : 12, color: theme.text, fontWeight: bold ? 800 : 600 }}>{value}</span>
  </div>
);