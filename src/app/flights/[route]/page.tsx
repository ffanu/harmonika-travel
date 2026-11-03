import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, CalendarDays, Plane, TrendingDown } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  absoluteAffiliateLink,
  cheapestDates,
  cityName,
  parseRouteSlug,
  popularRoutes,
  routeOverview,
  routeSlug,
  searchFlights,
} from "@/lib/travelpayouts";

export const dynamic = "force-dynamic";

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

const monthLabel = (month: string) =>
  new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${month}-01T00:00:00Z`),
  );

const dayLabel = (date: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );

type Params = Promise<{ route: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { route } = await params;
  const parsed = parseRouteSlug(route);
  if (!parsed) return { title: "Rute tidak dikenal | Harmonika Travel" };
  const from = cityName(parsed.from);
  const to = cityName(parsed.to);
  const { cheapest } = await routeOverview(parsed);
  const price = cheapest ? `mulai ${money(cheapest)}` : "harga terbaru";
  return {
    title: `Tiket ${from} – ${to} ${price} | Harmonika Travel`,
    description: `Bandingkan tawaran tiket ${from} ke ${to}: harga per bulan, maskapai, durasi, dan jumlah transit. Tautan langsung ke mitra Travelpayouts.`,
    alternates: { canonical: `/flights/${routeSlug(parsed.from, parsed.to)}` },
  };
}

export default async function RoutePage({ params }: { params: Params }) {
  const { route } = await params;
  const parsed = parseRouteSlug(route);
  if (!parsed) notFound();

  const { from, to } = parsed;
  if (from === to) notFound();

  const [overview, offers, dates, related] = await Promise.all([
    routeOverview({ from, to, limit: 30 }),
    searchFlights({ from, to }),
    cheapestDates({ from, to, month: new Date().toISOString().slice(0, 7) }),
    popularRoutes(from, 6),
  ]);

  const fromName = cityName(from);
  const toName = cityName(to);
  const cheapestOffer = offers[0] ?? null;
  const airlines = [...new Set(offers.map((offer) => offer.airlineCode).filter(Boolean))];

  const faq = [
    {
      q: `Berapa harga tiket ${fromName} ke ${toName} termurah saat ini?`,
      a: cheapestOffer
        ? `Tawaran termurah yang terlihat saat ini ${money(cheapestOffer.priceIdr)} oleh ${cheapestOffer.airlineName} (${cheapestOffer.gate}). Harga dapat berubah kapan saja.`
        : `Mitra belum mengirim harga untuk rute ini. Coba tanggal lain lewat halaman pencarian.`,
    },
    {
      q: `Maskapai apa yang melayani rute ${fromName} – ${toName}?`,
      a: airlines.length
        ? `Tawaran yang terlihat berasal dari ${airlines.join(", ")}. Daftar bisa berbeda tergantung tanggal.`
        : `Belum ada data maskapai untuk rute ini.`,
    },
    {
      q: "Apakah bisa membeli tiket di Harmonika Travel?",
      a: "Tidak. Harmonika Travel menampilkan dan membandingkan tawaran dari mitra Travelpayouts; pembelian diselesaikan di situs mitra (Aviasales). Kami menerima komisi tanpa menambah harga Anda.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const searchHref = `/flights?from=${from}&to=${to}`;

  return (
    <div className="min-h-screen bg-white text-ink">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
      <SiteHeader />

      <main>
        <section className="border-b border-hairline bg-mist">
          <div className="mx-auto max-w-[1080px] px-5 py-9">
            <nav aria-label="Remah" className="flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
              <Link className="hover:text-brand" href="/">Beranda</Link>
              <span aria-hidden>/</span>
              <Link className="hover:text-brand" href="/flights">Tiket pesawat</Link>
              <span aria-hidden>/</span>
              <span className="text-ink">{fromName} – {toName}</span>
            </nav>

            <h1 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
              Tiket pesawat {fromName} – {toName}
            </h1>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-slate-600">
              Harga per bulan, maskapai yang melayani, dan tawaran terbaru dari mitra
              Travelpayouts. Rute {from} → {to}.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-[14px] font-bold text-white transition hover:bg-brand-dark"
                href={searchHref}
              >
                <Plane aria-hidden className="h-4 w-4" />
                Lihat {offers.length || ""} tawaran
              </Link>
              {overview.cheapest ? (
                <p className="text-[13px] text-slate-600">
                  Termurah terlihat:{" "}
                  <strong className="text-[15px] font-extrabold text-sun">{money(overview.cheapest)}</strong>
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section aria-labelledby="harga-bulanan" className="mx-auto max-w-[1080px] px-5 py-9">
          <h2 className="flex items-center gap-2 text-[19px] font-extrabold tracking-tight" id="harga-bulanan">
            <TrendingDown aria-hidden className="h-[18px] w-[18px] text-brand" />
            Harga per bulan
          </h2>
          <p className="mt-1.5 text-[12.5px] text-slate-600">
            Harga terendah yang sedang terlihat mitra pada tiap bulan. Klik bulan untuk
            melihat seluruh tawaran.
          </p>

          {overview.monthly.length === 0 ? (
            <p className="mt-4 rounded-xl border border-hairline bg-mist px-4 py-3 text-[13px] text-slate-600">
              Belum ada data harga bulanan untuk rute ini.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {overview.monthly.map((row) => (
                <li key={row.month}>
                  <Link
                    className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-white p-3.5 transition hover:border-brand/40"
                    href={`/flights?from=${from}&to=${to}&date=${row.sampleDate}`}
                  >
                    <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
                      <CalendarDays aria-hidden className="h-3.5 w-3.5 text-slate-400" />
                      {monthLabel(row.month)}
                    </span>
                    <span className="text-right">
                      <span className="block text-[13.5px] font-extrabold text-sun">{money(row.priceIdr)}</span>
                      <span className="block text-[10.5px] text-slate-500">{dayLabel(row.sampleDate)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {dates.length > 1 ? (
            <>
              <h2 className="mt-8 flex items-center gap-2 text-[15px] font-extrabold text-ink">
                <CalendarDays aria-hidden className="h-4 w-4 text-brand" /> Tanggal termurah bulan ini
              </h2>
              <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                {dates.slice(0, 14).map((item) => (
                  <li key={item.date}>
                    <Link
                      className="flex min-w-[92px] flex-col items-center rounded-xl border border-hairline bg-white px-3 py-2 transition hover:border-brand/40"
                      href={`/flights?from=${from}&to=${to}&date=${item.date}`}
                    >
                      <span className="text-[11.5px] font-semibold">{dayLabel(item.date)}</span>
                      <span className="mt-0.5 text-[12px] font-extrabold text-sun">{money(item.priceIdr)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <section aria-labelledby="tawaran-terbaru" className="border-t border-hairline bg-mist">
          <div className="mx-auto max-w-[1080px] px-5 py-9">
            <h2 className="text-[19px] font-extrabold tracking-tight" id="tawaran-terbaru">
              Tawaran terbaru
            </h2>
            {offers.length === 0 ? (
              <p className="mt-3 rounded-xl border border-hairline bg-white px-4 py-3 text-[13px] text-slate-600">
                Mitra belum mengirim tawaran untuk rute ini. Coba rute lain di bawah.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-white">
                {offers.slice(0, 5).map((offer) => (
                  <li className="flex flex-wrap items-center justify-between gap-3 p-4" key={offer.id}>
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg bg-mist text-[11.5px] font-extrabold">
                        {offer.airlineCode || "—"}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-bold">{offer.airlineName}</span>
                        <span className="block text-[11.5px] text-slate-500">
                          {dayLabel(offer.departAt.slice(0, 10))} ·{" "}
                          {offer.transfers === 0 ? "langsung" : `${offer.transfers} transit`} · {offer.gate}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-[15px] font-extrabold text-sun">{money(offer.priceIdr)}</span>
                      <a
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-[13px] font-bold text-white transition hover:bg-brand-dark"
                        href={absoluteAffiliateLink(offer.link)}
                        rel="noopener noreferrer nofollow sponsored"
                        target="_blank"
                      >
                        Pilih <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section aria-labelledby="rute-terkait" className="mx-auto max-w-[1080px] px-5 py-9">
          <h2 className="text-[17px] font-extrabold tracking-tight" id="rute-terkait">
            Rute lain dari {fromName}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {related
              .filter((item) => item.code !== to)
              .map((item) => (
                <li key={item.code}>
                  <Link
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-hairline bg-white px-3.5 text-[12.5px] font-semibold text-ink transition hover:border-brand/40 hover:text-brand"
                    href={`/flights/${routeSlug(from, item.code)}`}
                  >
                    {fromName} → {item.city}
                    <span className="text-sun">{money(item.priceIdr)}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>

        <section aria-labelledby="faq" className="border-t border-hairline bg-mist">
          <div className="mx-auto max-w-[1080px] px-5 py-9">
            <h2 className="text-[17px] font-extrabold tracking-tight" id="faq">Pertanyaan umum</h2>
            <dl className="mt-4 grid gap-4">
              {faq.map((item) => (
                <div className="rounded-xl border border-hairline bg-white p-4" key={item.q}>
                  <dt className="text-[13.5px] font-bold text-ink">{item.q}</dt>
                  <dd className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600">{item.a}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-[11.5px] leading-relaxed text-slate-500">
              Data harga berasal dari mitra Travelpayouts (Aviasales) dan dapat berubah.
              Jam dan ketersediaan kursi ditentukan oleh mitra saat Anda membuka tautannya.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
