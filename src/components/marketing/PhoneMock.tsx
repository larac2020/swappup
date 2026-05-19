import { Plane, Heart, Sparkles, ArrowRight, Upload, CheckCircle2, Bell, Calendar as CalendarIcon } from "lucide-react";
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
    title: "Search",
    aiPlaceholder: "Weekend trip from London",
    chips: ["Any date", "Direct", "Carry-on"],
    cards: [
      { from: "LGW", to: "BCN", date: "Sat 6 Jun", airline: "easyJet", price: "£68", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop" },
      { from: "LGW", to: "LIS", date: "Fri 5 Jun", airline: "Vueling", price: "£54", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&auto=format&fit=crop" },
      { from: "STN", to: "BUD", date: "Sat 6 Jun", airline: "Ryanair", price: "£39", image: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=600&auto=format&fit=crop" },
    ],
  },
  it: {
    title: "Cerca",
    aiPlaceholder: "Weekend da Milano",
    chips: ["Qualsiasi data", "Diretto", "Bagaglio a mano"],
    cards: [
      { from: "MXP", to: "BCN", date: "Sab 6 giu", airline: "Vueling", price: "€72", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop" },
      { from: "LIN", to: "LIS", date: "Ven 5 giu", airline: "ITA Airways", price: "€89", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&auto=format&fit=crop" },
      { from: "BGY", to: "BUD", date: "Sab 6 giu", airline: "Ryanair", price: "€44", image: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=600&auto=format&fit=crop" },
    ],
  },
} as const;

const sellCopy = {
  en: {
    title: "Sell your ticket",
    steps: ["Upload", "Review", "Publish"],
    routeHeader: "Route",
    fromLabel: "From",
    toLabel: "To",
    from: "London Gatwick (LGW)",
    to: "Barcelona El Prat (BCN)",
    dateHeader: "Flight date",
    date: "Sat 6 Jun · 09:25",
    flightHeader: "Flight details",
    airlineLabel: "Airline",
    airline: "easyJet",
    flightLabel: "Flight no.",
    flightNo: "U28491",
    priceHeader: "Price",
    originalLabel: "Paid",
    originalPrice: "£142",
    listingLabel: "Listing price",
    listingPrice: "£89",
    publish: "Continue",
  },
  it: {
    title: "Vendi il tuo biglietto",
    steps: ["Carica", "Rivedi", "Pubblica"],
    routeHeader: "Tratta",
    fromLabel: "Da",
    toLabel: "A",
    from: "Milano Malpensa (MXP)",
    to: "Barcellona El Prat (BCN)",
    dateHeader: "Data del volo",
    date: "Sab 6 giu · 09:25",
    flightHeader: "Dettagli volo",
    airlineLabel: "Compagnia",
    airline: "Vueling",
    flightLabel: "Numero volo",
    flightNo: "VY6321",
    priceHeader: "Prezzo",
    originalLabel: "Pagato",
    originalPrice: "€148",
    listingLabel: "Prezzo di vendita",
    listingPrice: "€95",
    publish: "Continua",
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
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-secondary/40 to-background aspect-[9/19]">
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
    <div className="flex h-full flex-col px-3 pt-8 pb-3 text-foreground">
      <div className="flex items-center justify-between pb-3">
        <span className="text-sm font-semibold">{c.title}</span>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="truncate text-foreground">{c.aiPlaceholder}</span>
      </div>
      <div className="mt-2 flex gap-1.5 overflow-hidden">
        {c.chips.map((chip) => (
          <span key={chip} className="whitespace-nowrap rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-[10px] text-muted-foreground">
            {chip}
          </span>
        ))}
      </div>
      <div className="mt-3 space-y-2 overflow-hidden">
        {c.cards.map((card, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border/60 bg-secondary/30 backdrop-blur"
          >
            <div className="relative h-16 w-full overflow-hidden">
              <img src={card.image} alt={card.to} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/70 to-transparent" />
              <div className="absolute right-1.5 top-1.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[11px] font-semibold text-primary backdrop-blur">
                {card.price}
              </div>
              <Heart className="absolute bottom-1.5 right-1.5 h-3 w-3 text-white drop-shadow" />
            </div>
            <div className="px-2.5 py-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span>{card.from}</span>
                <Plane className="h-3 w-3 text-primary" />
                <span>{card.to}</span>
              </div>
              <div className="text-[10px] text-muted-foreground truncate">{card.date} · {card.airline}</div>
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

      <div className="space-y-2 overflow-hidden">
        {/* Route */}
        <Section icon={<Plane className="h-3 w-3 text-primary" />} title={c.routeHeader}>
          <Field label={c.fromLabel} value={c.from} />
          <Field label={c.toLabel} value={c.to} />
        </Section>

        {/* Date */}
        <Section icon={<CalendarIcon className="h-3 w-3 text-primary" />} title={c.dateHeader}>
          <Field value={c.date} />
        </Section>

        {/* Flight */}
        <Section title={c.flightHeader}>
          <div className="grid grid-cols-2 gap-1.5">
            <Field label={c.airlineLabel} value={c.airline} />
            <Field label={c.flightLabel} value={c.flightNo} />
          </div>
        </Section>

        {/* Price */}
        <Section title={c.priceHeader}>
          <div className="grid grid-cols-2 gap-1.5">
            <Field label={c.originalLabel} value={c.originalPrice} muted />
            <Field label={c.listingLabel} value={c.listingPrice} accent />
          </div>
        </Section>
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

function Section({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-2">
      <div className="flex items-center gap-1 pb-1 text-[10px] font-semibold text-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <div className="space-y-1">{children}</div>
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