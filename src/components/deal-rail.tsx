import { ArrowUpRight, BedDouble, Plane, TrendingDown } from "lucide-react";
import { affiliateMarker, cheapestDeals, hotelSearchLink } from "@/lib/travelpayouts";

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));

/**
 * Harga tiket dari mitra Travelpayouts (data Aviasales). Ditampilkan terpisah
 * dari katalog demo agar pengunjung tahu mana harga mitra dan mana data contoh.
 */
export async function DealRail() {
  const { deals, error } = await cheapestDeals();

  if (error || deals.length === 0) {
    return (
      <section aria-labelledby="harga-mitra" className="border-y border-hairline bg-mist">
        <div className="mx-auto max-w-[1240px] px-5 py-8">
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-ink" id="harga-mitra">
            <TrendingDown aria-hidden className="h-4 w-4 text-brand" />
            Harga tiket mitra
          </h2>
          <p className="mt-2 text-[13px] text-slate-600">
            Harga mitra sedang tidak dapat dimuat. Katalog di bawah tetap dapat
            dipesan sebagai demo.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="harga-mitra" className="border-y border-hairline bg-mist">
      <div className="mx-auto max-w-[1240px] px-5 py-9">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              className="flex items-center gap-2 text-[19px] font-extrabold tracking-tight text-ink"
              id="harga-mitra"
            >
              <TrendingDown aria-hidden className="h-[18px] w-[18px] text-brand" />
              Harga tiket terbaru dari mitra
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600">
              Harga nyata dari mitra Travelpayouts (Aviasales), diperbarui
              berkala. Transaksi dilakukan di situs mitra.
            </p>
          </div>
          <p className="text-[11.5px] text-slate-500">
            Partner ID {affiliateMarker || "—"}
          </p>
        </div>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <li key={`${deal.origin}-${deal.destination}-${deal.departDate}-${deal.priceIdr}`}>
              <a
                className="group flex h-full flex-col rounded-xl border border-hairline bg-white p-4 transition hover:border-brand/40 hover:shadow-sm"
                href={deal.link}
                rel="noopener noreferrer nofollow sponsored"
                target="_blank"
              >
                <span className="flex items-center justify-between text-[12px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Plane aria-hidden className="h-3.5 w-3.5" />
                    {deal.origin} → {deal.destination}
                  </span>
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-bold text-brand">
                    {deal.changes === 0 ? "Langsung" : `${deal.changes} transit`}
                  </span>
                </span>
                <span className="mt-1 text-[14px] font-bold text-ink">{deal.city}</span>
                <span className="mt-2 text-[18px] font-extrabold text-sun">
                  {money(deal.priceIdr)}
                </span>
                <span className="mt-0.5 text-[11.5px] text-slate-500">
                  {dateLabel(deal.departDate)}
                  {deal.returnDate ? ` – ${dateLabel(deal.returnDate)}` : " · sekali jalan"}
                </span>
                <span className="mt-3 flex items-center justify-between border-t border-hairline pt-2.5 text-[11.5px] text-slate-500">
                  {deal.gate}
                  <span className="inline-flex items-center gap-1 font-semibold text-brand">
                    Lihat di Aviasales
                    <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0b2a5b] px-4 text-[13px] font-semibold text-white transition hover:bg-[#081f45]"
            href={hotelSearchLink("Madinah")}
            rel="noopener noreferrer nofollow sponsored"
            target="_blank"
          >
            Bandingkan hotel di Hotellook
            <ArrowUpRight aria-hidden className="h-4 w-4" />
          </a>
          <p className="text-[11.5px] text-slate-500">
            Tautan afiliasi. Harga dapat berubah sewaktu-waktu.
          </p>
        </div>
      </div>
    </section>
  );
}
const hotelCities = [
  { city: "Madinah", note: "Dekat Masjid Nabawi" },
  { city: "Mekkah", note: "Jalan kaki ke Masjidil Haram" },
  { city: "Bali", note: "Resor & vila" },
  { city: "Jakarta", note: "Hotel bisnis" },
];

/** Band afiliasi hotel (Hotellook). Dipakai halaman /hotels. */
export function HotelAffiliateBand() {
  return (
    <section aria-labelledby="hotel-mitra" className="border-y border-hairline bg-mist">
      <div className="mx-auto max-w-[1240px] px-5 py-8">
        <h2
          className="flex items-center gap-2 text-[17px] font-extrabold tracking-tight text-ink"
          id="hotel-mitra"
        >
          <BedDouble aria-hidden className="h-[17px] w-[17px] text-brand" />
          Bandingkan harga hotel di mitra
        </h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600">
          Ketersediaan dan harga kamar diperiksa langsung di mitra Travelpayouts
          (Hotellook).
        </p>
        <ul className="mt-4 flex flex-wrap gap-2.5">
          {hotelCities.map((item) => (
            <li key={item.city}>
              <a
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-hairline bg-white px-4 text-[13px] font-semibold text-ink transition hover:border-brand/40 hover:text-brand"
                href={hotelSearchLink(item.city)}
                rel="noopener noreferrer nofollow sponsored"
                target="_blank"
              >
                {item.city}
                <span className="text-[11px] font-normal text-slate-500">{item.note}</span>
                <ArrowUpRight aria-hidden className="h-3.5 w-3.5 text-brand" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
