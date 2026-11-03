import { NextResponse } from "next/server";
import { HttpError } from "./http";

/**
 * Klien Travelpayouts (server-side saja).
 *
 * Token hanya dibaca dari environment dan tidak pernah dikirim ke browser.
 * Semua permintaan dibatasi waktu dan gagal dengan tenang: beranda/halaman
 * kategori tetap tampil walau API mitra sedang gangguan.
 */

const API = "https://api.travelpayouts.com";

export const affiliateMarker = process.env.TRAVELPAYOUTS_MARKER ?? "";

export type Deal = {
  origin: string;
  destination: string;
  city: string;
  departDate: string;
  returnDate: string | null;
  priceIdr: number;
  gate: string;
  changes: number;
  foundAt: string;
  link: string;
};

type Route = { origin: string; destination: string; city: string };

/** Rute yang ditampilkan; kode kota mengikuti IATA yang dipakai Travelpayouts. */
export const dealRoutes: Route[] = [
  { origin: "CGK", destination: "MED", city: "Madinah" },
  { origin: "CGK", destination: "JED", city: "Jeddah" },
  { origin: "CGK", destination: "DPS", city: "Denpasar" },
  { origin: "CGK", destination: "SIN", city: "Singapura" },
];

function token() {
  const value = process.env.TRAVELPAYOUTS_TOKEN;
  if (!value) throw new HttpError(503, "Integrasi harga belum dikonfigurasi.");
  return value;
}

/** Tanggal Aviasales: {ORIGIN}{DDMM}{DEST}{ADULTS}, satu arah. */
export function flightSearchLink(origin: string, destination: string, departDate: string) {
  const [, month = "01", day = "01"] = departDate.split("-");
  const path = `${origin}${day}${month}${destination}1`;
  const params = new URLSearchParams({ adults: "1", currency: "idr", locale: "id" });
  if (affiliateMarker) params.set("marker", affiliateMarker);
  return `https://www.aviasales.com/search/${path}?${params.toString()}`;
}

export function hotelSearchLink(city: string) {
  const params = new URLSearchParams({ location: city, adults: "2", currency: "idr", lang: "id" });
  if (affiliateMarker) params.set("marker", affiliateMarker);
  return `https://search.hotellook.com/hotels?${params.toString()}`;
}

async function request<T>(path: string): Promise<T> {
  const url = new URL(path, API);
  url.searchParams.set("token", token());
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 900 },
    });
    if (!response.ok) throw new HttpError(502, "Harga mitra belum dapat dimuat.");
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(504, "Harga mitra tidak merespons tepat waktu.");
  } finally {
    clearTimeout(timer);
  }
}

type LatestResponse = {
  currency?: string;
  success?: boolean;
  data?: Array<{
    origin?: string;
    destination?: string;
    depart_date?: string;
    return_date?: string;
    value?: number;
    gate?: string;
    number_of_changes?: number;
    found_at?: string;
    actual?: boolean;
  }>;
};

async function dealsForRoute(route: Route): Promise<Deal[]> {
  const search = new URLSearchParams({
    origin: route.origin,
    destination: route.destination,
    period_type: "year",
    page: "1",
    limit: "3",
    show_to_affiliates: "true",
    sorting: "price",
    currency: "idr",
  });
  const body = await request<LatestResponse>(`/v2/prices/latest?${search.toString()}`);
  return (body.data ?? [])
    .filter((row) => typeof row.value === "number" && row.value > 0 && row.depart_date)
    .map((row) => ({
      origin: route.origin,
      destination: route.destination,
      city: route.city,
      departDate: row.depart_date as string,
      returnDate: row.return_date || null,
      priceIdr: row.value as number,
      gate: row.gate ?? "Mitra Travelpayouts",
      changes: row.number_of_changes ?? 0,
      foundAt: row.found_at ?? "",
      link: flightSearchLink(route.origin, route.destination, row.depart_date as string),
    }));
}

/**
 * Ambil harga terbaru untuk semua rute. Satu rute gagal tidak menggagalkan
 * rute lain, dan kegagalan total hanya menghasilkan daftar kosong.
 */
