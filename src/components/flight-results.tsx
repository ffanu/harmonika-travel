import { ArrowUpRight, CalendarDays, Clock3, Filter, Plane, PlaneLanding, SlidersHorizontal } from "lucide-react";
import { cityName, type FlightOffer } from "@/lib/travelpayouts";

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

/** Durasi menit -> "22j 35m". */
function duration(minutes: number) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}j ${m}m` : `${h}j`;
}

/**
 * Tambahkan durasi ke jam lokal keberangkatan dan kembalikan jam lokal tiba.
 * Semua waktu ditampilkan sebagai jam lokal seperti kebiasaan situs tiket;
 * ini perkiraan karena API hanya memberi durasi total.
 */
function arrival(departAt: string, minutes: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(departAt);
  if (!match || !minutes) return null;
  const [, y, mo, d, hh, mm] = match.map(Number) as unknown as number[];
  const start = new Date(Date.UTC(y, (mo as number) - 1, d, hh, mm));
  const end = new Date(start.getTime() + minutes * 60_000);
  const nextDay = end.getUTCDate() !== start.getUTCDate();
  const hhmm = `${String(end.getUTCHours()).padStart(2, "0")}:${String(end.getUTCMinutes()).padStart(2, "0")}`;
  return { hhmm, nextDay };
}

const departClock = (iso: string) => {
  const match = /[T ](\d{2}:\d{2})/.exec(iso);
  return match ? match[1] : "—";
};

const dayLabel = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", timeZone: "UTC" }).format(date);
};

const stopsLabel = (transfers: number) =>
  transfers === 0 ? "Langsung" : `${transfers} transit`;

type Filters = {
  sort: "price" | "duration" | "depart";
  stops: "all" | "0" | "1";
  airline: string;
  max: number;
};

export function applyFilters(offers: FlightOffer[], filters: Filters) {
  let rows = offers.slice();
  if (filters.stops === "0") rows = rows.filter((offer) => offer.transfers === 0);
  if (filters.stops === "1") rows = rows.filter((offer) => offer.transfers === 1);
  if (filters.airline) rows = rows.filter((offer) => offer.airlineCode === filters.airline);
  if (Number.isFinite(filters.max) && filters.max > 0) {
    rows = rows.filter((offer) => offer.priceIdr <= filters.max);
  }
  rows.sort((a, b) => {
    if (filters.sort === "duration") {
      return a.durationMin - b.durationMin || a.priceIdr - b.priceIdr;
    }
    if (filters.sort === "depart") {
      return a.departAt.localeCompare(b.departAt);
    }
    return a.priceIdr - b.priceIdr || a.durationMin - b.durationMin;
  });
  return rows;
}

export function parseFilters(params: {
  sort?: string;
  stops?: string;
  airline?: string;
  max?: string;
}): Filters {
  const sort = params.sort === "duration" || params.sort === "depart" ? params.sort : "price";
  const stops = params.stops === "0" || params.stops === "1" ? params.stops : "all";
  const airline = /^[A-Za-z0-9]{2}$/.test(params.airline ?? "") ? (params.airline as string).toUpperCase() : "";
  const max = Number(params.max);
  return { sort, stops, airline, max: Number.isFinite(max) ? max : 0 };
}

function buildHref(base: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...base, ...patch })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/flights?${query}` : "/flights";
}
export function FlightResults({
  from,
  to,
  date,
  offers,
  filters,
  dates,
}: {
  from: string;
  to: string;
  date?: string;
  offers: FlightOffer[];
  filters: Filters;
  dates: Array<{ date: string; priceIdr: number; airlineCode: string }>;
}) {
  const rows = applyFilters(offers, filters);
  const base = { from, to, date };
  const airlines = [...new Set(offers.map((offer) => offer.airlineCode))].filter(Boolean).sort();
  const cheapest = rows.length ? Math.min(...rows.map((row) => row.priceIdr)) : 0;

  const sortLinks: Array<{ key: Filters["sort"]; label: string }> = [
    { key: "price", label: "Termurah" },
    { key: "duration", label: "Tercepat" },
    { key: "depart", label: "Berangkat paling awal" },
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-ink sm:text-[28px]">
            {cityName(from)} → {cityName(to)}
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {date
              ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))
              : "Tanggal terdekat yang tersedia"}
            {rows.length ? ` · ${rows.length} tawaran · mulai ${money(cheapest)}` : ""}
          </p>
        </div>
        <a
          className="text-[12.5px] font-semibold text-brand hover:text-brand-dark"
          href={buildHref({}, { from, to })}
        >
          Ubah pencarian
        </a>
      </div>

      {offers.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-hairline bg-mist px-6 py-12 text-center">
          <Plane aria-hidden className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-4 text-[16px] font-bold text-ink">Belum ada tawaran untuk rute ini</p>
          <p className="mx-auto mt-2 max-w-md text-[13px] text-slate-600">
            Mitra belum mengirim harga untuk {cityName(from)} → {cityName(to)}
            {date ? " pada tanggal tersebut" : ""}. Coba tanggal lain atau rute populer di bawah.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
              <SlidersHorizontal aria-hidden className="h-3.5 w-3.5" /> Urutkan
            </span>
            {sortLinks.map((item) => (
              <a
                aria-current={filters.sort === item.key}
                className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-[12.5px] font-semibold transition ${
                  filters.sort === item.key
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-hairline bg-white text-slate-600 hover:border-brand/40 hover:text-brand"
                }`}
                href={buildHref(base, { sort: item.key, stops: filters.stops === "all" ? undefined : filters.stops, airline: filters.airline || undefined, max: filters.max ? String(filters.max) : undefined })}
                key={item.key}
              >
                {item.label}
              </a>
            ))}
          </div>

          <form className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-hairline bg-white p-3" method="get">
            <input name="from" type="hidden" value={from} />
            <input name="to" type="hidden" value={to} />
            {date ? <input name="date" type="hidden" value={date} /> : null}
            <input name="sort" type="hidden" value={filters.sort} />
            <label className="grid gap-1 text-[11.5px] font-semibold text-slate-500">
              Transit
              <select className="h-9 rounded-lg border border-hairline px-2 text-[13px] text-ink" defaultValue={filters.stops} name="stops">
                <option value="all">Semua</option>
                <option value="0">Langsung</option>
                <option value="1">1 transit</option>
              </select>
            </label>
            <label className="grid gap-1 text-[11.5px] font-semibold text-slate-500">
              Maskapai
              <select className="h-9 rounded-lg border border-hairline px-2 text-[13px] text-ink" defaultValue={filters.airline} name="airline">
                <option value="">Semua</option>
                {airlines.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[11.5px] font-semibold text-slate-500">
              Harga maks (Rp)
              <input className="h-9 w-28 rounded-lg border border-hairline px-2 text-[13px] text-ink" defaultValue={filters.max || ""} inputMode="numeric" min={0} name="max" step={100000} type="number" />
            </label>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-dark" type="submit">
              <Filter aria-hidden className="h-3.5 w-3.5" /> Terapkan
            </button>
            {(filters.stops !== "all" || filters.airline || filters.max) && (
              <a className="text-[12px] font-semibold text-slate-500 hover:text-brand" href={buildHref({ from, to, date }, { sort: filters.sort })}>
                Reset filter
              </a>
            )}
          </form>

          {rows.length === 0 ? (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
              Tidak ada tawaran yang cocok dengan filter. Longgarkan filter untuk melihat {offers.length} tawaran lain.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-white">
              {rows.map((offer) => {
                const arrive = arrival(offer.departAt, offer.durationMin);
                return (
                  <li key={offer.id}>
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg bg-mist text-[11.5px] font-extrabold text-ink">
                          {offer.airlineCode || "—"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-bold text-ink">{offer.airlineName}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-slate-500">
                            <Clock3 aria-hidden className="h-3 w-3" />
                            {duration(offer.durationMin)}
                            <span aria-hidden>·</span>
                            <span className={offer.transfers === 0 ? "font-semibold text-emerald-700" : ""}>
                              {stopsLabel(offer.transfers)}
                            </span>
                            <span aria-hidden>·</span>
                            <span>{offer.gate}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[13.5px] font-bold text-ink sm:gap-3">
                        <span className="tabular-nums">{departClock(offer.departAt)}</span>
                        <Plane aria-hidden className="h-3.5 w-3.5 text-slate-400" />
                        <span className="tabular-nums">
                          {arrive ? arrive.hhmm : "—"}
                          {arrive?.nextDay ? <sup className="ml-0.5 text-[9px] text-sun">+1</sup> : null}
                        </span>
                        <span className="ml-1 text-[11px] font-normal text-slate-400">{dayLabel(offer.departAt)}</span>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <div className="text-right">
                          <p className="text-[16px] font-extrabold text-sun">{money(offer.priceIdr)}</p>
                          <p className="text-[10.5px] text-slate-500">per orang</p>
                        </div>
                        <a
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-[13px] font-bold text-white transition hover:bg-brand-dark"
                          href={offer.link}
                          rel="noopener noreferrer nofollow sponsored"
                          target="_blank"
                        >
                          Pilih
                          <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {dates.length > 1 ? (
            <section aria-labelledby="tanggal-lain" className="mt-8">
              <h2 className="flex items-center gap-2 text-[14px] font-extrabold text-ink" id="tanggal-lain">
                <CalendarDays aria-hidden className="h-4 w-4 text-brand" /> Tanggal lain dengan harga terbaik
              </h2>
              <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                {dates.slice(0, 14).map((item) => (
                  <li key={item.date}>
                    <a
                      className={`flex min-w-[92px] flex-col items-center rounded-xl border px-3 py-2 transition ${
                        item.date === date
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-hairline bg-white text-ink hover:border-brand/40"
                      }`}
                      href={buildHref({}, { from, to, date: item.date, sort: filters.sort })}
                    >
                      <span className="text-[11.5px] font-semibold">
                        {new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${item.date}T00:00:00Z`))}
                      </span>
                      <span className="mt-0.5 text-[12px] font-extrabold text-sun">{money(item.priceIdr)}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-slate-500">
                Tanggal bisa berada di bulan lain. Harga acuan mitra dan dapat berubah saat Anda membuka Aviasales.
              </p>
            </section>
          ) : null}
        </>
      )}

      <p className="mt-6 flex items-start gap-2 rounded-xl bg-mist px-4 py-3 text-[11.5px] leading-relaxed text-slate-600">
        <PlaneLanding aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
        Tawaran berasal dari mitra Travelpayouts (Aviasales). Jam tiba adalah perkiraan
        jam lokal berdasarkan durasi penerbangan. Pembelian diselesaikan di situs mitra; kami
        menerima komisi tanpa menambah harga Anda.
      </p>
    </div>
  );
}
