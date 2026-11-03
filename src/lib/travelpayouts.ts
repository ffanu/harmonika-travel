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