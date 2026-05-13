// Train operators with transferability rules and stations.
// Used to gate listing creation for non-transferable fares and to compute
// the additive name-change fee shown to buyers.
//
// IMPORTANT — most major European rail operators have moved to fully nominative
// tickets (Trenitalia, Italo, Eurostar Standard, Renfe Promo, DB Sparpreis,
// SBB Saver, ÖBB Sparschiene, PKP Promo, etc.). We mirror operators' published
// 2024–2025 policies; flexible fares that still allow transfer keep
// `transferable: "yes"`.

export type TransferStatus = "yes" | "restricted" | "no";

export interface TrainFare {
  value: string;
  label: string;
  fee: number;
  currency: "EUR" | "GBP" | "CHF" | "PLN";
  transferable: TransferStatus;
  note?: string;
}

export interface TrainOperator {
  name: string;
  country: string;
  fares: TrainFare[];
  /** Train product types this operator runs (Frecciarossa, ICE, TGV, etc.) */
  trainTypes: string[];
  /** Default ticket currency for this operator. */
  currency: "EUR" | "GBP" | "CHF" | "PLN";
  /** Operator-specific train-number placeholder shown in the Sell form. */
  trainNumberPlaceholder?: string;
  /** Public name-change policy URL for the buyer/seller warning. */
  policyUrl: string;
}

