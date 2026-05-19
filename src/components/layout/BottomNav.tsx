import { Home, Search, ShoppingCart, User, Ticket } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";

interface NavItem {
  icon: React.ElementType;
  labelKey: "navHome" | "navSearch" | "navCart" | "navListings" | "navAccount";
  path: string;
}

const navItems: (NavItem & { tour?: string })[] = [
  { icon: Home, labelKey: "navHome", path: "/home", tour: "nav-home" },
  { icon: Search, labelKey: "navSearch", path: "/browse", tour: "nav-search" },
  { icon: ShoppingCart, labelKey: "navCart", path: "/cart", tour: "nav-cart" },
  { icon: Ticket, labelKey: "navListings", path: "/listings", tour: "nav-listings" },
  { icon: User, labelKey: "navAccount", path: "/account", tour: "nav-account" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/50 pb-safe">
      <div className="flex justify-center pt-2">
        <LanguageToggle />
      </div>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              data-tour={item.tour}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "animate-pulse-glow")} />
              <span className="text-xs font-medium">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
