import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { ProductTour } from "@/components/tour/ProductTour";
import { LanguageToggle } from "./LanguageToggle";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-2 right-2 z-50">
        <LanguageToggle />
      </div>
      <main className={showNav ? "pb-20" : ""}>
        {children}
      </main>
      {showNav && <BottomNav />}
      <ProductTour />
    </div>
  );
}
