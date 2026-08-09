import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { ProductTour } from "@/components/tour/ProductTour";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <main className={showNav ? "pb-28" : ""}>
        {children}
      </main>
      {showNav && <BottomNav />}
      <ProductTour />
    </div>
  );
}
