import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import App from "./App.tsx";
import "./index.css";

// Android WebView (Blink) ghosts content painted under GPU-promoted layers.
// The primary opt-out runs as an inline script in index.html *before first
// paint*; this is only a fallback for Capacitor-reported Android where the
// user-agent check may not have matched.
if (Capacitor.getPlatform() === "android") {
  document.documentElement.classList.add("no-backdrop-blur", "no-gpu-layers");
}

// iOS: the web view renders under the status bar, so the web layer owns the
// spacing (see `.safe-top` / `.ios-native` in index.css).
if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
  document.documentElement.classList.add("ios-native");
  StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);
