import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import swappupLogo from "@/assets/swappup-logo.png";

export function MarketingHeader() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="Swappup home">
          <img src={swappupLogo} alt="Swappup" className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-hidden="true" />

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button asChild variant="gold" size="sm">
              <Link to="/home">Open app</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="gold" size="sm">
                <Link to="/sign-up">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}