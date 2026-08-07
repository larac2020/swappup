import { useEffect, useState } from "react";

/**
 * Temporary on-device diagnostic for the iOS status-bar overlap.
 * Renders ONLY inside the native iOS shell (where <html> carries `ios-native`),
 * so browser and Android users never see it. Remove once the cause is known.
 */
export function SafeAreaDebug() {
  const [info, setInfo] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("ios-native")) return;

    const read = () => {
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:fixed;top:0;left:0;height:env(safe-area-inset-top,0px);width:0;pointer-events:none;";
      document.body.appendChild(probe);
      const inset = probe.getBoundingClientRect().height;
      probe.remove();

      const header = document.querySelector(
        '[data-safe-area-header="marketing"]',
      ) as HTMLElement | null;
      const headerPad = header ? getComputedStyle(header).paddingTop : "no header.safe-top";
      const headerTop = header ? Math.round(header.getBoundingClientRect().top) : NaN;
      const headerPosition = header ? getComputedStyle(header).position : "missing";
      const logo = header?.querySelector('[data-safe-area-logo="sticky"]') as HTMLElement | null;
      const logoTop = logo ? Math.round(logo.getBoundingClientRect().top) : NaN;
      const safeToken = getComputedStyle(root).getPropertyValue("--safe-top").trim() || "unset";

      setInfo({
        target: header ? "sticky marketing header" : "NOT FOUND",
        root: root.className || "(none)",
        "env inset": `${inset}px`,
        "--safe-top": safeToken,
        "header position": headerPosition,
        "header padding": headerPad,
        "header y": `${headerTop}px`,
        "sticky logo y": `${logoTop}px`,
        "visual viewport y": `${Math.round(window.visualViewport?.offsetTop ?? 0)}px`,
        dpr: String(window.devicePixelRatio),
      });
    };

    read();
    const t = window.setTimeout(read, 600);
    window.addEventListener("resize", read);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", read);
    };
  }, []);

  if (!info) return null;

  return (
    <div
      className="fixed bottom-2 left-2 z-[9999] rounded-md bg-foreground/85 px-2 py-1 font-mono text-[10px] leading-tight text-background"
      role="status"
    >
      {Object.entries(info).map(([k, v]) => (
        <div key={k}>
          {k}: {v}
        </div>
      ))}
    </div>
  );
}
