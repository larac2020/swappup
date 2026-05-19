// City → airport code(s) and country mapping
export interface CityData {
  city: string;
  country: string;
  airportCode: string;
  airportName: string;
}

  { city: "London", country: "United Kingdom", airportCode: "LGW", airportName: "Gatwick" },
  { city: "London", country: "United Kingdom", airportCode: "STN", airportName: "Stansted" },
  { city: "London", country: "United Kingdom", airportCode: "LTN", airportName: "Luton" },
  { city: "Manchester", country: "United Kingdom", airportCode: "MAN", airportName: "Manchester" },
  { city: "Birmingham", country: "United Kingdom", airportCode: "BHX", airportName: "Birmingham" },
  { city: "Edinburgh", country: "United Kingdom", airportCode: "EDI", airportName: "Edinburgh" },
  { city: "Glasgow", country: "United Kingdom", airportCode: "GLA", airportName: "Glasgow" },
  { city: "Bristol", country: "United Kingdom", airportCode: "BRS", airportName: "Bristol" },
  { city: "Liverpool", country: "United Kingdom", airportCode: "LPL", airportName: "Liverpool" },
  // Spain
  { city: "Barcelona", country: "Spain", airportCode: "BCN", airportName: "El Prat" },
  { city: "Madrid", country: "Spain", airportCode: "MAD", airportName: "Barajas" },
  { city: "Malaga", country: "Spain", airportCode: "AGP", airportName: "Costa del Sol" },
  { city: "Palma de Mallorca", country: "Spain", airportCode: "PMI", airportName: "Son Sant Joan" },
  { city: "Alicante", country: "Spain", airportCode: "ALC", airportName: "Alicante-Elche" },
  { city: "Ibiza", country: "Spain", airportCode: "IBZ", airportName: "Ibiza" },
  { city: "Tenerife", country: "Spain", airportCode: "TFS", airportName: "Tenerife South" },
  // Italy
  { city: "Rome", country: "Italy", airportCode: "FCO", airportName: "Fiumicino" },
  { city: "Milan", country: "Italy", airportCode: "MXP", airportName: "Malpensa" },
  { city: "Milan", country: "Italy", airportCode: "BGY", airportName: "Bergamo" },
  { city: "Venice", country: "Italy", airportCode: "VCE", airportName: "Marco Polo" },
  { city: "Naples", country: "Italy", airportCode: "NAP", airportName: "Capodichino" },
  { city: "Florence", country: "Italy", airportCode: "FLR", airportName: "Peretola" },
  // France
  { city: "Paris", country: "France", airportCode: "CDG", airportName: "Charles de Gaulle" },
  { city: "Paris", country: "France", airportCode: "ORY", airportName: "Orly" },
  { city: "Nice", country: "France", airportCode: "NCE", airportName: "Côte d'Azur" },
  { city: "Lyon", country: "France", airportCode: "LYS", airportName: "Saint-Exupéry" },
  { city: "Marseille", country: "France", airportCode: "MRS", airportName: "Provence" },
  // Germany
  { city: "Berlin", country: "Germany", airportCode: "BER", airportName: "Brandenburg" },
  { city: "Munich", country: "Germany", airportCode: "MUC", airportName: "Franz Josef Strauss" },
  { city: "Frankfurt", country: "Germany", airportCode: "FRA", airportName: "Frankfurt" },
  { city: "Hamburg", country: "Germany", airportCode: "HAM", airportName: "Hamburg" },
  { city: "Düsseldorf", country: "Germany", airportCode: "DUS", airportName: "Düsseldorf" },
  // Netherlands
  { city: "Amsterdam", country: "Netherlands", airportCode: "AMS", airportName: "Schiphol" },
  { city: "Eindhoven", country: "Netherlands", airportCode: "EIN", airportName: "Eindhoven" },
  // Portugal
  { city: "Lisbon", country: "Portugal", airportCode: "LIS", airportName: "Humberto Delgado" },
  { city: "Porto", country: "Portugal", airportCode: "OPO", airportName: "Francisco Sá Carneiro" },
  { city: "Faro", country: "Portugal", airportCode: "FAO", airportName: "Faro" },
  // Greece
  { city: "Athens", country: "Greece", airportCode: "ATH", airportName: "Eleftherios Venizelos" },
  { city: "Santorini", country: "Greece", airportCode: "JTR", airportName: "Santorini" },
  { city: "Mykonos", country: "Greece", airportCode: "JMK", airportName: "Mykonos" },
  { city: "Crete", country: "Greece", airportCode: "HER", airportName: "Heraklion" },
  // Austria
  { city: "Vienna", country: "Austria", airportCode: "VIE", airportName: "Vienna" },
  { city: "Innsbruck", country: "Austria", airportCode: "INN", airportName: "Innsbruck" },
  { city: "Salzburg", country: "Austria", airportCode: "SZG", airportName: "Salzburg" },
  // Ireland
  { city: "Dublin", country: "Ireland", airportCode: "DUB", airportName: "Dublin" },
  { city: "Cork", country: "Ireland", airportCode: "ORK", airportName: "Cork" },
  // Denmark
  { city: "Copenhagen", country: "Denmark", airportCode: "CPH", airportName: "Kastrup" },
  // Sweden
  { city: "Stockholm", country: "Sweden", airportCode: "ARN", airportName: "Arlanda" },
  // Norway
  { city: "Oslo", country: "Norway", airportCode: "OSL", airportName: "Gardermoen" },
  // Switzerland
  { city: "Zurich", country: "Switzerland", airportCode: "ZRH", airportName: "Zurich" },
  { city: "Geneva", country: "Switzerland", airportCode: "GVA", airportName: "Geneva" },
  // Iceland
  { city: "Reykjavik", country: "Iceland", airportCode: "KEF", airportName: "Keflavik" },
  // Turkey
  { city: "Istanbul", country: "Turkey", airportCode: "IST", airportName: "Istanbul" },
  { city: "Antalya", country: "Turkey", airportCode: "AYT", airportName: "Antalya" },
  // Croatia
  { city: "Dubrovnik", country: "Croatia", airportCode: "DBV", airportName: "Dubrovnik" },
  { city: "Split", country: "Croatia", airportCode: "SPU", airportName: "Split" },
  // Poland
  { city: "Warsaw", country: "Poland", airportCode: "WAW", airportName: "Chopin" },
  { city: "Warsaw", country: "Poland", airportCode: "WMI", airportName: "Modlin" },
  { city: "Krakow", country: "Poland", airportCode: "KRK", airportName: "John Paul II" },
  { city: "Gdansk", country: "Poland", airportCode: "GDN", airportName: "Lech Wałęsa" },
  { city: "Wroclaw", country: "Poland", airportCode: "WRO", airportName: "Copernicus" },
  { city: "Poznan", country: "Poland", airportCode: "POZ", airportName: "Ławica" },
  { city: "Katowice", country: "Poland", airportCode: "KTW", airportName: "Katowice" },
  // United States
  { city: "New York", country: "United States", airportCode: "JFK", airportName: "John F. Kennedy" },
  { city: "New York", country: "United States", airportCode: "EWR", airportName: "Newark" },
  { city: "Los Angeles", country: "United States", airportCode: "LAX", airportName: "Los Angeles" },
  { city: "Miami", country: "United States", airportCode: "MIA", airportName: "Miami" },
  { city: "Chicago", country: "United States", airportCode: "ORD", airportName: "O'Hare" },
  // UAE
  { city: "Dubai", country: "United Arab Emirates", airportCode: "DXB", airportName: "Dubai International" },
  { city: "Abu Dhabi", country: "United Arab Emirates", airportCode: "AUH", airportName: "Abu Dhabi" },
  // Thailand
  { city: "Bangkok", country: "Thailand", airportCode: "BKK", airportName: "Suvarnabhumi" },
  { city: "Phuket", country: "Thailand", airportCode: "HKT", airportName: "Phuket" },
  // Japan
  { city: "Tokyo", country: "Japan", airportCode: "NRT", airportName: "Narita" },
  { city: "Tokyo", country: "Japan", airportCode: "HND", airportName: "Haneda" },
  // Hong Kong
  { city: "Hong Kong", country: "Hong Kong", airportCode: "HKG", airportName: "Hong Kong International" },
  // Singapore
  { city: "Singapore", country: "Singapore", airportCode: "SIN", airportName: "Changi" },
  // Morocco
  { city: "Marrakech", country: "Morocco", airportCode: "RAK", airportName: "Menara" },
  // Egypt
  { city: "Cairo", country: "Egypt", airportCode: "CAI", airportName: "Cairo International" },
