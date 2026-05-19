// City → airport code(s) and country mapping
export interface CityData {
  city: string;
  country: string;
  airportCode: string;
  airportName: string;
}

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
