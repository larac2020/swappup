import { ReactNode } from "react";
import { MarketingHeader } from "./MarketingHeader";
import { MarketingFooter } from "./MarketingFooter";

interface MarketingLayoutProps {
  children: ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <div className="hidden md:block">
        <MarketingFooter />
      </div>
    </div>
  );
}