import { airports as _airports } from "./airports.generated";

// Global dataset of commercial airports (sourced from OpenFlights via scripts/build-airports.mjs).
export const cities: CityData[] = _airports;

// Pre-built lookup maps so helpers stay O(1) on the global dataset (~3300 entries).
const _citiesByCountry = new Map<string, string[]>();
const _airportsByCity = new Map<string, CityData[]>();
const _airportByCode = new Map<string, CityData>();
const _countryByCity = new Map<string, string>();
const _uniqueCities: { city: string; country: string }[] = [];
{
  const seenCity = new Set<string>();
  const tmpByCountry = new Map<string, Set<string>>();
  for (const c of cities) {
    const cityKey = `${c.city}|${c.country}`;
    if (!seenCity.has(cityKey)) {
      seenCity.add(cityKey);
      _uniqueCities.push({ city: c.city, country: c.country });
      if (!_countryByCity.has(c.city)) _countryByCity.set(c.city, c.country);
    }
    if (!tmpByCountry.has(c.country)) tmpByCountry.set(c.country, new Set());
    tmpByCountry.get(c.country)!.add(c.city);
    if (!_airportsByCity.has(c.city)) _airportsByCity.set(c.city, []);
    _airportsByCity.get(c.city)!.push(c);
    _airportByCode.set(c.airportCode, c);
  }
  for (const [country, set] of tmpByCountry) {
    _citiesByCountry.set(country, [...set].sort());
  }
}
const _countries = [..._citiesByCountry.keys()].sort();

