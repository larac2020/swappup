// Train operators with transferability rules and stations.
// Used to gate listing creation for non-transferable fares and to compute
// the additive name-change fee shown to buyers.

export type TransferStatus = "yes" | "restricted" | "no";

export interface TrainFare {
  value: string;
  label: string;
  fee: number;
  currency: "EUR" | "GBP" | "CHF";
  transferable: TransferStatus;
  note?: string;
}

export interface TrainOperator {
  name: string;
  country: string;
  fares: TrainFare[];
  /** Public name-change policy URL for the buyer/seller warning. */
  policyUrl: string;
}

export const trainOperators: TrainOperator[] = [
  {
    name: "Trenitalia",
    country: "Italy",
    policyUrl: "https://www.trenitalia.com",
    fares: [
      { value: "base", label: "Base", fee: 8, currency: "EUR", transferable: "yes", note: "Name change allowed up to departure" },
      { value: "executive", label: "Executive", fee: 15, currency: "EUR", transferable: "yes", note: "Premium fare, higher fee" },
    ],
  },
  {
    name: "Italo",
    country: "Italy",
    policyUrl: "https://www.italotreno.it",
    fares: [
      { value: "smart", label: "Smart", fee: 10, currency: "EUR", transferable: "yes", note: "Name change up to 3 days before departure" },
      { value: "comfort", label: "Comfort", fee: 10, currency: "EUR", transferable: "yes" },
      { value: "prima", label: "Prima", fee: 10, currency: "EUR", transferable: "yes" },
      { value: "club", label: "Club Executive", fee: 10, currency: "EUR", transferable: "yes" },
    ],
  },
  {
    name: "SNCF",
    country: "France",
    policyUrl: "https://www.sncf-connect.com",
    fares: [
      { value: "tgv_inoui", label: "TGV INOUI", fee: 19, currency: "EUR", transferable: "yes", note: "Name change with fee" },
      { value: "ouigo", label: "Ouigo", fee: 0, currency: "EUR", transferable: "no", note: "Not transferable — Ouigo tickets are nominative" },
    ],
  },
  {
    name: "Deutsche Bahn",
    country: "Germany",
    policyUrl: "https://www.bahn.com",
    fares: [
      { value: "flexpreis", label: "Flexpreis", fee: 0, currency: "EUR", transferable: "yes", note: "Fully flexible, transferable" },
      { value: "sparpreis", label: "Sparpreis", fee: 0, currency: "EUR", transferable: "no", note: "Not transferable — Sparpreis is nominative" },
    ],
  },
  {
    name: "Renfe",
    country: "Spain",
    policyUrl: "https://www.renfe.com",
    fares: [
      { value: "flexible", label: "Flexible (AVE)", fee: 20, currency: "EUR", transferable: "yes", note: "Name change with fee" },
      { value: "promo", label: "Promo", fee: 0, currency: "EUR", transferable: "no", note: "Not transferable — Promo fares are non-changeable" },
    ],
  },
  {
    name: "Eurostar",
    country: "United Kingdom",
    policyUrl: "https://www.eurostar.com",
    fares: [
      { value: "premier", label: "Standard Premier", fee: 30, currency: "GBP", transferable: "yes", note: "Name change with fee" },
      { value: "business", label: "Business Premier", fee: 30, currency: "GBP", transferable: "yes" },
      { value: "standard", label: "Standard", fee: 0, currency: "GBP", transferable: "no", note: "Not transferable — Standard tickets are nominative" },
    ],
  },
  {
    name: "ÖBB",
    country: "Austria",
    policyUrl: "https://www.oebb.at",
    fares: [
      { value: "flex", label: "Flex (Railjet)", fee: 0, currency: "EUR", transferable: "yes", note: "Fully transferable" },
      { value: "sparschiene", label: "Sparschiene", fee: 0, currency: "EUR", transferable: "no", note: "Not transferable — Sparschiene is nominative" },
    ],
  },
  {
    name: "NS",
    country: "Netherlands",
    policyUrl: "https://www.ns.nl",
    fares: [
      { value: "standard", label: "Standard day ticket", fee: 0, currency: "EUR", transferable: "yes", note: "Day tickets are non-nominative and freely transferable" },
    ],
  },
  {
    name: "SBB",
    country: "Switzerland",
    policyUrl: "https://www.sbb.ch",
    fares: [
      { value: "standard", label: "Standard", fee: 0, currency: "CHF", transferable: "yes", note: "Standard tickets are transferable" },
      { value: "saver", label: "Saver / Supersaver", fee: 0, currency: "CHF", transferable: "no", note: "Not transferable — Saver tickets are nominative" },
    ],
  },
  {
    name: "Thalys",
    country: "Belgium",
    policyUrl: "https://www.thalys.com",
    fares: [
      { value: "comfort", label: "Comfort", fee: 25, currency: "EUR", transferable: "yes", note: "Name change with fee" },
      { value: "premium", label: "Premium", fee: 25, currency: "EUR", transferable: "yes" },
      { value: "standard", label: "Standard", fee: 0, currency: "EUR", transferable: "no", note: "Not transferable — Standard tickets are nominative" },
    ],
  },
  {
    name: "PKP Intercity",
    country: "Poland",
    policyUrl: "https://www.intercity.pl",
    fares: [
      { value: "flexi", label: "Flexi", fee: 0, currency: "EUR", transferable: "yes", note: "Flexi fares are transferable" },
      { value: "promo", label: "Promo", fee: 0, currency: "EUR", transferable: "no", note: "Not transferable — Promo fares are nominative" },
    ],
  },
];

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
  return currency === "GBP" ? "£" : currency === "CHF" ? "CHF " : "€";
}