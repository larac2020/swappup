import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plane, 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Luggage, 
  Utensils, 
  Zap, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const tags = [
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
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    originCity: "",
    originCountry: "",
    destinationCity: "",
    destinationCountry: "",
    departureDate: undefined as Date | undefined,
    returnDate: undefined as Date | undefined,
    airline: "",
    flightNumber: "",
    price: "",
    originalPrice: "",
    nameChangeFee: "",
    ticketCount: "1",
    luggageIncluded: false,
    carryOnIncluded: true,
    mealIncluded: false,
    speedyBoarding: false,
    stopovers: "0",
    additionalNotes: "",
    selectedTags: [] as string[],
  });

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Listing created!",
      description: "Your ticket is now live on the marketplace.",
    });

    setLoading(false);
    navigate("/home");
  };

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-50 glass-strong border-b border-border/50">
          <div className="flex items-center gap-4 px-4 h-14">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">Sell Your Ticket</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
          {/* Route */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              Flight Route
            </h2>

            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From City</Label>
                  <Input
                    placeholder="e.g. London"
                    value={formData.originCity}
                    onChange={(e) => setFormData({ ...formData, originCity: e.target.value })}
                    className="bg-secondary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Country</Label>
                  <Input
                    placeholder="e.g. UK"
                    value={formData.originCountry}
                    onChange={(e) => setFormData({ ...formData, originCountry: e.target.value })}
                    className="bg-secondary/50"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary rotate-90" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>To City</Label>
                  <Input
                    placeholder="e.g. Barcelona"
                    value={formData.destinationCity}
                    onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
                    className="bg-secondary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Country</Label>
                  <Input
                    placeholder="e.g. Spain"
                    value={formData.destinationCountry}
                    onChange={(e) => setFormData({ ...formData, destinationCountry: e.target.value })}
                    className="bg-secondary/50"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Flight Dates
            </h2>

            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departure Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.departureDate && "text-muted-foreground"
                        )}
                      >
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Return Date (optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.returnDate && "text-muted-foreground"
                        )}
                      >
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>
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
                  <Input
                    placeholder="e.g. Vueling"
                    value={formData.airline}
                    onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                    className="bg-secondary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Flight Number</Label>
                  <Input
                    placeholder="e.g. VY8500"
                    value={formData.flightNumber}
                    onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Tickets</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.ticketCount}
                    onChange={(e) => setFormData({ ...formData, ticketCount: e.target.value })}
                    className="bg-secondary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stopovers</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.stopovers}
                    onChange={(e) => setFormData({ ...formData, stopovers: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">What's Included</h2>

            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Luggage className="w-5 h-5 text-primary" />
                  <span>Checked Luggage</span>
                </div>
                <Switch
                  checked={formData.luggageIncluded}
                  onCheckedChange={(checked) => setFormData({ ...formData, luggageIncluded: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Luggage className="w-5 h-5 text-muted-foreground" />
                  <span>Carry-on Bag</span>
                </div>
                <Switch
                  checked={formData.carryOnIncluded}
                  onCheckedChange={(checked) => setFormData({ ...formData, carryOnIncluded: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Utensils className="w-5 h-5 text-muted-foreground" />
                  <span>In-flight Meal</span>
                </div>
                <Switch
                  checked={formData.mealIncluded}
                  onCheckedChange={(checked) => setFormData({ ...formData, mealIncluded: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-muted-foreground" />
                  <span>Speedy Boarding</span>
                </div>
                <Switch
                  checked={formData.speedyBoarding}
                  onCheckedChange={(checked) => setFormData({ ...formData, speedyBoarding: checked })}
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pricing</h2>

            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Price (€)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="89.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="bg-secondary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Original Price (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="145.00"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Airline Name Change Fee (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="50.00"
                  value={formData.nameChangeFee}
                  onChange={(e) => setFormData({ ...formData, nameChangeFee: e.target.value })}
                  className="bg-secondary/50"
                />
                <p className="text-xs text-muted-foreground">
                  This fee is charged by the airline to change the passenger name
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Trip Type</h2>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.value}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all py-2 px-3",
                    formData.selectedTags.includes(tag.value)
                      ? "bg-primary/20 border-primary text-primary"
                      : "hover:border-primary/50"
                  )}
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
              placeholder="Add any extra information about your tickets, like why you're selling or special conditions..."
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              className="bg-secondary/50 min-h-24"
            />
          </div>

          {/* Disclaimer */}
          <div className="glass rounded-xl p-4 flex gap-3 border-l-4 border-primary">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Important</p>
              <p className="text-muted-foreground">
                The name change fee is set by the airline and may vary. Additional charges may apply. 
                We recommend buyers check carrier websites before purchasing.
              </p>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" variant="gold" size="xl" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Listing...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Listing
              </>
            )}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