export async function cheapestDeals(): Promise<{ deals: Deal[]; error: string | null }> {
  if (!process.env.TRAVELPAYOUTS_TOKEN) return { deals: [], error: "unconfigured" };
  const results = await Promise.allSettled(dealRoutes.map(dealsForRoute));
  const collected: Deal[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") collected.push(...result.value);
  }

  // Satu kartu per destinasi (harga termurah), supaya rute mahal seperti
  // Madinah/Jeddah tetap tampil dan tidak tertutup rute murah seperti Bali.
  const cheapestPerRoute = new Map<string, Deal>();
  for (const deal of collected) {
    const key = `${deal.origin}-${deal.destination}`;
    const current = cheapestPerRoute.get(key);
    if (!current || deal.priceIdr < current.priceIdr) cheapestPerRoute.set(key, deal);
  }

  const deals = [...cheapestPerRoute.values()].sort((a, b) => a.priceIdr - b.priceIdr);
  return { deals: deals.slice(0, 6), error: deals.length ? null : "unavailable" };
}

export function unavailableResponse(error: unknown) {
  const status = error instanceof HttpError ? error.status : 500;
  return NextResponse.json(
    { error: "Harga mitra belum dapat dimuat.", deals: [] },
    { status },
  );
}
/* ------------------------------------------------------------------ *
 * Pencarian tiket berbentuk daftar (Fase 1 di ROADMAP.md)
 * ------------------------------------------------------------------ */

/** Nama populer untuk kode IATA; API referensi maskapai tidak tersedia (404). */
const AIRLINES: Record<string, string> = {
  GA: "Garuda Indonesia", QZ: "AirAsia Indonesia", AK: "AirAsia", QG: "Citilink",
  JT: "Lion Air", ID: "Batik Air", IU: "Super Air Jet", IW: "Wings Air",
  SJ: "Sriwijaya Air", EY: "Etihad Airways", EK: "Emirates", QR: "Qatar Airways",
  TK: "Turkish Airlines", SV: "Saudia", MH: "Malaysia Airlines", SQ: "Singapore Airlines",
  TR: "Scoot", CZ: "China Southern", MU: "China Eastern", WY: "Oman Air",
  TG: "Thai Airways", CX: "Cathay Pacific", CI: "China Airlines", BR: "EVA Air",
  D7: "AirAsia X", FD: "Thai AirAsia", VN: "Vietnam Airlines", "8B": "TransNusa",
};

const CITIES: Record<string, string> = {
  CGK: "Jakarta", JKT: "Jakarta", DPS: "Bali (Denpasar)", MED: "Madinah",
  JED: "Jeddah", MKX: "Mekkah", SIN: "Singapura", KUL: "Kuala Lumpur",
  SUB: "Surabaya", KNO: "Medan", UPG: "Makassar", BDJ: "Banjarmasin",
  PEN: "Penang", LOP: "Lombok", TYO: "Tokyo", OSA: "Osaka", ICN: "Seoul",
  HKG: "Hong Kong", BKK: "Bangkok", DOH: "Doha", AUH: "Abu Dhabi",
  DXB: "Dubai", IST: "Istanbul", LHR: "London", AMS: "Amsterdam",
  CDG: "Paris", SYD: "Sydney", MEL: "Melbourne", PER: "Perth",
};

export const airlineName = (code: string) => AIRLINES[code?.toUpperCase()] ?? code;

/** Nama kota IATA (dipakai label hasil); fallback ke kode apa adanya. */
export const cityName = (code: string) => {
  const key = code?.toUpperCase() ?? "";
  return CITIES[key] ?? key;
};

/** "Jakarta (CGK)" atau "cgk" -> "CGK". */
export function toIata(value: string | undefined | null): string {
  if (!value) return "";
  const inParens = /\(([A-Za-z]{3})\)/.exec(value);
  if (inParens) return inParens[1].toUpperCase();
  const bare = /^\s*([A-Za-z]{3})\s*$/.exec(value);
  if (bare) return bare[1].toUpperCase();
  const letters = value.replace(/[^A-Za-z]/g, "");
  return letters.slice(0, 3).toUpperCase();
}