export const trainOperators: TrainOperator[] = [
  {
    name: "Trenitalia",
    country: "Italy",
    currency: "EUR",
    trainTypes: ["Frecciarossa", "Frecciargento", "Frecciabianca", "Intercity", "Intercity Notte", "Regionale Veloce", "Regionale", "Eurocity"],
    trainNumberPlaceholder: "e.g. FR 9612",
    policyUrl: "https://www.trenitalia.com",
    fares: [
      { value: "base", label: "Base (Standard service)", fee: 0, currency: "EUR", transferable: "no", note: "Trenitalia tickets are nominative — name change is not allowed by the carrier" },
      { value: "economy", label: "Economy (Standard service)", fee: 0, currency: "EUR", transferable: "no", note: "Trenitalia tickets are nominative — name change is not allowed by the carrier" },
      { value: "super_economy", label: "Super Economy (Standard service)", fee: 0, currency: "EUR", transferable: "no", note: "Trenitalia tickets are nominative — name change is not allowed by the carrier" },
      { value: "premium", label: "Premium service", fee: 0, currency: "EUR", transferable: "no", note: "Premium service tickets are nominative — name change is not allowed" },
      { value: "business", label: "Business service", fee: 0, currency: "EUR", transferable: "no", note: "Business service tickets are nominative — name change is not allowed" },
      { value: "executive", label: "Executive service", fee: 0, currency: "EUR", transferable: "no", note: "Executive service tickets are nominative — name change is not allowed" },
      { value: "salottino", label: "Salottino", fee: 0, currency: "EUR", transferable: "no", note: "Salottino tickets are nominative" },
    ],
  },
  {
    name: "Italo",
    country: "Italy",
    currency: "EUR",
    trainTypes: ["Italo AGV", "Italo EVO"],
    trainNumberPlaceholder: "e.g. 9912",
    policyUrl: "https://www.italotreno.it",
    fares: [
      { value: "smart", label: "Smart", fee: 0, currency: "EUR", transferable: "no", note: "Italo tickets are nominative — name change is not allowed by the carrier" },
      { value: "comfort", label: "Comfort", fee: 0, currency: "EUR", transferable: "no", note: "Italo tickets are nominative — name change is not allowed by the carrier" },
      { value: "prima", label: "Prima", fee: 0, currency: "EUR", transferable: "no", note: "Italo tickets are nominative — name change is not allowed by the carrier" },
      { value: "club", label: "Club Executive", fee: 0, currency: "EUR", transferable: "no", note: "Italo tickets are nominative — name change is not allowed by the carrier" },
    ],
  },
  {
    name: "SNCF",
    country: "France",
    currency: "EUR",
    trainTypes: ["TGV INOUI", "TGV Ouigo", "Intercités", "TER"],
    trainNumberPlaceholder: "e.g. 6201",
    policyUrl: "https://www.sncf-connect.com",
    fares: [
      { value: "tgv_inoui_loisir", label: "TGV INOUI — Loisir", fee: 19, currency: "EUR", transferable: "yes", note: "Name change allowed for a fee" },
      { value: "tgv_inoui_pro", label: "TGV INOUI — Pro", fee: 0, currency: "EUR", transferable: "yes", note: "Pro tariff is fully flexible and transferable" },
      { value: "intercites", label: "Intercités", fee: 5, currency: "EUR", transferable: "yes", note: "Name change up to 30 min before departure for a fee" },
      { value: "ter", label: "TER (regional)", fee: 0, currency: "EUR", transferable: "yes", note: "TER regional tickets are typically not nominative" },
      { value: "ouigo", label: "Ouigo", fee: 0, currency: "EUR", transferable: "no", note: "Ouigo tickets are nominative and not transferable" },
    ],
  },
  {
    name: "Deutsche Bahn",
    country: "Germany",
    currency: "EUR",
    trainTypes: ["ICE", "IC", "EC", "RE", "RB"],
    trainNumberPlaceholder: "e.g. ICE 925",
    policyUrl: "https://www.bahn.com",
    fares: [
      { value: "flexpreis", label: "Flexpreis", fee: 0, currency: "EUR", transferable: "yes", note: "Fully flexible — not bound to a person" },
      { value: "sparpreis", label: "Sparpreis", fee: 0, currency: "EUR", transferable: "no", note: "Sparpreis is nominative and not transferable" },
      { value: "super_sparpreis", label: "Super Sparpreis", fee: 0, currency: "EUR", transferable: "no", note: "Super Sparpreis is nominative and not transferable" },
    ],
  },
  {
    name: "Renfe",
    country: "Spain",
    currency: "EUR",
    trainTypes: ["AVE", "AVLO", "Avant", "Alvia", "Euromed", "Intercity"],
    trainNumberPlaceholder: "e.g. AVE 03085",
    policyUrl: "https://www.renfe.com",
    fares: [
      { value: "premium", label: "Prémium (AVE)", fee: 20, currency: "EUR", transferable: "yes", note: "Name change allowed for a fee" },
      { value: "elige", label: "Elige (AVE)", fee: 20, currency: "EUR", transferable: "yes", note: "Name change allowed for a fee" },
      { value: "basico", label: "Básico (AVE)", fee: 0, currency: "EUR", transferable: "no", note: "Básico fares are nominative and not transferable" },
      { value: "avlo", label: "AVLO", fee: 0, currency: "EUR", transferable: "no", note: "AVLO low-cost tickets are nominative and not transferable" },
    ],
  },
  {
    name: "Eurostar",
    country: "United Kingdom",
    currency: "GBP",
    trainTypes: ["Eurostar e320", "Eurostar e300"],
    trainNumberPlaceholder: "e.g. 9114",
    policyUrl: "https://www.eurostar.com",
    fares: [
      { value: "standard", label: "Eurostar Standard", fee: 0, currency: "GBP", transferable: "no", note: "Standard tickets are nominative — name change not allowed" },
      { value: "plus", label: "Eurostar Plus", fee: 30, currency: "GBP", transferable: "yes", note: "Name change allowed for a fee" },
      { value: "premier", label: "Eurostar Premier", fee: 30, currency: "GBP", transferable: "yes", note: "Name change allowed for a fee" },
    ],
  },
  {
    name: "ÖBB",
    country: "Austria",
    currency: "EUR",
    trainTypes: ["Railjet", "Nightjet", "ICE", "EC", "IC", "REX"],
    trainNumberPlaceholder: "e.g. RJ 540",
    policyUrl: "https://www.oebb.at",
    fares: [
      { value: "standard", label: "Standard (flexible)", fee: 0, currency: "EUR", transferable: "yes", note: "Standard ÖBB tickets are not nominative" },
      { value: "sparschiene", label: "Sparschiene", fee: 0, currency: "EUR", transferable: "no", note: "Sparschiene is nominative and not transferable" },
    ],
  },
  {
    name: "NS",
    country: "Netherlands",
    currency: "EUR",
    trainTypes: ["Intercity Direct", "Intercity", "Sprinter"],
    trainNumberPlaceholder: "e.g. 822",
    policyUrl: "https://www.ns.nl",
    fares: [
      { value: "standard", label: "Standard day ticket", fee: 0, currency: "EUR", transferable: "yes", note: "Day tickets are non-nominative and freely transferable" },
    ],
  },
  {
    name: "SBB",
    country: "Switzerland",
    currency: "CHF",
    trainTypes: ["IC", "IR", "RE", "S", "EC"],
    trainNumberPlaceholder: "e.g. IC 5",
    policyUrl: "https://www.sbb.ch",
    fares: [
      { value: "standard", label: "Standard", fee: 0, currency: "CHF", transferable: "yes", note: "Standard SBB tickets are not nominative" },
      { value: "saver", label: "Saver / Supersaver", fee: 0, currency: "CHF", transferable: "no", note: "Saver day passes are nominative and not transferable" },
    ],
  },
  {
    name: "PKP Intercity",
    country: "Poland",
    currency: "PLN",
    trainTypes: ["Express InterCity Premium (EIP)", "Express InterCity (EIC)", "InterCity (IC)", "TLK"],
    trainNumberPlaceholder: "e.g. EIP 1300",
    policyUrl: "https://www.intercity.pl",
    fares: [
      { value: "flexi", label: "Flexi", fee: 0, currency: "PLN", transferable: "yes", note: "Flexi fares are transferable" },
      { value: "promo", label: "Promo", fee: 0, currency: "PLN", transferable: "no", note: "Promo fares are nominative and not transferable" },
    ],
  },
];

