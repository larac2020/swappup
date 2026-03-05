import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  User, CreditCard, Shield, HelpCircle, LogOut, ChevronRight,
  MapPin, FileText, Bell, Star, Heart, ShoppingBag, AlertCircle, Sparkles
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Sub-page components
import PersonalInfo from "@/components/account/PersonalInfo";
import AddressInfo from "@/components/account/AddressInfo";
import PaymentMethods from "@/components/account/PaymentMethods";
import IDVerification from "@/components/account/IDVerification";
import NotificationSettings from "@/components/account/NotificationSettings";
import Purchases from "@/components/account/Purchases";
import FavoritesList from "@/components/account/FavoritesList";
import TransactionHistory from "@/components/account/TransactionHistory";
import Preferences from "@/components/account/Preferences";

const sectionComponents: Record<string, React.ComponentType> = {
  profile: PersonalInfo,
  address: AddressInfo,
  payment: PaymentMethods,
  verification: IDVerification,
  preferences: Preferences,
  notifications: NotificationSettings,
  purchases: Purchases,
  favorites: FavoritesList,
  transactions: TransactionHistory,
};

const supportItems = [
  { icon: HelpCircle, label: "Help Center", path: "/support" },
  { icon: FileText, label: "Terms & Conditions", path: "/terms" },
  { icon: Shield, label: "Privacy Policy", path: "/privacy" },
];

export default function Account() {
  const navigate = useNavigate();
  const { section } = useParams<{ section?: string }>();
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Compute completion status for each section
  const sectionComplete = {
    profile: !!(profile?.full_name && profile?.phone),
    address: !!(profile?.address_line1 && profile?.city && profile?.postal_code && profile?.country),
    payment: typeof window !== "undefined" && localStorage.getItem("flyswap_payment_added") === "true",
    verification: profile?.verification_status === "verified",
  };

  const menuItems = [
    { icon: User, label: "Personal Information", path: "profile", description: "Name, email, phone", required: true, complete: sectionComplete.profile },
    { icon: MapPin, label: "Address", path: "address", description: "Billing address", required: true, complete: sectionComplete.address },
    { icon: CreditCard, label: "Payment Methods", path: "payment", description: "Cards and bank accounts", required: true, complete: sectionComplete.payment },
    { icon: Shield, label: "ID Verification", path: "verification", description: "Upload your ID documents", required: true, complete: sectionComplete.verification },
    { icon: Sparkles, label: "Personalization", path: "preferences", description: "Departure city, categories & more", required: false, complete: true },
    { icon: Bell, label: "Notifications", path: "notifications", description: "Email and push settings", required: false, complete: true },
    { icon: ShoppingBag, label: "Purchases", path: "purchases", description: "Your orders and trips", required: false, complete: true },
    { icon: Heart, label: "Favorites", path: "favorites", description: "Saved listings", required: false, complete: true },
    { icon: FileText, label: "Transaction History", path: "transactions", description: "Past purchases and sales", required: false, complete: true },
  ];

  // If a section is selected, render that sub-page
  if (section && sectionComponents[section]) {
    const SectionComponent = sectionComponents[section];
    return (
      <AppLayout>
        <div className="px-4 py-6">
          <SectionComponent />
        </div>
      </AppLayout>
    );
  }

  const email = profile?.email || user?.email || "user@example.com";
  const fullName = profile?.full_name || user?.user_metadata?.full_name || "User";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase();

  const verificationLabel = profile?.verification_status === "verified"
    ? "Verified"
    : profile?.verification_status === "rejected"
    ? "Rejected"
    : "Pending Verification";

  const verificationStyle = profile?.verification_status === "verified"
    ? "bg-success/10 text-success border-success/30"
    : profile?.verification_status === "rejected"
    ? "bg-destructive/10 text-destructive border-destructive/30"
    : "bg-warning/10 text-warning border-warning/30";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-secondary text-lg font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate">{fullName}</h2>
              <p className="text-sm text-muted-foreground truncate">{email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${verificationStyle}`}>
                  {verificationLabel}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{profile?.transactions_bought ?? 0}</p>
              <p className="text-xs text-muted-foreground">Bought</p>
            </div>
            <div className="text-center border-x border-border/50">
              <p className="text-lg font-bold text-primary">{profile?.transactions_sold ?? 0}</p>
              <p className="text-xs text-muted-foreground">Sold</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="text-lg font-bold">-</span>
              </div>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Account Settings</h3>
          <div className="glass rounded-2xl divide-y divide-border/50">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const showWarning = item.required && !item.complete;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(`/account/${item.path}`)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center relative">
                    <Icon className="w-5 h-5 text-primary" />
                    {showWarning && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                        <span className="text-destructive-foreground text-xs font-bold">!</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.label}</span>
                      {showWarning && (
                        <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                          Incomplete
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Support */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Support</h3>
          <div className="glass rounded-2xl divide-y divide-border/50">
            {supportItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        <p className="text-center text-xs text-muted-foreground">FlySwap v1.0.0</p>
      </div>
    </AppLayout>
  );
}
