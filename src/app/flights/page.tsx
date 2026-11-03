import Link from "next/link";
import { ArrowRight, TrendingDown } from "lucide-react";
import { FlightResults, parseFilters } from "@/components/flight-results";
import { SearchWidget } from "@/components/search-widget";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { cheapestDates, cityName, popularRoutes, searchFlights, toIata } from "@/lib/travelpayouts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cari tiket pesawat | Harmonika Travel",
  description:
    "Bandingkan tawaran tiket pesawat dari mitra Travelpayouts: harga, durasi, dan jumlah transit dalam satu daftar.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export default async function FlightsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const read = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };

  const from = toIata(read("from") ?? read("q"));
  const to = toIata(read("to"));
  const date = /^\d{4}-\d{2}-\d{2}$/.test(read("date") ?? "") ? read("date") : undefined;
  const cabin = read("cabin");
  const filters = parseFilters({ sort: read("sort"), stops: read("stops"), airline: read("airline"), max: read("max") });

  if (from && to) {
    const [offers, dates] = await Promise.all([
      searchFlights({ from, to, date, cabin }),
      cheapestDates({ from, to, month: (date ?? new Date().toISOString().slice(0, 10)).slice(0, 7) }),
    ]);

    return (
      <div className="min-h-screen bg-white text-ink">
        <SiteHeader />
        <main>
          <FlightResults
            date={date}
            dates={dates}
            filters={filters}
            from={from}
            offers={offers}
            to={to}
          />
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Tanpa asal/tujuan: tampilkan form dan daftar rute populer dari mitra.
  const routes = await popularRoutes("CGK", 10);

  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />
      <main>
        <section className="border-b border-hairline bg-mist">
          <div className="mx-auto max-w-[1180px] px-5 pb-10 pt-8">
            <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">Cari tiket pesawat</h1>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-slate-600">
              Isi asal dan tujuan untuk melihat daftar tawaran nyata dari mitra:
              harga, durasi, jumlah transit, dan penjualnya.
            </p>
            <div className="mt-6">
              <SearchWidget />
            </div>
          </div>
        </section>

        <section aria-labelledby="rute-populer" className="mx-auto max-w-[1240px] px-5 py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[21px] font-extrabold tracking-tight" id="rute-populer">
                <TrendingDown aria-hidden className="h-[18px] w-[18px] text-brand" />
                Rute populer dari Jakarta
              </h2>
              <p className="mt-1.5 text-[12.5px] text-slate-600">
                Harga terendah yang sedang ditawarkan mitra. Klik untuk melihat daftar lengkapnya.
              </p>
            </div>
          </div>

          {routes.length === 0 ? (
            <p className="mt-5 rounded-xl border border-hairline bg-mist px-4 py-3 text-[13px] text-slate-600">
              Data rute populer sedang tidak tersedia. Silakan isi form di atas.
            </p>
          ) : (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {routes.map((route) => (
                <li key={route.code}>
                  <Link
                    className="group flex items-center justify-between gap-3 rounded-xl border border-hairline bg-white p-4 transition hover:border-brand/40 hover:shadow-sm"
                    href={`/flights?from=CGK&to=${route.code}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-bold text-ink">Jakarta → {route.city}</span>
                      <span className="mt-0.5 block text-[11.5px] text-slate-500">
                        {route.transfers === 0 ? "Langsung" : `${route.transfers} transit`}
                        {route.airlineCode ? ` · ${route.airlineCode}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[14.5px] font-extrabold text-sun">{money(route.priceIdr)}</span>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand">
                        Lihat <ArrowRight aria-hidden className="h-3 w-3" />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 text-[11.5px] leading-relaxed text-slate-500">
            Kode kota mengikuti IATA. Asal saat ini Jakarta (CGK); rute lain bisa dicari
            lewat form di atas, misalnya {cityName("SUB")} → {cityName("MED")}.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
