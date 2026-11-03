import type { Category, Prisma } from "@prisma/client";
import { ArrowRight, MapPin, SearchX } from "lucide-react";
import { db } from "@/lib/db";
import { imageForProduct } from "@/lib/home-content";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

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

const categoryLabel: Record<string, string> = {
  FLIGHT: "Penerbangan",
  HOTEL: "Hotel",
  ACTIVITY: "Aktivitas",
  AIRPORT_TRANSFER: "Antar jemput",
  CAR_RENTAL: "Rental mobil",
  CRUISE: "Kapal pesiar",
};

function buildSelect(now: Date) {
  return {
    id: true,
    slug: true,
    name: true,
    category: true,
    description: true,
    location: true,
    imageUrl: true,
    isDemo: true,
    destination: { select: { name: true, country: true } },
    variants: {
      where: { active: true },
      select: {
        id: true,
        name: true,
        schedules: {
          where: { active: true, startsAt: { gt: now } },
          orderBy: { startsAt: "asc" as const },
          take: 1,
          select: {
            startsAt: true,
            priceIdr: true,
            capacity: true,
            reserved: true,
          },
        },
      },
    },
  } satisfies Prisma.ProductSelect;
}

function baseWhere(categories: Category[], now: Date): Prisma.ProductWhereInput {
  return {
    active: true,
    category: { in: categories },
    variants: {
      some: {
        active: true,
        schedules: { some: { active: true, startsAt: { gt: now } } },
      },
    },
  };
}

function textFilter(q: string): Prisma.ProductWhereInput[] {
  return [
    { name: { contains: q, mode: "insensitive" } },
    { location: { contains: q, mode: "insensitive" } },
    { description: { contains: q, mode: "insensitive" } },
    { destination: { is: { name: { contains: q, mode: "insensitive" } } } },
  ];
}

/** Ambil katalog tanpa filter; dipakai beranda dan halaman kategori. */
export async function listCategory(categories: Category[], take = 24) {
  const now = new Date();
  return db.product.findMany({
    where: baseWhere(categories, now),
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take,
    select: buildSelect(now),
  });
}

export type CatalogItem = Awaited<ReturnType<typeof listCategory>>[number];

export function parseSearchDay(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const start = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const label = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(start);
  return { start, end, label };
}

/**
 * Cari katalog dengan kata kunci dan/atau tanggal. Bila tanggal yang diminta
 * tidak punya jadwal sama sekali, hasil tanpa filter tanggal dikembalikan
 * bersama catatan agar pengguna tahu tampilan bukan hasil tanggal tersebut.
 */
export async function searchCategory(
  categories: Category[],
  params: { q?: string; date?: string } = {},
  take = 24,
) {
  const now = new Date();
  const q = (params.q ?? "").trim().slice(0, 60);
  // "Madinah (MED)" dari pemilih bandara tidak akan cocok dengan nama produk,
  // jadi kata kunci dicari dalam bentuk utuh dan tanpa kode bandara.
  const terms = Array.from(
    new Set(
      [q, q.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim()].filter(
        (value) => value.length > 0,
      ),
    ),
  );
  const day = parseSearchDay(params.date);

  const where = (useDay: boolean): Prisma.ProductWhereInput => {
    const filter = baseWhere(categories, now);
    if (useDay && day) {
      filter.variants = {
        some: {
          active: true,
          schedules: { some: { active: true, startsAt: { gte: day.start, lt: day.end } } },
        },
      };
    }
    if (terms.length > 0) filter.OR = terms.flatMap((term) => textFilter(term));
    return filter;
  };

  const run = (useDay: boolean) =>
    db.product.findMany({
      where: where(useDay),
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take,
      select: buildSelect(now),
    });

  let items = await run(Boolean(day));
  let notice = "";

  if (items.length === 0 && day) {
    items = await run(false);
    notice = `Tidak ada jadwal tepat pada ${day.label}. Menampilkan jadwal terdekat yang masih tersedia.`;
  }

  return { items, notice };
}

