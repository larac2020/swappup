import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";

// Android WebView (Blink) ghosts content painted under `backdrop-filter`
// layers; opt those out there. See `.no-backdrop-blur` in index.css.
if (Capacitor.getPlatform() === "android") {
  document.documentElement.classList.add("no-backdrop-blur");
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);
