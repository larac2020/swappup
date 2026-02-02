import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, 
  Settings, 
  CreditCard, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  FileText,
  Bell,
  Star
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { icon: User, label: "Personal Information", path: "/account/profile", description: "Name, email, phone" },
  { icon: MapPin, label: "Address", path: "/account/address", description: "Shipping and billing" },
  { icon: CreditCard, label: "Payment Methods", path: "/account/payment", description: "Cards and bank accounts" },
  { icon: Shield, label: "ID Verification", path: "/account/verification", description: "Upload your ID documents", badge: "Required" },
  { icon: Bell, label: "Notifications", path: "/account/notifications", description: "Email and push settings" },
  { icon: FileText, label: "Transaction History", path: "/account/transactions", description: "Past purchases and sales" },
];

const supportItems = [
  { icon: HelpCircle, label: "Help Center", path: "/support" },
  { icon: FileText, label: "Terms & Conditions", path: "/terms" },
  { icon: Shield, label: "Privacy Policy", path: "/privacy" },
];

export default function Account() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const email = user?.email || "user@example.com";
  const fullName = user?.user_metadata?.full_name || "User";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase();

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
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-secondary text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate">{fullName}</h2>
              <p className="text-sm text-muted-foreground truncate">{email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                  Pending Verification
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground">Bought</p>
            </div>
            <div className="text-center border-x border-border/50">
              <p className="text-lg font-bold text-primary">0</p>
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
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                          {item.badge}
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

        {/* Sign Out */}
        <Button
          variant="outline"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground">
          FlySwap v1.0.0
        </p>
      </div>
    </AppLayout>
  );
}