export type FlightOffer = {
  id: string;
  airlineCode: string;
  airlineName: string;
  origin: string;
  destination: string;
  departAt: string;
  arriveAt: string | null;
  durationMin: number;
  transfers: number;
  gate: string;
  priceIdr: number;
  link: string;
  source: "matrix" | "cheap";
};

/** Link matrix berupa path relatif; jadikan absolut dan pastikan ada marker. */
export function absoluteAffiliateLink(value: string): string {
  const url = new URL(value, "https://www.aviasales.com");
  if (affiliateMarker && !url.searchParams.has("marker")) {
    url.searchParams.set("marker", affiliateMarker);
  }
  return url.toString();
}

type MatrixResponse = {
  prices?: Array<{
    link?: string;
    origin?: string;
    destination?: string;
    gate?: string;
    main_airline?: string;
    depart_date?: string;
    price?: number;
    transfers?: number;
    duration?: number;
  }>;
};

type CheapResponse = {
  success?: boolean;
  currency?: string;
  data?: Record<string, Record<string, {
    airline?: string;
    departure_at?: string;
    return_at?: string;
    price?: number;
    flight_number?: number;
    duration?: number;
    duration_to?: number;
    expires_at?: string;
  }>>;
};

const minutesToIso = (startIso: string, minutes: number) => {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime()) || !Number.isFinite(minutes)) return null;
  return new Date(start.getTime() + minutes * 60_000).toISOString();
};

/**
 * Daftar tawaran untuk satu rute/tanggal.
 *
 * Sumber utama matrix (kaya: partner, jam, durasi, deep link). Bila kosong,
 * mundur ke `prices/cheap` yang hanya memberi satu harga per jumlah transit.
 */
