import { Plane, Heart, Search, Sparkles, ArrowRight, Upload, CheckCircle2, Rocket, Bell } from "lucide-react";
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
    title: "Browse",
    aiPlaceholder: "Weekend trip from London",
    chips: ["Any date", "Direct", "Carry-on"],
    cards: [
      { from: "LHR", to: "BCN", date: "Sat 6 Jun", airline: "British Airways", price: "£68", original: "£142" },
      { from: "LGW", to: "LIS", date: "Fri 5 Jun", airline: "easyJet", price: "£54", original: "£119" },
      { from: "STN", to: "BUD", date: "Sat 6 Jun", airline: "Ryanair", price: "£39", original: "£88" },
    ],
  },
  it: {
    title: "Sfoglia",
    aiPlaceholder: "Weekend da Milano",
    chips: ["Qualsiasi data", "Diretto", "Bagaglio a mano"],
    cards: [
      { from: "MXP", to: "BCN", date: "Sab 6 giu", airline: "Vueling", price: "€72", original: "€148" },
      { from: "LIN", to: "LIS", date: "Ven 5 giu", airline: "ITA Airways", price: "€89", original: "€164" },
      { from: "BGY", to: "BUD", date: "Sab 6 giu", airline: "Ryanair", price: "€44", original: "€96" },
    ],
  },
} as const;

const sellCopy = {
  en: {
    title: "Sell your ticket",
    step: "Step 2 of 3 · Review details",
    from: "London Heathrow (LHR)",
    to: "Barcelona (BCN)",
    date: "Sat 6 Jun · 09:25",
    airline: "British Airways · BA478",
    passenger: "1 adult · Economy",
    paid: "Original price £142",
    boost: "Boost visibility · +£2.99",
    publish: "Publish listing",
    autoFilled: "Auto-filled from PDF",
  },
  it: {
    title: "Vendi il tuo biglietto",
    step: "Passo 2 di 3 · Controlla i dettagli",
    from: "Milano Malpensa (MXP)",
    to: "Barcellona (BCN)",
    date: "Sab 6 giu · 09:25",
    airline: "Vueling · VY6321",
    passenger: "1 adulto · Economy",
    paid: "Prezzo originale €148",
    boost: "Aumenta visibilità · +€2,99",
    publish: "Pubblica annuncio",
    autoFilled: "Compilato dal PDF",
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
            className="rounded-xl border border-border/60 bg-secondary/30 p-2.5 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span>{card.from}</span>
                <Plane className="h-3 w-3 text-primary" />
                <span>{card.to}</span>
              </div>
              <Heart className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{card.date} · {card.airline}</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-primary">{card.price}</span>
              <span className="text-[10px] text-muted-foreground line-through">{card.original}</span>
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
      <div className="flex items-center justify-between pb-1">
        <span className="text-sm font-semibold">{c.title}</span>
      </div>
      <p className="text-[10px] text-muted-foreground">{c.step}</p>

      <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          {c.autoFilled}
        </div>
        <div className="mt-2 space-y-1.5 text-xs">
          <Row label={c.from} />
          <Row label={c.to} />
          <Row label={c.date} />
          <Row label={c.airline} />
          <Row label={c.passenger} />
          <Row label={c.paid} muted />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 p-2.5">
        <div className="flex items-center gap-2 text-xs">
          <Rocket className="h-3.5 w-3.5 text-primary" />
          <span>{c.boost}</span>
        </div>
        <div className="h-4 w-7 rounded-full bg-primary/80 p-0.5">
          <div className="ml-auto h-3 w-3 rounded-full bg-background" />
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

function Row({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <CheckCircle2 className={cn("h-3 w-3 shrink-0", muted ? "text-muted-foreground" : "text-primary")} />
      <span className={cn("truncate", muted && "text-muted-foreground")}>{label}</span>
    </div>
  );
}

// Avoid tree-shaking unused icons
export const __keep = [Upload];