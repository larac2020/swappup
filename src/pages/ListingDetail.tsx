import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plane, Calendar, Users, Luggage, Utensils, Zap,
  Clock, ShoppingCart, Share2, Heart, Loader2, Copy, Mail, MessageCircle, X
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getPrimaryAirportCode, getPrimaryAirportName } from "@/data/flightData";
import { useState } from "react";
import { BuyerProtectionBadge } from "@/components/listings/BuyerProtectionBadge";

const tagLabels: Record<string, string> = {
  city_trip: "City Trip", beach: "Beach", winter_holiday: "Winter Holiday",
  ski_trip: "Ski Trip", adventure: "Adventure", romantic: "Romantic",
  family: "Family", business: "Business",
};

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showShareMenu, setShowShareMenu] = useState(false);

  const { data: myProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Record view
  useQuery({
    queryKey: ["recordView", id, myProfile?.id],
    queryFn: async () => {
      await supabase
        .from("listing_views")
        .upsert(
          { listing_id: id!, viewer_id: myProfile!.id },
          { onConflict: "listing_id,viewer_id" }
        );
      return true;
    },
    enabled: !!id && !!myProfile?.id,
    staleTime: Infinity,
  });

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: seller } = useQuery({
    queryKey: ["seller", listing?.seller_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", listing!.seller_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!listing?.seller_id,
  });

  // myProfile already defined above

  const { data: isFavorited = false } = useQuery({
    queryKey: ["isFavorited", myProfile?.id, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", myProfile!.id)
        .eq("listing_id", id!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!myProfile?.id && !!id,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        const { error } = await supabase.from("favorites").delete().eq("user_id", myProfile!.id).eq("listing_id", listing!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favorites").insert({ user_id: myProfile!.id, listing_id: listing!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isFavorited", myProfile?.id, id] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({ title: isFavorited ? "Removed from favorites" : "Added to favorites" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cart_items").insert({ user_id: myProfile!.id, listing_id: listing!.id, quantity: 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartItems"] });
      toast({ title: "Added to cart", description: `${listing!.title} has been added to your cart.` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "long", year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <AppLayout showNav={false}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!listing) {
    return (
      <AppLayout showNav={false}>
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Listing not found
        </div>
      </AppLayout>
    );
  }

  const discount = listing.original_price
    ? Math.round((1 - Number(listing.price) / Number(listing.original_price)) * 100)
    : 0;

  const sellerName = seller?.full_name || "Seller";
  const sellerInitials = sellerName.split(" ").map((n: string) => n[0]).join("").toUpperCase();

  const originCode = getPrimaryAirportCode(listing.origin_city);
  const destCode = getPrimaryAirportCode(listing.destination_city);
  const originAirportName = getPrimaryAirportName(listing.origin_city);
  const destAirportName = getPrimaryAirportName(listing.destination_city);

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen">
        {/* Hero Image */}
        <div className="relative h-72">
          <img
            src={listing.destination_image_url || `https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&auto=format&fit=crop`}
            alt={listing.destination_city}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <Button variant="glass" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {myProfile?.id !== listing.seller_id && (
              <div className="flex gap-2">
                <Button variant="glass" size="icon" className="rounded-full" onClick={() => setShowShareMenu(true)}>
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button variant="glass" size="icon" className="rounded-full" onClick={() => toggleFavoriteMutation.mutate()} disabled={toggleFavoriteMutation.isPending}>
                  <Heart className={`w-5 h-5 ${isFavorited ? "fill-primary text-primary" : ""}`} />
                </Button>
              </div>
            )}
          </div>

          <div className="absolute bottom-4 right-4">
            <div className="glass-strong rounded-2xl px-4 py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">€{Number(listing.price)}</span>
                {listing.original_price && Number(listing.original_price) > Number(listing.price) && (
                  <span className="text-sm text-muted-foreground line-through">€{Number(listing.original_price)}</span>
                )}
              </div>
              {discount > 0 && (
                <Badge className="gradient-gold text-primary-foreground border-0 mt-1">Save {discount}%</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Share Menu Overlay */}
        {showShareMenu && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowShareMenu(false)}>
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md mx-4 mb-8 glass-strong rounded-2xl p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Share this flight</h3>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowShareMenu(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{listing.origin_city} → {listing.destination_city} — €{Number(listing.price)}</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                  onClick={() => {
                    const url = window.location.href;
                    const text = `Check out this flight: ${listing.origin_city} → ${listing.destination_city} for €${Number(listing.price)}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
                    setShowShareMenu(false);
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-[hsl(142,70%,49%)]/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[hsl(142,70%,49%)]" />
                  </div>
                  <span className="text-xs text-muted-foreground">WhatsApp</span>
                </button>
                <button
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                  onClick={() => {
                    const url = window.location.href;
                    const subject = `Flight deal: ${listing.origin_city} → ${listing.destination_city}`;
                    const body = `Check out this flight from ${listing.origin_city} to ${listing.destination_city} for €${Number(listing.price)}!\n\n${url}`;
                    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
                    setShowShareMenu(false);
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Email</span>
                </button>
                <button
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                  onClick={async () => {
                    const url = window.location.href;
                    try {
                      await navigator.clipboard.writeText(url);
                    } catch {
                      const ta = document.createElement("textarea");
                      ta.value = url;
                      ta.style.position = "fixed";
                      ta.style.opacity = "0";
                      document.body.appendChild(ta);
                      ta.select();
                      document.execCommand("copy");
                      document.body.removeChild(ta);
                    }
                    toast({ title: "Link copied to clipboard" });
                    setShowShareMenu(false);
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Copy className="w-5 h-5 text-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">Copy Link</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-6 space-y-6 -mt-4 relative z-10">
          {/* Route Header with airport codes */}
          <div className="space-y-3">
            {listing.tags && listing.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {listing.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                    {tagLabels[tag] || tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 text-xl">
              <div className="text-center">
                <span className="font-display font-bold">{listing.origin_city}</span>
                {originCode && (
                  <p className="text-sm font-mono font-bold text-primary">{originCode}</p>
                )}
                {originAirportName && (
                  <p className="text-xs text-muted-foreground">{originAirportName}</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-12 h-0.5 bg-gradient-to-r from-primary to-primary/30" />
                <Plane className="w-5 h-5 -rotate-45" />
                <div className="w-12 h-0.5 bg-gradient-to-l from-primary to-primary/30" />
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="text-center">
                <span className="font-display font-bold">{listing.destination_city}</span>
                {destCode && (
                  <p className="text-sm font-mono font-bold text-primary">{destCode}</p>
                )}
                {destAirportName && (
                  <p className="text-xs text-muted-foreground">{destAirportName}</p>
                )}
              </div>
            </div>
            <p className="text-muted-foreground">{listing.airline}</p>
          </div>

          {/* Flight Details */}
          <div className="glass rounded-2xl p-4 space-y-4">
            <h3 className="font-semibold">Flight Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div><p className="text-sm text-muted-foreground">Departure</p><p className="font-medium">{formatDate(listing.departure_date)}</p></div>
              </div>
              {listing.return_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div><p className="text-sm text-muted-foreground">Return</p><p className="font-medium">{formatDate(listing.return_date)}</p></div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary mt-0.5" />
                <div><p className="text-sm text-muted-foreground">Tickets</p><p className="font-medium">{listing.ticket_count} available</p></div>
              </div>
              {listing.flight_number && (
                <div className="flex items-start gap-3">
                  <Plane className="w-5 h-5 text-primary mt-0.5" />
                  <div><p className="text-sm text-muted-foreground">Flight Number</p><p className="font-medium">{listing.flight_number}</p></div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div><p className="text-sm text-muted-foreground">Stopovers</p><p className="font-medium">{listing.stopovers === 0 ? "Direct flight" : `${listing.stopovers} stop(s)`}</p></div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="glass rounded-2xl p-4 space-y-4">
            <h3 className="font-semibold">What's Included</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`flex items-center gap-2 ${listing.luggage_included ? "text-primary" : "text-muted-foreground"}`}>
                <Luggage className="w-5 h-5" /><span className="text-sm">Checked Luggage</span>
              </div>
              <div className={`flex items-center gap-2 ${listing.carry_on_included ? "text-primary" : "text-muted-foreground"}`}>
                <Luggage className="w-5 h-5" /><span className="text-sm">Carry-on Bag</span>
              </div>
              <div className={`flex items-center gap-2 ${listing.meal_included ? "text-primary" : "text-muted-foreground"}`}>
                <Utensils className="w-5 h-5" /><span className="text-sm">In-flight Meal</span>
              </div>
              <div className={`flex items-center gap-2 ${listing.speedy_boarding ? "text-primary" : "text-muted-foreground"}`}>
                <Zap className="w-5 h-5" /><span className="text-sm">Speedy Boarding</span>
              </div>
            </div>
          </div>

          {/* Seller Notes */}
          {listing.additional_notes && (
            <div className="glass rounded-2xl p-4 space-y-2">
              <h3 className="font-semibold">Seller's Notes</h3>
              <p className="text-sm text-muted-foreground">{listing.additional_notes}</p>
            </div>
          )}

          {/* Seller Info */}
          {seller && (
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-primary/30">
                  <AvatarFallback className="bg-secondary">{sellerInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{sellerName}</span>
                    {seller.verification_status === "verified" && (
                      <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">Verified</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {seller.transactions_sold ?? 0} sold • {seller.transactions_bought ?? 0} bought
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom CTA - only for non-owners */}
          {myProfile?.id !== listing.seller_id && (
            <div className="sticky bottom-4 flex gap-3">
              <Button variant="gold" size="xl" className="flex-1" onClick={() => addToCartMutation.mutate()} disabled={addToCartMutation.isPending}>
                {addToCartMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShoppingCart className="w-5 h-5 mr-2" />
                )}
                Add to Cart
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
