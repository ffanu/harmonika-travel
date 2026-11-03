import type { Category } from "@prisma/client";
import { db } from "@/lib/db";

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const dateLabel = (value: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(value);

export async function listCategory(categories: Category[], take = 24) {
  const now = new Date();
  return db.product.findMany({
    where: {
      active: true,
      category: { in: categories },
      variants: { some: { active: true, schedules: { some: { active: true, startsAt: { gt: now } } } } },
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take,
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      description: true,
      location: true,
      isDemo: true,
      destination: { select: { name: true, country: true } },
      variants: {
        where: { active: true },
        select: {
          id: true,
          name: true,
          schedules: {
            where: { active: true, startsAt: { gt: now } },
            orderBy: [{ startsAt: "asc" }],
            take: 1,
            select: { startsAt: true, priceIdr: true, capacity: true, reserved: true },
          },
        },
      },
    },
  });
}

export function CategoryCatalog({
  eyebrow,
  title,
  intro,
  items,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  items: Awaited<ReturnType<typeof listCategory>>;
}) {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10">
      <nav className="mb-8 flex flex-wrap items-center gap-4 text-sm">
        <a href="/" className="font-bold text-sky-800">Harmonika Travel</a>
        <a href="/flights" className="text-slate-600 hover:text-sky-800">Pesawat</a>
        <a href="/hotels" className="text-slate-600 hover:text-sky-800">Hotel</a>
        <a href="/trips" className="text-slate-600 hover:text-sky-800">Paket</a>
        <a href="/promos" className="text-slate-600 hover:text-sky-800">Promo</a>
        <a href="/blog" className="text-slate-600 hover:text-sky-800">Blog</a>
      </nav>
      <p className="text-xs font-semibold uppercase tracking-widest text-sky-700">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">{intro}</p>

      {items.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-slate-300 p-8 text-slate-600">
          Belum ada produk aktif untuk kategori ini. Data katalog dikelola admin.
        </p>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const schedule = item.variants.flatMap((variant) => variant.schedules)[0];
            const cheapest = item.variants
              .map((variant) => variant.schedules[0]?.priceIdr)
              .filter((price): price is number => typeof price === "number")
              .sort((a, b) => a - b)[0];
            const seats = schedule ? schedule.capacity - schedule.reserved : 0;
            return (
              <li key={item.id}>
                <a
                  href={`/products/${item.slug}`}
                  className="flex h-full flex-col rounded-xl border border-slate-200 p-5 transition hover:border-sky-400 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-slate-900">{item.name}</h2>
                    {item.isDemo ? (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                        demo
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.location} · {item.destination.name}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm text-slate-600">{item.description}</p>
                  <dl className="mt-auto pt-4 text-sm">
                    {cheapest !== undefined ? (
                      <div className="flex items-baseline justify-between">
                        <dt className="text-slate-500">Mulai dari</dt>
                        <dd className="font-semibold text-sky-800">{money(cheapest)}</dd>
                      </div>
                    ) : null}
                    {schedule ? (
                      <div className="mt-1 flex items-baseline justify-between">
                        <dt className="text-slate-500">Keberangkatan</dt>
                        <dd className="text-slate-700">{dateLabel(schedule.startsAt)}</dd>
                      </div>
                    ) : null}
                    {schedule ? (
                      <div className="mt-1 flex items-baseline justify-between">
                        <dt className="text-slate-500">Sisa kursi</dt>
                        <dd className="text-slate-700">{seats}</dd>
                      </div>
                    ) : null}
                  </dl>
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-10 text-xs text-slate-500">
        Harga dihitung ulang di server saat pemesanan. Data bertanda demo bukan inventori
        atau harga operasional.
      </p>
    </main>
  );
}