export function CategoryCatalog({
  eyebrow,
  title,
  intro,
  items,
  query,
  dateText,
  notice,
  basePath,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  items: CatalogItem[];
  query?: string;
  dateText?: string;
  notice?: string;
  basePath: string;
}) {
  const hasFilter = Boolean(query || dateText);

  return (
    <div className="min-h-screen bg-white text-ink">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        href="#main"
      >
        Lewati ke konten
      </a>
      <SiteHeader />

      <main id="main">
        <section className="border-b border-hairline bg-mist">
          <div className="mx-auto max-w-[1240px] px-5 py-10">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-brand">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-[30px] font-extrabold tracking-tight text-ink sm:text-[34px]">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-600">
              {intro}
            </p>

            {hasFilter ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {query ? (
                  <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-hairline bg-white px-3 text-[12.5px] font-semibold text-ink">
                    Pencarian: {query}
                  </span>
                ) : null}
                {dateText ? (
                  <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-hairline bg-white px-3 text-[12.5px] font-semibold text-ink">
                    Tanggal: {dateText}
                  </span>
                ) : null}
                <a
                  className="inline-flex min-h-8 items-center rounded-full px-3 text-[12.5px] font-semibold text-brand hover:text-brand-dark"
                  href={basePath}
                >
                  Hapus filter
                </a>
              </div>
            ) : null}
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-10">
          {notice ? (
            <p
              className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900"
              role="status"
            >
              {notice}
            </p>
          ) : null}

          {items.length === 0 ? (
            <div className="rounded-2xl border border-hairline bg-mist px-6 py-14 text-center">
              <SearchX aria-hidden className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-4 text-[16px] font-bold text-ink">
                Belum ada hasil{query ? ` untuk \u201c${query}\u201d` : ""}
              </p>
              <p className="mx-auto mt-2 max-w-md text-[13.5px] text-slate-600">
                Coba kata kunci lain atau lihat seluruh pilihan yang tersedia.
              </p>
              <a
                className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand px-5 text-[14px] font-semibold text-white hover:bg-brand-dark"
                href={basePath}
              >
                Lihat semua pilihan
              </a>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((product) => {
                const schedules = product.variants.flatMap((variant) => variant.schedules);
                const price = schedules.length
                  ? Math.min(...schedules.map((schedule) => schedule.priceIdr))
                  : null;
                const next = schedules.length
                  ? schedules.reduce((earliest, schedule) =>
                      schedule.startsAt < earliest.startsAt ? schedule : earliest,
                    )
                  : null;
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
                        {product.isDemo ? (
                          <span className="absolute right-3 top-3 rounded-full bg-[#061a41]/80 px-2.5 py-1 text-[10.5px] font-semibold text-white">
                            Demo
                          </span>
                        ) : null}
                      </a>

                      <div className="flex flex-1 flex-col p-5">
                        <h2 className="text-[16px] font-bold leading-snug text-ink">
                          <a
                            className="hover:text-brand"
                            href={`/products/${encodeURIComponent(product.slug)}`}
                          >
                            {product.name}
                          </a>
                        </h2>
                        <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-slate-500">
                          <MapPin aria-hidden className="h-3.5 w-3.5" />
                          {product.location}
                        </p>
                        <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-slate-600">
                          {product.description}
                        </p>
                        {next ? (
                          <p className="mt-3 text-[12.5px] text-slate-500">
                            Jadwal terdekat {dateLabel(next.startsAt)} · sisa{" "}
                            {Math.max(next.capacity - next.reserved, 0)} kursi
                          </p>
                        ) : null}

                        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                          <p>
                            <span className="block text-[11px] text-slate-500">Mulai dari</span>
                            <span className="block text-[16px] font-extrabold text-sun">
                              {price === null ? "Jadwal belum tersedia" : money(price)}
                            </span>
                          </p>
                          <a
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand px-4 text-[13.5px] font-semibold text-white transition hover:bg-brand-dark"
                            href={`/products/${encodeURIComponent(product.slug)}`}
                          >
                            Lihat detail
                            <ArrowRight aria-hidden className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
