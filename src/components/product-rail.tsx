import { ArrowRight, MapPin } from "lucide-react";
import { imageForProduct } from "@/lib/home-content";
import { listCategory } from "./category-catalog";

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const categoryLabel: Record<string, string> = {
  FLIGHT: "Penerbangan",
  HOTEL: "Hotel",
  ACTIVITY: "Aktivitas",
  AIRPORT_TRANSFER: "Antar jemput",
  CAR_RENTAL: "Rental mobil",
  CRUISE: "Kapal pesiar",
};

export async function ProductRail() {
  const items = await listCategory(
    ["FLIGHT", "HOTEL", "ACTIVITY", "CAR_RENTAL", "CRUISE", "AIRPORT_TRANSFER"],
    4,
  ).catch(() => [] as Awaited<ReturnType<typeof listCategory>>);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="pilihan-perjalanan" className="bg-mist">
      <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-[3px] w-8 rounded-full bg-sun" />
              <h2
                className="text-[26px] font-extrabold tracking-tight text-ink"
                id="pilihan-perjalanan"
              >
                Pilihan untuk perjalananmu
              </h2>
            </div>
            <p className="mt-2 text-[13.5px] text-slate-500">
              Harga dihitung di server saat pemesanan; ketersediaan diperiksa
              ulang secara transaksional.
            </p>
          </div>
          <a
            className="inline-flex min-h-9 items-center gap-2 text-[13.5px] font-semibold text-brand hover:text-brand-dark"
            href="/trips"
          >
            Lihat semua paket
            <ArrowRight aria-hidden className="h-4 w-4" />
          </a>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((product) => {
            const price = product.variants[0]?.schedules[0]?.priceIdr ?? null;
            const image =
              product.imageUrl ??
              imageForProduct(product.category, product.destination?.name ?? product.location);
            return (
              <li key={product.id}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm transition hover:shadow-md">
                  <a
                    className="relative block aspect-[16/10] overflow-hidden bg-slate-200"
                    href={`/products/${encodeURIComponent(product.slug)}`}
                  >
                                        <img
                      alt={`${product.name} di ${product.location}`}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      height={320}
                      loading="lazy"
                      src={image}
                      width={512}
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-brand">
                      {categoryLabel[product.category] ?? product.category}
                    </span>
                  </a>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-[15px] font-bold leading-snug text-ink">
                      <a
                        className="hover:text-brand"
                        href={`/products/${encodeURIComponent(product.slug)}`}
                      >
                        {product.name}
                      </a>
                    </h3>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-slate-500">
                      <MapPin aria-hidden className="h-3.5 w-3.5" />
                      {product.location}
                    </p>
                    <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                      <p>
                        <span className="block text-[11px] text-slate-500">Mulai dari</span>
                        <span className="block text-[15px] font-extrabold text-sun">
                          {price === null ? "Jadwal belum tersedia" : money(price)}
                        </span>
                      </p>
                      <a
                        aria-label={`Lihat detail ${product.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand transition hover:bg-brand hover:text-white"
                        href={`/products/${encodeURIComponent(product.slug)}`}
                      >
                        <ArrowRight aria-hidden className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