// Thalys merged into Eurostar in October 2023. Keep the name as a deprecated
// alias so historical PDFs and old listings still resolve correctly.
export const operatorAliases: Record<string, string> = {
  thalys: "Eurostar",
  trenord: "Trenitalia",
  "renfe sncf": "SNCF",
  db: "Deutsche Bahn",
  "deutsche bahn ag": "Deutsche Bahn",
};

// Major European train stations (city + station code).
export interface TrainStation {
  city: string;
  country: string;
  stationCode: string;
  stationName: string;
}

export const trainStations: TrainStation[] = [
  // Italy
  { city: "Milan", country: "Italy", stationCode: "MIL", stationName: "Milano Centrale" },
  { city: "Rome", country: "Italy", stationCode: "ROM", stationName: "Roma Termini" },
  { city: "Florence", country: "Italy", stationCode: "FLR", stationName: "Firenze S.M.N." },
  { city: "Venice", country: "Italy", stationCode: "VCE", stationName: "Venezia Santa Lucia" },
  { city: "Naples", country: "Italy", stationCode: "NAP", stationName: "Napoli Centrale" },
  { city: "Turin", country: "Italy", stationCode: "TRN", stationName: "Torino Porta Nuova" },
  { city: "Bologna", country: "Italy", stationCode: "BLQ", stationName: "Bologna Centrale" },
  // France
  { city: "Paris", country: "France", stationCode: "PAR", stationName: "Paris Gare du Nord" },
  { city: "Paris", country: "France", stationCode: "PLY", stationName: "Paris Gare de Lyon" },
  { city: "Lyon", country: "France", stationCode: "LYS", stationName: "Lyon Part-Dieu" },
  { city: "Marseille", country: "France", stationCode: "MRS", stationName: "Marseille Saint-Charles" },
  { city: "Bordeaux", country: "France", stationCode: "BDX", stationName: "Bordeaux Saint-Jean" },
  // Germany
  { city: "Berlin", country: "Germany", stationCode: "BER", stationName: "Berlin Hauptbahnhof" },
  { city: "Munich", country: "Germany", stationCode: "MUC", stationName: "München Hbf" },
  { city: "Frankfurt", country: "Germany", stationCode: "FRA", stationName: "Frankfurt Hbf" },
  { city: "Hamburg", country: "Germany", stationCode: "HAM", stationName: "Hamburg Hbf" },
  { city: "Cologne", country: "Germany", stationCode: "CGN", stationName: "Köln Hbf" },
  // Spain
  { city: "Madrid", country: "Spain", stationCode: "MAD", stationName: "Madrid Atocha" },
  { city: "Barcelona", country: "Spain", stationCode: "BCN", stationName: "Barcelona Sants" },
  { city: "Seville", country: "Spain", stationCode: "SEV", stationName: "Sevilla Santa Justa" },
  { city: "Valencia", country: "Spain", stationCode: "VAL", stationName: "Valencia Joaquín Sorolla" },
  // United Kingdom
  { city: "London", country: "United Kingdom", stationCode: "LON", stationName: "London St Pancras" },
  { city: "Manchester", country: "United Kingdom", stationCode: "MAN", stationName: "Manchester Piccadilly" },
  { city: "Edinburgh", country: "United Kingdom", stationCode: "EDI", stationName: "Edinburgh Waverley" },
  // Austria
  { city: "Vienna", country: "Austria", stationCode: "VIE", stationName: "Wien Hauptbahnhof" },
  { city: "Salzburg", country: "Austria", stationCode: "SZG", stationName: "Salzburg Hbf" },
  // Netherlands
  { city: "Amsterdam", country: "Netherlands", stationCode: "AMS", stationName: "Amsterdam Centraal" },
  { city: "Rotterdam", country: "Netherlands", stationCode: "RTM", stationName: "Rotterdam Centraal" },
  // Switzerland
  { city: "Zurich", country: "Switzerland", stationCode: "ZRH", stationName: "Zürich HB" },
  { city: "Geneva", country: "Switzerland", stationCode: "GVA", stationName: "Genève Cornavin" },
  // Belgium
  { city: "Brussels", country: "Belgium", stationCode: "BRU", stationName: "Brussels-Midi" },
  // Poland
  { city: "Warsaw", country: "Poland", stationCode: "WAW", stationName: "Warszawa Centralna" },
  { city: "Krakow", country: "Poland", stationCode: "KRK", stationName: "Kraków Główny" },
  { city: "Gdansk", country: "Poland", stationCode: "GDN", stationName: "Gdańsk Główny" },
  { city: "Wroclaw", country: "Poland", stationCode: "WRO", stationName: "Wrocław Główny" },
  { city: "Poznan", country: "Poland", stationCode: "POZ", stationName: "Poznań Główny" },
];