// Get unique cities (first airport per city)
export function getUniqueCities(): { city: string; country: string }[] {
  return _uniqueCities;
}

// Get unique countries
export function getCountries(): string[] {
  return _countries;
}

// Get cities for a given country
export function getCitiesByCountry(country: string): string[] {
  return _citiesByCountry.get(country) ?? [];
}

// Get the country for a given city
export function getCountryForCity(city: string): string | undefined {
  return _countryByCity.get(city);
}

// Get airport code(s) for a city
export function getAirportCodesForCity(city: string): CityData[] {
  return _airportsByCity.get(city) ?? [];
}

// Get first airport code for a city (for display)
export function getPrimaryAirportCode(city: string): string {
  return _airportsByCity.get(city)?.[0]?.airportCode ?? "";
}

// Get primary airport name for a city
export function getPrimaryAirportName(city: string): string {
  return _airportsByCity.get(city)?.[0]?.airportName ?? "";
}

// Lookup airport name by IATA code
export function getAirportNameByCode(code: string | null | undefined): string {
  if (!code) return "";
  return _airportByCode.get(code)?.airportName ?? "";
}

// Airlines with typical name change fees
export interface AirlineData {
  name: string;
  nameChangeFee: number | null; // null = not allowed
  nameChangeFeeNote: string;
}

export const airlines: AirlineData[] = [
  { name: "Ryanair", nameChangeFee: 115, nameChangeFeeNote: "Online name change up to €115 per flight per person" },
  { name: "EasyJet", nameChangeFee: 25, nameChangeFeeNote: "Name change from £25 / €25 per person per flight" },
  { name: "British Airways", nameChangeFee: 0, nameChangeFeeNote: "Free name correction for minor spelling errors. Full name change not permitted" },
  { name: "Wizz Air", nameChangeFee: 55, nameChangeFeeNote: "Name change from €55 per person per flight segment" },
  { name: "Vueling", nameChangeFee: 50, nameChangeFeeNote: "Name change from €50 per person per booking" },
  { name: "KLM", nameChangeFee: 50, nameChangeFeeNote: "Name correction possible; fees vary by fare class" },
  { name: "Air France", nameChangeFee: 60, nameChangeFeeNote: "Name correction possible; fees vary by fare class" },
  { name: "Lufthansa", nameChangeFee: 50, nameChangeFeeNote: "Name correction possible for minor errors; fees apply" },
  { name: "Aer Lingus", nameChangeFee: 30, nameChangeFeeNote: "Name change from €30 per person per booking" },
  { name: "Jet2", nameChangeFee: 25, nameChangeFeeNote: "Name change from £25 per person per flight" },
  { name: "TUI", nameChangeFee: 25, nameChangeFeeNote: "Name change from £25 per person" },
  { name: "Volotea", nameChangeFee: 40, nameChangeFeeNote: "Name change from €40 per person per flight" },
  { name: "Iberia", nameChangeFee: 0, nameChangeFeeNote: "Minor spelling corrections only; full name change not allowed" },
  { name: "TAP Portugal", nameChangeFee: 50, nameChangeFeeNote: "Name correction possible; fees vary" },
  { name: "SAS", nameChangeFee: 50, nameChangeFeeNote: "Name correction from €50 per person" },
  { name: "Norwegian", nameChangeFee: 55, nameChangeFeeNote: "Name change from €55 per person per flight" },
  { name: "Swiss", nameChangeFee: 50, nameChangeFeeNote: "Name correction possible; fees vary" },
  { name: "Turkish Airlines", nameChangeFee: 50, nameChangeFeeNote: "Name correction from $50 per person" },
  { name: "Emirates", nameChangeFee: 0, nameChangeFeeNote: "Minor spelling corrections only; full name change typically not allowed" },
  { name: "Qatar Airways", nameChangeFee: 0, nameChangeFeeNote: "Minor corrections permitted free of charge" },
  { name: "Etihad", nameChangeFee: 0, nameChangeFeeNote: "Minor spelling corrections only" },
  { name: "Cathay Pacific", nameChangeFee: 0, nameChangeFeeNote: "Minor corrections only; full name change not permitted" },
  { name: "Singapore Airlines", nameChangeFee: 0, nameChangeFeeNote: "Minor corrections only" },
  { name: "Icelandair", nameChangeFee: 50, nameChangeFeeNote: "Name change from €50 per person" },
  { name: "Eurowings", nameChangeFee: 50, nameChangeFeeNote: "Name correction from €50 per person" },
  { name: "Transavia", nameChangeFee: 40, nameChangeFeeNote: "Name change from €40 per person per booking" },
];

export function getAirlineData(name: string): AirlineData | undefined {
  return airlines.find((a) => a.name.toLowerCase() === name.toLowerCase());
}
