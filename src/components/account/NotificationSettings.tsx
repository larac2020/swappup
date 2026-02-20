import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [saleUpdates, setSaleUpdates] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  useEffect(() => {
    if ("Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const togglePush = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      setPushEnabled(false);
    } else {
      const permission = await Notification.requestPermission();
      setPushEnabled(permission === "granted");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/account")} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Manage your alerts</p>
        </div>
      </div>

      <div className="glass rounded-2xl divide-y divide-border/50">
        <div className="flex items-center justify-between p-4">
          <div>
            <Label className="font-medium">Push Notifications</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Browser push notifications</p>
          </div>
          <Switch checked={pushEnabled} onCheckedChange={togglePush} />
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <Label className="font-medium">Price Drop Alerts</Label>
            <p className="text-xs text-muted-foreground mt-0.5">When a ticket you watch drops in price</p>
          </div>
          <Switch checked={priceAlerts} onCheckedChange={setPriceAlerts} />
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <Label className="font-medium">Sale Updates</Label>
            <p className="text-xs text-muted-foreground mt-0.5">When someone buys your tickets</p>
          </div>
          <Switch checked={saleUpdates} onCheckedChange={setSaleUpdates} />
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <Label className="font-medium">Security Alerts</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Login activity and account changes</p>
          </div>
          <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
        </div>
      </div>
    </div>
  );
}
