import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Plane, Calendar as CalendarIcon, Plus, Upload,
  Luggage, Utensils, Zap, AlertCircle, Loader2, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  getCountries, getCitiesByCountry, getAirportCodesForCity,
  airlines, CityData
} from "@/data/flightData";

const tripTags = [
  { value: "city_trip", label: "City Trip" },
  { value: "beach", label: "Beach" },
  { value: "winter_holiday", label: "Winter Holiday" },
  { value: "ski_trip", label: "Ski Trip" },
  { value: "adventure", label: "Adventure" },
  { value: "romantic", label: "Romantic" },
  { value: "family", label: "Family" },
  { value: "business", label: "Business" },
];

export default function SellTicket() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isReturn, setIsReturn] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    originCountry: "",
    originCity: "",
    originAirport: "",
    destinationCountry: "",
    destinationCity: "",
    destinationAirport: "",
    departureDate: undefined as Date | undefined,
    returnDate: undefined as Date | undefined,
    airline: "",
    flightNumber: "",
    price: "",
    originalPrice: "",
    ticketCount: "1",
    luggageIncluded: false,
    carryOnIncluded: true,
    mealIncluded: false,
    speedyBoarding: false,
    stopovers: "0",
    additionalNotes: "",
    selectedTags: [] as string[],
    bumpListing: false,
  });

  const countries = useMemo(() => getCountries(), []);
  const originCities = useMemo(() => formData.originCountry ? getCitiesByCountry(formData.originCountry) : [], [formData.originCountry]);
  const destinationCities = useMemo(() => formData.destinationCountry ? getCitiesByCountry(formData.destinationCountry) : [], [formData.destinationCountry]);

  const originAirports = useMemo(() => formData.originCity ? getAirportCodesForCity(formData.originCity) : [], [formData.originCity]);
  const destinationAirports = useMemo(() => formData.destinationCity ? getAirportCodesForCity(formData.destinationCity) : [], [formData.destinationCity]);

  const { data: profile } = useQuery({
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

  // Handle ticket upload for OCR
  const handleTicketUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("parse-ticket", {
        body: { image: base64, fileName: file.name },
      });

      if (error) throw error;

      if (data?.parsed) {
        const p = data.parsed;
        setFormData((prev) => ({
          ...prev,
          originCountry: p.originCountry || prev.originCountry,
          originCity: p.originCity || prev.originCity,
          destinationCountry: p.destinationCountry || prev.destinationCountry,
          destinationCity: p.destinationCity || prev.destinationCity,
          airline: p.airline || prev.airline,
          flightNumber: p.flightNumber || prev.flightNumber,
          originalPrice: p.originalPrice?.toString() || prev.originalPrice,
          departureDate: p.departureDate ? new Date(p.departureDate) : prev.departureDate,
          returnDate: p.returnDate ? new Date(p.returnDate) : prev.returnDate,
        }));
        if (p.returnDate) setIsReturn(true);
        toast({ title: "Ticket parsed!", description: "Please review the auto-filled details below." });
      }
    } catch (err: any) {
      console.error("Ticket parse error:", err);
      toast({ title: "Could not read ticket", description: "Please fill in the details manually.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const createListingMutation = useMutation({
    mutationFn: async () => {
      const bumpedUntil = formData.bumpListing
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null;
      const { error } = await supabase.from("listings").insert({
        seller_id: profile!.id,
        title: `${formData.destinationCity} ${formData.selectedTags.length > 0 ? tripTags.find(t => t.value === formData.selectedTags[0])?.label || "Trip" : "Trip"}`,
        origin_city: formData.originCity,
        origin_country: formData.originCountry,
        destination_city: formData.destinationCity,
        destination_country: formData.destinationCountry,
        departure_date: formData.departureDate!.toISOString().split("T")[0],
        return_date: isReturn && formData.returnDate ? formData.returnDate.toISOString().split("T")[0] : null,
        airline: formData.airline,
        flight_number: formData.flightNumber || null,
        price: parseFloat(formData.price),
        original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        ticket_count: parseInt(formData.ticketCount),
        luggage_included: formData.luggageIncluded,
        carry_on_included: formData.carryOnIncluded,
        meal_included: formData.mealIncluded,
        speedy_boarding: formData.speedyBoarding,
        stopovers: parseInt(formData.stopovers),
        additional_notes: formData.additionalNotes || null,
        tags: formData.selectedTags as any,
        bumped_until: bumpedUntil,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Listing created!", description: "Your ticket is now live on the marketplace." });
      navigate("/home");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  };

  const priceError = formData.price && formData.originalPrice && parseFloat(formData.price) >= parseFloat(formData.originalPrice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast({ title: "Error", description: "Profile not loaded yet.", variant: "destructive" });
      return;
    }
    if (!formData.originCity || !formData.destinationCity || !formData.airline || !formData.departureDate) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (priceError) {
      toast({ title: "Price too high", description: "Selling price must be lower than the original price.", variant: "destructive" });
      return;
    }
    createListingMutation.mutate();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen">
        <div className="sticky top-0 z-50 glass-strong border-b border-border/50">
          <div className="flex items-center gap-4 px-4 h-14">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">Sell Your Ticket</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
          {/* Upload Ticket */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload Ticket Confirmation
            </h2>
            <label className="glass rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors border-2 border-dashed border-border">
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleTicketUpload} disabled={isUploading} />
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Reading your ticket...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Upload a photo or screenshot of your ticket confirmation to auto-fill details
                  </p>
                  <p className="text-xs text-muted-foreground">or fill in manually below</p>
                </>
              )}
            </label>
          </div>

          {/* Route */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              Flight Route
            </h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              {/* Origin */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Country</Label>
                  <Select value={formData.originCountry} onValueChange={(v) => setFormData({ ...formData, originCountry: v, originCity: "", originAirport: "" })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>From City</Label>
                  <Select value={formData.originCity} onValueChange={(v) => setFormData({ ...formData, originCity: v, originAirport: "" })} disabled={!formData.originCountry}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {originCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {originAirports.length > 0 && (
                <div className="space-y-2">
                  <Label>From Airport</Label>
                  <Select value={formData.originAirport} onValueChange={(v) => setFormData({ ...formData, originAirport: v })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select airport" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {originAirports.map((a) => (
                        <SelectItem key={a.airportCode} value={a.airportCode}>{a.airportCode} — {a.airportName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary -rotate-45" />
                </div>
              </div>

              {/* Destination */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>To Country</Label>
                  <Select value={formData.destinationCountry} onValueChange={(v) => setFormData({ ...formData, destinationCountry: v, destinationCity: "", destinationAirport: "" })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To City</Label>
                  <Select value={formData.destinationCity} onValueChange={(v) => setFormData({ ...formData, destinationCity: v, destinationAirport: "" })} disabled={!formData.destinationCountry}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {destinationCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {destinationAirports.length > 0 && (
                <div className="space-y-2">
                  <Label>To Airport</Label>
                  <Select value={formData.destinationAirport} onValueChange={(v) => setFormData({ ...formData, destinationAirport: v })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select airport" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {destinationAirports.map((a) => (
                        <SelectItem key={a.airportCode} value={a.airportCode}>{a.airportCode} — {a.airportName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* One-way / Return toggle + Dates */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Flight Dates
            </h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label>Return flight?</Label>
                <Switch checked={isReturn} onCheckedChange={setIsReturn} />
              </div>
              <div className={cn("grid gap-4", isReturn ? "grid-cols-2" : "grid-cols-1")}>
                <div className="space-y-2">
                  <Label>Departure Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.departureDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.departureDate ? format(formData.departureDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.departureDate}
                        onSelect={(date) => setFormData({ ...formData, departureDate: date })}
                        initialFocus
                        modifiers={{ today: today }}
                        modifiersClassNames={{ today: "text-muted-foreground" }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {isReturn && (
                  <div className="space-y-2">
                    <Label>Return Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.returnDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.returnDate ? format(formData.returnDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.returnDate}
                          onSelect={(date) => setFormData({ ...formData, returnDate: date })}
                          initialFocus
                          modifiers={{ today: today }}
                          modifiersClassNames={{ today: "text-muted-foreground" }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Flight Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Flight Details</h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Airline</Label>
                  <Select value={formData.airline} onValueChange={(v) => setFormData({ ...formData, airline: v })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select airline" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50 max-h-60">
                      {airlines.map((a) => <SelectItem key={a.name} value={a.name}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Flight Number</Label>
                  <Input placeholder="e.g. VY8500" value={formData.flightNumber} onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })} className="bg-secondary/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Tickets</Label>
                  <Input type="number" min="1" value={formData.ticketCount} onChange={(e) => setFormData({ ...formData, ticketCount: e.target.value })} className="bg-secondary/50" required />
                </div>
                <div className="space-y-2">
                  <Label>Stopovers</Label>
                  <Input type="number" min="0" value={formData.stopovers} onChange={(e) => setFormData({ ...formData, stopovers: e.target.value })} className="bg-secondary/50" />
                </div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">What's Included</h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className={cn("flex items-center gap-3 transition-colors", formData.luggageIncluded ? "text-primary" : "text-muted-foreground")}>
                  <Luggage className="w-5 h-5" /><span>Checked Luggage</span>
                </div>
                <Switch checked={formData.luggageIncluded} onCheckedChange={(checked) => setFormData({ ...formData, luggageIncluded: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <div className={cn("flex items-center gap-3 transition-colors", formData.carryOnIncluded ? "text-primary" : "text-muted-foreground")}>
                  <Luggage className="w-5 h-5" /><span>Carry-on Bag</span>
                </div>
                <Switch checked={formData.carryOnIncluded} onCheckedChange={(checked) => setFormData({ ...formData, carryOnIncluded: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <div className={cn("flex items-center gap-3 transition-colors", formData.mealIncluded ? "text-primary" : "text-muted-foreground")}>
                  <Utensils className="w-5 h-5" /><span>In-flight Meal</span>
                </div>
                <Switch checked={formData.mealIncluded} onCheckedChange={(checked) => setFormData({ ...formData, mealIncluded: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <div className={cn("flex items-center gap-3 transition-colors", formData.speedyBoarding ? "text-primary" : "text-muted-foreground")}>
                  <Zap className="w-5 h-5" /><span>Speedy Boarding</span>
                </div>
                <Switch checked={formData.speedyBoarding} onCheckedChange={(checked) => setFormData({ ...formData, speedyBoarding: checked })} />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pricing</h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Original Price (€)</Label>
                  <Input type="number" min="0" step="0.01" placeholder="145.00" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Your Selling Price (€)</Label>
                  <Input type="number" min="1" step="0.01" placeholder="89.00" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={cn("bg-secondary/50", priceError && "border-destructive")} required />
                </div>
              </div>
              {priceError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Selling price must be lower than the original price
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Trip Type</h2>
            <div className="flex flex-wrap gap-2">
              {tripTags.map((tag) => (
                <Badge
                  key={tag.value}
                  variant="outline"
                  className={cn("cursor-pointer transition-all py-2 px-3", formData.selectedTags.includes(tag.value) ? "bg-primary/20 border-primary text-primary" : "hover:border-primary/50")}
                  onClick={() => toggleTag(tag.value)}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Additional Notes</h2>
            <Textarea
              placeholder="Add any extra information about your tickets..."
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              className="bg-secondary/50 min-h-24"
            />
          </div>

          {/* Bump Listing */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Boost Visibility
            </h2>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">🔥 Bump to Hot Deals</p>
                  <p className="text-xs text-muted-foreground">
                    Feature your listing in the Hot Deals section on the Home page for 7 days
                  </p>
                </div>
                <Switch
                  checked={formData.bumpListing}
                  onCheckedChange={(checked) => setFormData({ ...formData, bumpListing: checked })}
                />
              </div>
            </div>
          </div>

          <Button type="submit" variant="gold" size="xl" className="w-full" disabled={createListingMutation.isPending}>
            {createListingMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" />Creating Listing...</>
            ) : (
              <><Plus className="w-5 h-5" />Create Listing</>
            )}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
