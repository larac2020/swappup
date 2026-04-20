import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TrainFront, Calendar as CalendarIcon, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  trainOperators, getOperator, getTrainCountries,
  getTrainCitiesByCountry, getStationsForCity
} from "@/data/trainData";
import TrainTransferabilityCheck, { TrainTransferabilityResult } from "@/components/listings/TrainTransferabilityCheck";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  formData: any;
  setFormData: (fn: any) => void;
  isReturn: boolean;
  setIsReturn: (b: boolean) => void;
  priceError: boolean;
  today: Date;
  onTransferResult: (r: TrainTransferabilityResult) => void;
  transferResult: TrainTransferabilityResult | null;
}

export default function TrainForm({ formData, setFormData, isReturn, setIsReturn, priceError, today, onTransferResult, transferResult }: Props) {
  const { t } = useLanguage();
  const countries = useMemo(() => getTrainCountries(), []);
  const originCities = useMemo(() => formData.originCountry ? getTrainCitiesByCountry(formData.originCountry) : [], [formData.originCountry]);
  const destinationCities = useMemo(() => formData.destinationCountry ? getTrainCitiesByCountry(formData.destinationCountry) : [], [formData.destinationCountry]);
  const originStations = useMemo(() => formData.originCity ? getStationsForCity(formData.originCity) : [], [formData.originCity]);
  const destinationStations = useMemo(() => formData.destinationCity ? getStationsForCity(formData.destinationCity) : [], [formData.destinationCity]);
  const operatorFares = useMemo(() => getOperator(formData.operator)?.fares || [], [formData.operator]);

  const update = (patch: any) => setFormData((prev: any) => ({ ...prev, ...patch }));

  return (
    <>
      {/* Route */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrainFront className="w-5 h-5 text-primary" />
          {t("sellTrainRoute")}
        </h2>
        <div className="glass rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("sellFromCountry")}</Label>
              <Select value={formData.originCountry} onValueChange={(v) => update({ originCountry: v, originCity: "", trainOriginStation: "" })}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellSelectCountry")} /></SelectTrigger>
                <SelectContent className="bg-popover z-50">{countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("sellFromCity")}</Label>
              <Select value={formData.originCity} onValueChange={(v) => update({ originCity: v, trainOriginStation: "" })} disabled={!formData.originCountry}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellSelectCity")} /></SelectTrigger>
                <SelectContent className="bg-popover z-50">{originCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {originStations.length > 0 && (
            <div className="space-y-2">
              <Label>{t("sellFromStation")}</Label>
              <Select value={formData.trainOriginStation} onValueChange={(v) => update({ trainOriginStation: v })}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellSelectStation")} /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {originStations.map((s) => <SelectItem key={s.stationCode} value={s.stationCode}>{s.stationCode} — {s.stationName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <TrainFront className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("sellToCountry")}</Label>
              <Select value={formData.destinationCountry} onValueChange={(v) => update({ destinationCountry: v, destinationCity: "", trainDestinationStation: "" })}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellSelectCountry")} /></SelectTrigger>
                <SelectContent className="bg-popover z-50">{countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("sellToCity")}</Label>
              <Select value={formData.destinationCity} onValueChange={(v) => update({ destinationCity: v, trainDestinationStation: "" })} disabled={!formData.destinationCountry}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellSelectCity")} /></SelectTrigger>
                <SelectContent className="bg-popover z-50">{destinationCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {destinationStations.length > 0 && (
            <div className="space-y-2">
              <Label>{t("sellToStation")}</Label>
              <Select value={formData.trainDestinationStation} onValueChange={(v) => update({ trainDestinationStation: v })}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellSelectStation")} /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {destinationStations.map((s) => <SelectItem key={s.stationCode} value={s.stationCode}>{s.stationCode} — {s.stationName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          {t("sellTrainDates")}
        </h2>
        <div className="glass rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t("sellReturnTrip")}</Label>
            <Switch checked={isReturn} onCheckedChange={(c) => { setIsReturn(c); if (!c) update({ returnDate: undefined }); }} />
          </div>
          <div className={cn("grid gap-4", isReturn ? "grid-cols-2" : "grid-cols-1")}>
            <div className="space-y-2">
              <Label>{t("sellDepartureDate")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.departureDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.departureDate ? format(formData.departureDate, "PPP") : t("sellSelectDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.departureDate}
                    onSelect={(d) => update({ departureDate: d })}
                    initialFocus
                    disabled={(date) => date < today}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            {isReturn && (
              <div className="space-y-2">
                <Label>{t("sellReturnDate")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.returnDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.returnDate ? format(formData.returnDate, "PPP") : t("sellSelectDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.returnDate}
                      onSelect={(d) => update({ returnDate: d })}
                      initialFocus
                      disabled={(date) => date < (formData.departureDate ?? today)}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{t("sellDepartureTimeLabel")}</Label>
            <Input type="time" value={formData.departureTime} onChange={(e) => update({ departureTime: e.target.value })} className="bg-secondary/50" />
          </div>
        </div>
      </div>

      {/* Operator + Fare */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("sellTrainDetails")}</h2>
        <div className="glass rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("sellTrainOperatorLabel")}</Label>
              <Select value={formData.operator} onValueChange={(v) => update({ operator: v, trainClass: "" })}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("trainSelectOperator")} /></SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-60">
                  {trainOperators.map((o) => <SelectItem key={o.name} value={o.name}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("sellTrainFareClassLabel")}</Label>
              <Select value={formData.trainClass} onValueChange={(v) => update({ trainClass: v })} disabled={!formData.operator}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("trainSelectFare")} /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {operatorFares.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.operator && formData.trainClass && (
            <TrainTransferabilityCheck operator={formData.operator} fareClass={formData.trainClass} onResult={onTransferResult} />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("sellTrainNumberLabel")}</Label>
              <Input placeholder="e.g. FR 9612" value={formData.trainNumber} onChange={(e) => update({ trainNumber: e.target.value })} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label>{t("sellNumberOfTicketsLabel")}</Label>
              <Input type="number" min="1" value={formData.ticketCount} onChange={(e) => update({ ticketCount: e.target.value })} className="bg-secondary/50" required />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("sellPricingHeader")}</h2>
        <div className="glass rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("sellOriginalPrice")}</Label>
              <Input type="number" min="0" step="0.01" placeholder="80.00" value={formData.originalPrice} onChange={(e) => update({ originalPrice: e.target.value })} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label>{t("sellYourPrice")}</Label>
              <Input type="number" min="1" step="0.01" placeholder="55.00" value={formData.price} onChange={(e) => update({ price: e.target.value })} className={cn("bg-secondary/50", priceError && "border-destructive")} required />
            </div>
          </div>
          {priceError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {t("sellPriceLowerError")}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t("sellAdditiveFeeHint")}
          </p>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("sellAdditionalNotesHeader")}</h2>
        <Textarea
          placeholder={t("sellNotesPlaceholderTrain")}
          value={formData.additionalNotes}
          onChange={(e) => update({ additionalNotes: e.target.value })}
          className="bg-secondary/50 min-h-24"
        />
      </div>
    </>
  );
}
