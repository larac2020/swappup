import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { LanguageToggle } from "./LanguageToggle";
import { ProductTour } from "@/components/tour/ProductTour";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showNav && (
        <div className="fixed top-3 right-3 z-50">
          <LanguageToggle />
        </div>
      )}
      <main className={showNav ? "pb-28" : ""}>
        {children}
      </main>
      {showNav && <BottomNav />}
      <ProductTour />
    </div>
  );
}