export function getTrainCountries(): string[] {
  return [...new Set(trainStations.map((s) => s.country))].sort();
}

export function getTrainCitiesByCountry(country: string): string[] {
  return [...new Set(trainStations.filter((s) => s.country === country).map((s) => s.city))].sort();
}

export function getStationsForCity(city: string): TrainStation[] {
  return trainStations.filter((s) => s.city === city);
}

export function getPrimaryStationCode(city: string): string {
  return trainStations.find((s) => s.city === city)?.stationCode ?? "";
}

export function getPrimaryStationName(city: string): string {
  return trainStations.find((s) => s.city === city)?.stationName ?? "";
}

export function getOperator(name: string): TrainOperator | undefined {
  return trainOperators.find((o) => o.name.toLowerCase() === name.toLowerCase());
}

export function getOperatorFare(operator: string, fareValue: string): TrainFare | undefined {
  return getOperator(operator)?.fares.find((f) => f.value === fareValue);
}

export function currencySymbol(currency: string): string {
  switch (currency) {
    case "GBP": return "£";
    case "CHF": return "CHF ";
    case "PLN": return "zł ";
    case "USD": return "$";
    default: return "€";
  }
}

/**
 * Resolve an operator name from free-form input (e.g. AI-extracted text).
 * Handles operator aliases (Thalys → Eurostar) and case-insensitive matches.
 */
export function resolveOperatorName(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const norm = raw.trim().toLowerCase();
  if (!norm) return undefined;
  if (operatorAliases[norm]) return operatorAliases[norm];
  const direct = trainOperators.find((o) => o.name.toLowerCase() === norm);
  if (direct) return direct.name;
  // Loose contains-match (e.g. "Trenitalia S.p.A." → "Trenitalia").
  const loose = trainOperators.find((o) =>
    norm.includes(o.name.toLowerCase()) || o.name.toLowerCase().includes(norm)
  );
  return loose?.name;
}

/**
 * Resolve a fare value from a free-form fare label (case-insensitive,
 * matches against both the canonical value and the human label).
 */
export function resolveFareValue(operatorName: string, raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const op = getOperator(operatorName);
  if (!op) return undefined;
  const norm = raw.trim().toLowerCase();
  const direct = op.fares.find(
    (f) => f.value.toLowerCase() === norm || f.label.toLowerCase() === norm,
  );
  if (direct) return direct.value;
  return op.fares.find((f) => norm.includes(f.value.toLowerCase()) || norm.includes(f.label.toLowerCase()))?.value;
}

/** Resolve a printed train type to one of the operator's known types. */
export function resolveTrainType(operatorName: string, raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const op = getOperator(operatorName);
  if (!op) return raw;
  const norm = raw.trim().toLowerCase();
  return op.trainTypes.find((t) => t.toLowerCase() === norm || norm.includes(t.toLowerCase())) ?? raw;
}