import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";
import type { copy } from "../copy";
import { Phone, Eyebrow, Heading, SceneLayout } from "./Shared";

export const SceneUpload: React.FC<{ c: (typeof copy)["en"] }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 90 } });
  const py = interpolate(drop, [0, 1], [-220, 0]);
  const rot = interpolate(drop, [0, 1], [-10, -4]);
  const pulse = (Math.sin(frame * 0.1) + 1) / 2;

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
          <ScreenHeader title={c.s1_screen} />
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
            {/* Falling boarding pass */}
            <div
              style={{
                position: "absolute",
                top: "18%",
                transform: `translateY(${py}px) rotate(${rot}deg)`,
                width: 230,
                boxShadow: `0 20px 40px ${theme.primary}40`,
                borderRadius: 12,
                overflow: "hidden",
                background: "#fff",
                color: "#111",
                fontFamily: "inherit",
              }}
            >
              {/* Top stub */}
              <div style={{ background: theme.primary, color: "#000", padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>BOARDING PASS</span>
                <span style={{ fontSize: 9, fontWeight: 700 }}>✈ {c.s1_ticket_airline}</span>
              </div>
              {/* Route */}
              <div style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{c.s1_ticket_from}</div>
                  <div style={{ fontSize: 8, color: "#777", marginTop: 2 }}>{c.s1_ticket_fromCity}</div>
                </div>
                <div style={{ flex: 1, height: 1, background: "#ddd", margin: "0 8px", position: "relative" }}>
                  <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", fontSize: 14 }}>✈</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{c.s1_ticket_to}</div>
                  <div style={{ fontSize: 8, color: "#777", marginTop: 2 }}>{c.s1_ticket_toCity}</div>
                </div>
              </div>
              {/* Dashed divider */}
              <div style={{ borderTop: "1px dashed #ccc", margin: "0 8px" }} />
              {/* Details */}
              <div style={{ padding: "8px 12px 10px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                <div>
                  <div style={{ fontSize: 7, color: "#999", fontWeight: 700, letterSpacing: 0.5 }}>FLIGHT</div>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{c.s1_ticket_flight}</div>
                </div>
                <div>
                  <div style={{ fontSize: 7, color: "#999", fontWeight: 700, letterSpacing: 0.5 }}>DATE</div>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{c.s1_ticket_date}</div>
                </div>
                <div>
                  <div style={{ fontSize: 7, color: "#999", fontWeight: 700, letterSpacing: 0.5 }}>SEAT</div>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{c.s1_ticket_seat}</div>
                </div>
                <div style={{ gridColumn: "1 / span 3" }}>
                  <div style={{ fontSize: 7, color: "#999", fontWeight: 700, letterSpacing: 0.5 }}>PASSENGER</div>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{c.s1_ticket_passenger}</div>
                </div>
              </div>
            </div>
          </div>
        </Phone>
      }
    />
  );
};

const ScreenHeader: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 14, textAlign: "center" }}>
    {title}
  </div>
);