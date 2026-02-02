import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Plane, Calendar, AlertCircle, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Empty state for now - will be populated from database
const mockCartItems: any[] = [];

export default function Cart() {
  const navigate = useNavigate();
  const [items] = useState(mockCartItems);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const serviceFee = items.length > 0 ? 4.99 : 0;
  const total = subtotal + serviceFee;

  if (items.length === 0) {
    return (
      <AppLayout>
        <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
            <ShoppingCart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6 max-w-xs">
            Browse our listings to find amazing deals on flight tickets.
          </p>
          <Button variant="gold" onClick={() => navigate("/browse")}>
            Browse Tickets
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Your Cart</h1>
          <p className="text-muted-foreground">{items.length} {items.length === 1 ? "item" : "items"}</p>
        </div>

        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="glass rounded-2xl p-4 space-y-3">
              <div className="flex gap-4">
                <img
                  src={item.imageUrl}
                  alt={item.destinationCity}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.originCity}</span>
                        <Plane className="w-4 h-4 text-primary rotate-90" />
                        <span className="font-semibold">{item.destinationCity}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.airline}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.departureDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                </div>
                <span className="text-lg font-bold text-primary">€{item.price}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Name Change Fee Disclaimer */}
        <div className="glass rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Name Change Fees Apply</p>
            <p className="text-muted-foreground">
              Airlines may charge additional fees to change the passenger name on tickets. 
              Please check carrier websites before purchasing.
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold">Order Summary</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Fee</span>
              <span>€{serviceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border/50 text-base font-semibold">
              <span>Total</span>
              <span className="text-primary">€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <Button variant="gold" size="xl" className="w-full">
          <CreditCard className="w-5 h-5 mr-2" />
          Proceed to Checkout
        </Button>
      </div>
    </AppLayout>
  );
}
