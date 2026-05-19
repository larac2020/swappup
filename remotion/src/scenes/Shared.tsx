import { useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

export const Phone: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 140 } });
  const y = interpolate(s, [0, 1], [40, 0]);
  return (
    <div
      style={{
        width: 340,
        height: 700,
        borderRadius: 48,
        background: theme.bg,
        padding: 10,
        border: `1px solid ${theme.border}`,
        boxShadow: `0 30px 80px ${theme.primary}25, 0 0 0 1px ${theme.border}`,
        transform: `translateY(${y}px)`,
        opacity: s,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          width: 110,
          height: 22,
          background: "#000",
          borderRadius: 16,
          zIndex: 5,
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 40,
          background: `linear-gradient(180deg, ${theme.bgSoft}, ${theme.bg})`,
          overflow: "hidden",
          padding: "44px 16px 16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 20 } });
  return (
    <div
      style={{
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: theme.primary,
        opacity: s,
      }}
    >
      {children}
    </div>
  );
};

export const Heading: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 5 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  const y = interpolate(s, [0, 1], [20, 0]);
  return (
    <div
      style={{
        fontSize: 44,
        fontWeight: 800,
        lineHeight: 1.05,
        color: theme.text,
        marginTop: 12,
        opacity: s,
        transform: `translateY(${y}px)`,
        maxWidth: 520,
      }}
    >
      {children}
    </div>
  );
};

export const SceneLayout: React.FC<{ left: React.ReactNode; right: React.ReactNode }> = ({ left, right }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 60,
      padding: "0 80px",
    }}
  >
    <div style={{ flex: 1, maxWidth: 560 }}>{left}</div>
    <div style={{ flexShrink: 0 }}>{right}</div>
  </div>
);

export const Pill: React.FC<{ children: React.ReactNode; bg?: string; color?: string; size?: number }> = ({
  children,
  bg = theme.surface,
  color = theme.text,
  size = 11,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "4px 8px",
      borderRadius: 999,
      background: bg,
      color,
      fontSize: size,
      fontWeight: 500,
      border: `1px solid ${theme.border}`,
    }}
  >
    {children}
  </span>
);