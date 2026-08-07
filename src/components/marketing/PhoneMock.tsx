import { Plane, Heart, Sparkles, ArrowRight, Upload, CheckCircle2, Calendar as CalendarIcon, Info, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type ScreenKind = "browse" | "sell";

interface PhoneMockProps {
  kind: ScreenKind;
  locale: "en" | "it";
  caption: string;
  className?: string;
}

const browseCopy = {
  en: {
    title: "Find Deals",
    subtitle: "Discover amazing deals from other travelers",
    aiHeader: "AI Search",
    aiPlaceholder: "Weekend beach trip in July",
    chips: ["Route", "Dates", "Airline", "Bags"],
    viewCta: "View Listing",
    cards: [
      { fromCity: "London", fromCode: "LGW", toCity: "Barcelona", toCode: "BCN", date: "Sat 6 Jun", pax: 1, airline: "easyJet", price: "£68", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop" },
      { fromCity: "London", fromCode: "LGW", toCity: "Lisbon", toCode: "LIS", date: "Fri 5 Jun", pax: 2, airline: "Vueling", price: "£54", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&auto=format&fit=crop" },
    ],
  },
  it: {
    title: "Trova Offerte",
    subtitle: "Scopri offerte incredibili da altri viaggiatori",
    aiHeader: "Ricerca AI",
    aiPlaceholder: "Weekend al mare a luglio",
    chips: ["Tratta", "Date", "Compagnia", "Bagagli"],
    viewCta: "Vedi annuncio",
    cards: [
      { fromCity: "Milano", fromCode: "MXP", toCity: "Barcellona", toCode: "BCN", date: "Sab 6 giu", pax: 1, airline: "Vueling", price: "€72", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop" },
      { fromCity: "Milano", fromCode: "LIN", toCity: "Lisbona", toCode: "LIS", date: "Ven 5 giu", pax: 2, airline: "ITA Airways", price: "€89", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&auto=format&fit=crop" },
    ],
  },
} as const;

const sellCopy = {
  en: {
    title: "Sell your ticket",
    steps: ["Upload", "Review details", "Boost & publish"],
    routeHeader: "Flight route",
    countryLabel: "Country",
    cityLabel: "City",
    fromCountry: "United Kingdom",
    fromCity: "London (LGW)",
    toCountry: "Spain",
    toCity: "Barcelona (BCN)",
    dateHeader: "Flight date",
    dateLabel: "Date",
    timeLabel: "Time",
    date: "Sat 6 Jun",
    time: "09:25",
    airlineHeader: "Airline & flight",
    airlineLabel: "Airline",
    airline: "easyJet",
    flightLabel: "Flight no.",
    flightNo: "U28491",
    priceHeader: "Pricing",
    originalLabel: "Original price",
    originalPrice: "£142",
    listingLabel: "Listing price",
    listingPrice: "£89",
    publish: "Continue",
    feeTitle: "Name-change fee",
    feeBody: "easyJet allows transfers. The buyer pays £25 directly to the airline at checkout.",
  },
  it: {
    title: "Vendi il tuo biglietto",
    steps: ["Carica", "Rivedi i dati", "Promuovi e pubblica"],
    routeHeader: "Tratta del volo",
    countryLabel: "Paese",
    cityLabel: "Città",
    fromCountry: "Italia",
    fromCity: "Milano (MXP)",
    toCountry: "Spagna",
    toCity: "Barcellona (BCN)",
    dateHeader: "Data del volo",
    dateLabel: "Data",
    timeLabel: "Ora",
    date: "Sab 6 giu",
    time: "09:25",
    airlineHeader: "Compagnia e volo",
    airlineLabel: "Compagnia",
    airline: "Vueling",
    flightLabel: "Numero volo",
    flightNo: "VY6321",
    priceHeader: "Prezzo",
    originalLabel: "Prezzo originale",
    originalPrice: "€148",
    listingLabel: "Prezzo di vendita",
    listingPrice: "€95",
    publish: "Continua",
    feeTitle: "Costo cambio nome",
    feeBody: "Vueling consente il trasferimento. L'acquirente paga €55 direttamente alla compagnia al checkout.",
  },
} as const;

function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[300px] rounded-[2.5rem] border border-border/60 bg-background p-2 shadow-2xl shadow-primary/10",
        className,
      )}
    >
      <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-foreground/90" />
      <div
        className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-b from-secondary/40 to-background aspect-[9/19]"
        style={{ clipPath: "inset(0 round 2rem)", contain: "paint" }}
      >
        {children}
      </div>
    </div>
  );
}

export function PhoneMock({ kind, locale, caption, className }: PhoneMockProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <PhoneFrame>
        {kind === "browse" ? <BrowseScreen locale={locale} /> : <SellScreen locale={locale} />}
      </PhoneFrame>
      <p className="text-center text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

function BrowseScreen({ locale }: { locale: "en" | "it" }) {
  const c = browseCopy[locale];
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden px-3 pt-8 pb-3 text-foreground">
      {/* Page title — matches real Browse */}
      <div className="shrink-0 pb-2">
        <h3 className="text-sm font-bold leading-tight">{c.title}</h3>
        <p className="text-[10px] text-muted-foreground leading-tight">{c.subtitle}</p>
      </div>

      {/* AI Search card — mirrors real "glass" AI Search block */}
      <div className="rounded-xl border border-border/60 bg-secondary/40 p-2 space-y-1.5 backdrop-blur">
        <div className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-semibold">{c.aiHeader}</span>
        </div>
        <div className="flex gap-1">
          <div className="flex-1 truncate rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[10px] text-muted-foreground">
            {c.aiPlaceholder}
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Search className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="mt-2 flex gap-1 overflow-hidden">
        {c.chips.map((chip) => (
          <span
            key={chip}
            className="whitespace-nowrap rounded-full border border-border/60 bg-secondary/40 px-1.5 py-0.5 text-[9px] text-muted-foreground"
          >
            {chip}
          </span>
        ))}
      </div>

      {/* Listing cards — mirror real ListingCard layout */}
      <div className="mt-2.5 min-h-0 flex-1 space-y-2 overflow-hidden">
        {c.cards.map((card, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border/60 bg-secondary/30 backdrop-blur"
          >
            <div className="relative h-14 w-full overflow-hidden">
              <img src={card.image} alt={card.toCity} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent" />
              {/* Price badge top-right */}
              <div className="absolute right-1.5 top-1.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[11px] font-bold text-primary backdrop-blur">
                {card.price}
              </div>
              {/* Favorite bottom-right */}
              <div className="absolute bottom-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-md bg-background/85 backdrop-blur">
                <Heart className="h-2.5 w-2.5 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-1 p-2">
              {/* Cities with airport codes */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="min-w-0 flex-1 text-center">
                  <div className="truncate text-[11px] font-semibold leading-tight">{card.fromCity}</div>
                  <div className="text-[8.5px] font-bold tracking-wide text-primary">{card.fromCode}</div>
                </div>
                <span className="shrink-0 text-[11px] font-bold text-primary">→</span>
                <div className="min-w-0 flex-1 text-center">
                  <div className="truncate text-[11px] font-semibold leading-tight">{card.toCity}</div>
                  <div className="text-[8.5px] font-bold tracking-wide text-primary">{card.toCode}</div>
                </div>
              </div>
              {/* Date · pax · airline */}
              <div className="flex items-center justify-between gap-1.5 text-[9px] text-muted-foreground">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex items-center gap-0.5">
                    <CalendarIcon className="h-2.5 w-2.5" />
                    {card.date}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Users className="h-2.5 w-2.5" />
                    {card.pax}
                  </span>
                </div>
                <span className="truncate text-right">{card.airline}</span>
              </div>
              {/* View Listing CTA */}
              <div className="rounded-md bg-primary py-1 text-center text-[10px] font-semibold text-primary-foreground">
                {c.viewCta}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SellScreen({ locale }: { locale: "en" | "it" }) {
  const c = sellCopy[locale];
  return (
    <div className="flex h-full flex-col px-3 pt-8 pb-3 text-foreground">
      <div className="flex items-center justify-between pb-2">
        <span className="text-sm font-semibold">{c.title}</span>
      </div>

      {/* Stepper — step 2 active */}
      <div className="flex items-center gap-1 pb-2.5">
        {c.steps.map((label, i) => {
          const done = i < 1;
          const active = i === 1;
          return (
            <div key={label} className="flex flex-1 items-center gap-1">
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[8px] font-bold",
                  active && "border-primary bg-primary text-primary-foreground",
                  done && "border-primary/50 bg-primary/20 text-primary",
                  !active && !done && "border-border bg-secondary/50 text-muted-foreground",
                )}
              >
                {done ? <CheckCircle2 className="h-2.5 w-2.5" /> : i + 1}
              </div>
              {i < c.steps.length - 1 && (
                <div className={cn("h-px flex-1", done ? "bg-primary/50" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2.5 overflow-hidden">
        {/* Flight route — mirrors the glass card on the real Sell page */}
        <SectionHeader icon={<Plane className="h-3 w-3 text-primary" />} title={c.routeHeader} />
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-2 space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <Field label={c.countryLabel} value={c.fromCountry} />
            <Field label={c.cityLabel} value={c.fromCity} />
          </div>
          <div className="flex justify-center py-0.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
              <Plane className="h-2.5 w-2.5 -rotate-45 text-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Field label={c.countryLabel} value={c.toCountry} />
            <Field label={c.cityLabel} value={c.toCity} />
          </div>
        </div>

        {/* Date + Time (one-way) */}
        <SectionHeader icon={<CalendarIcon className="h-3 w-3 text-primary" />} title={c.dateHeader} />
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-2">
          <div className="grid grid-cols-2 gap-1.5">
            <Field label={c.dateLabel} value={c.date} />
            <Field label={c.timeLabel} value={c.time} />
          </div>
        </div>

        {/* Airline & flight */}
        <SectionHeader title={c.airlineHeader} />
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-2">
          <div className="grid grid-cols-2 gap-1.5">
            <Field label={c.airlineLabel} value={c.airline} />
            <Field label={c.flightLabel} value={c.flightNo} />
          </div>
        </div>

        {/* Name-change fee notice (transferability check) */}
        <div className="rounded-xl border border-primary/40 bg-primary/10 p-2 flex gap-1.5">
          <Info className="h-3 w-3 shrink-0 text-primary mt-[1px]" />
          <div className="space-y-0.5">
            <div className="text-[10px] font-semibold text-foreground">{c.feeTitle}</div>
            <div className="text-[9.5px] leading-snug text-muted-foreground">{c.feeBody}</div>
          </div>
        </div>

        {/* Pricing */}
        <SectionHeader title={c.priceHeader} />
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-2">
          <div className="grid grid-cols-2 gap-1.5">
            <Field label={c.originalLabel} value={c.originalPrice} muted />
            <Field label={c.listingLabel} value={c.listingPrice} accent />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-3">
        <button className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground">
          {c.publish}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon?: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-1 px-0.5 text-[10px] font-semibold text-foreground">
      {icon}
      <span>{title}</span>
    </div>
  );
}

function Field({ label, value, muted, accent }: { label?: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div className="rounded-md bg-background/60 px-2 py-1">
      {label && <div className="text-[8.5px] uppercase tracking-wide text-muted-foreground">{label}</div>}
      <div
        className={cn(
          "truncate text-[11px] font-medium",
          muted && "text-muted-foreground line-through",
          accent && "text-primary font-semibold",
        )}
      >
        {value}
      </div>
    </div>
  );
}

// Avoid tree-shaking unused icons
export const __keep = [Upload];