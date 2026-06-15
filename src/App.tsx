import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import Cart from "./pages/Cart";
import Account from "./pages/Account";
import ListingDetail from "./pages/ListingDetail";
import SellTicket from "./pages/SellTicket";
import Watchlist from "./pages/Watchlist";
import ResetPassword from "./pages/ResetPassword";
import MyListings from "./pages/MyListings";
import Support from "./pages/Support";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Unsubscribe from "./pages/Unsubscribe";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Faq from "./pages/Faq";
import ReacceptDialog from "./components/legal/ReacceptDialog";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    const to = next && next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login";
    return <Navigate to={to} replace state={{ from: location }} />;
  }

  return (
    <>
      <ReacceptDialog />
      {children}
    </>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    const params = new URLSearchParams(location.search);
    const rawNext = params.get("next");
    const safeNext = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/home";
    return <Navigate to={safeNext} replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public marketing site */}
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/terms-and-conditions" element={<Terms />} />
            <Route path="/privacy-policy" element={<Privacy />} />
            {/* Legacy legal URLs */}
            <Route path="/terms" element={<Navigate to="/terms-and-conditions" replace />} />
            <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
            {/* Auth routes */}
            <Route path="/login" element={<PublicRoute><Auth initialMode="login" /></PublicRoute>} />
            <Route path="/sign-up" element={<PublicRoute><Auth initialMode="signup" /></PublicRoute>} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="/account/:section" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="/listing/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
            <Route path="/sell" element={<ProtectedRoute><SellTicket /></ProtectedRoute>} />
            <Route path="/listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
            <Route path="/favorites" element={<Navigate to="/account/watchlist" replace />} />
            <Route path="/watchlist" element={<Navigate to="/account/watchlist" replace />} />
            <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