export async function searchFlights(input: {
  from: string;
  to: string;
  date?: string;
  cabin?: string;
}): Promise<FlightOffer[]> {
  const from = toIata(input.from);
  const to = toIata(input.to);
  if (!from || !to || from === to) return [];

  // Dua sumber digabung supaya daftar tidak monoton: matrix memberi tawaran
  // per tanggal (kaya deep link + partner), cheap memberi harga per jumlah
  // transit (sering beda maskapai). Hasil digabung lalu di-dedupe.
  const [matrix, cheap] = await Promise.all([
    matrixOffers({ from, to, date: input.date, cabin: input.cabin }),
    cheapFallback({ from, to, date: input.date }),
  ]);

  const seen = new Set<string>();
  const merged: FlightOffer[] = [];
  for (const offer of [...matrix, ...cheap]) {
    const key = `${offer.airlineCode}|${offer.departAt.slice(0, 16)}|${offer.transfers}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(offer);
  }

  return merged.sort((a, b) => a.priceIdr - b.priceIdr).slice(0, 12);
}

async function matrixOffers(input: {
  from: string;
  to: string;
  date?: string;
  cabin?: string;
}): Promise<FlightOffer[]> {
  const { from, to } = input;
  const matrixParams = new URLSearchParams({
    origin: from,
    destination: to,
    currency: "idr",
    limit: "7",
    show_to_affiliates: "true",
  });
  if (input.date) matrixParams.set("depart_date", input.date);
  if (input.cabin === "business") matrixParams.set("trip_class", "1");

  try {
    const body = await request<MatrixResponse>(`/v2/prices/nearest-places-matrix?${matrixParams.toString()}`);
    return (body.prices ?? [])
      .filter((row) => row.price && row.depart_date && row.link)
      .map<FlightOffer>((row) => ({
        id: row.link as string,
        airlineCode: (row.main_airline ?? "").toUpperCase(),
        airlineName: airlineName(row.main_airline ?? ""),
        origin: row.origin ?? from,
        destination: row.destination ?? to,
        departAt: row.depart_date as string,
        arriveAt: minutesToIso(row.depart_date as string, row.duration ?? 0),
        durationMin: row.duration ?? 0,
        transfers: row.transfers ?? 0,
        gate: row.gate ?? "Mitra Travelpayouts",
        priceIdr: row.price as number,
        link: absoluteAffiliateLink(row.link as string),
        source: "matrix" as const,
      }));
  } catch {
    return [];
  }
}

async function cheapFallback(input: { from: string; to: string; date?: string }): Promise<FlightOffer[]> {
  const from = toIata(input.from);
  const to = toIata(input.to);
  const month = input.date && /^\d{4}-\d{2}/.test(input.date) ? input.date.slice(0, 7) : undefined;
  const params = new URLSearchParams({ origin: from, destination: to, currency: "idr" });
  if (month) params.set("depart_date", month);
  try {
    const body = await request<CheapResponse>(`/v1/prices/cheap?${params.toString()}`);
    const bucket = body.data?.[to] ?? {};
    return Object.entries(bucket)
      // Bila pengguna memilih tanggal tertentu, jangan tampilkan tanggal lain:
      // judul halaman menyebut satu tanggal, daftar harus konsisten.
      .filter(([, row]) => row.price && row.departure_at)
      .filter(([, row]) => !input.date || (row.departure_at as string).startsWith(input.date))
      .map<FlightOffer>(([transfers, row]) => ({
        id: `${from}-${to}-${row.departure_at}-${row.price}`,
        airlineCode: (row.airline ?? "").toUpperCase(),
        airlineName: airlineName(row.airline ?? ""),
        origin: from,
        destination: to,
        departAt: row.departure_at as string,
        arriveAt: minutesToIso(row.departure_at as string, row.duration_to ?? row.duration ?? 0),
        durationMin: row.duration_to ?? row.duration ?? 0,
        transfers: Number(transfers),
        gate: "Mitra Travelpayouts",
        priceIdr: row.price as number,
        link: flightSearchLink(from, to, (row.departure_at as string).slice(0, 10)),
        source: "cheap" as const,
      }))
      .sort((a, b) => a.priceIdr - b.priceIdr);
  } catch {
    return [];
  }
}

type CalendarResponse = {
  currency?: string;
  data?: Record<string, { price?: number; airline?: string; departure_at?: string; transfers?: number }>;
};

/** Tanggal-tanggal lain pada satu bulan beserta harga termurahnya. */
export async function cheapestDates(input: {
  from: string;
  to: string;
  month: string;
}): Promise<Array<{ date: string; priceIdr: number; airlineCode: string; transfers: number }>> {
  const params = new URLSearchParams({
    origin: toIata(input.from),
    destination: toIata(input.to),
    depart_date: input.month,
    calendar_type: "departure_date",
    currency: "idr",
  });
  try {
    const body = await request<CalendarResponse>(`/v1/prices/calendar?${params.toString()}`);
    return Object.entries(body.data ?? {})
      .filter(([, row]) => typeof row.price === "number" && row.price > 0)
      .map(([date, row]) => ({
        date,
        priceIdr: row.price as number,
        airlineCode: (row.airline ?? "").toUpperCase(),
        transfers: row.transfers ?? 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

type CityDirectionsResponse = {
  currency?: string;
  data?: Record<string, {
    origin?: string;
    destination?: string;
    airline?: string;
    departure_at?: string;
    price?: number;
    transfers?: number;
  }>;
};

/** Rute populer dari sebuah kota asal (30 rute dari mitra). */
export async function popularRoutes(from: string, take = 8) {
  const params = new URLSearchParams({ origin: toIata(from), currency: "idr" });
  try {
    const body = await request<CityDirectionsResponse>(`/v1/city-directions?${params.toString()}`);
    return Object.entries(body.data ?? {})
      .filter(([, row]) => typeof row.price === "number" && row.price > 0)
      .map(([code, row]) => ({
        code: row.destination ?? code,
        city: cityName(row.destination ?? code),
        priceIdr: row.price as number,
        airlineCode: (row.airline ?? "").toUpperCase(),
        transfers: row.transfers ?? 0,
        departAt: row.departure_at ?? "",
      }))
      .sort((a, b) => a.priceIdr - b.priceIdr)
      .slice(0, take);
  } catch {
    return [];
  }
}
