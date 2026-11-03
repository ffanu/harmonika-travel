"use client";

import { FormEvent, useEffect, useState } from "react";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  location: string;
  isDemo: boolean;
  variants: {
    id: string;
    name: string;
    schedules: {
      id: string;
      priceIdr: number;
      available: number;
      startsAt: string;
    }[];
  }[];
};
const categories = [
  ["HOTEL", "Hotel"],
  ["FLIGHT", "Pesawat"],
  ["AIRPORT_TRANSFER", "Antar jemput"],
  ["CAR_RENTAL", "Rental mobil"],
  ["ACTIVITY", "Aktivitas"],
  ["CRUISE", "Kapal pesiar"],
];
const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function Home() {
  const [category, setCategory] = useState("HOTEL");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [search, setSearch] = useState("category=HOTEL");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const requestKey = `${search}:${page}`;
  const [previousRequestKey, setPreviousRequestKey] = useState(requestKey);
  if (previousRequestKey !== requestKey) {
    setPreviousRequestKey(requestKey);
    setLoading(true);
    setError("");
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/catalog?${search}&page=${page}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Katalog belum dapat dimuat.");
        if (!controller.signal.aborted) {
          setItems(data.items);
          setTotal(data.total);
        }
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Katalog belum dapat dimuat.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [search, page]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({
      category,
      quantity: String(quantity),
    });
    if (query.trim()) params.set("q", query.trim());
    if (date) params.set("date", date);
    setPage(1);
    setSearch(params.toString());
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a href="#main" className="sr-only focus:not-sr-only">
        Lewati ke konten
      </a>
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <a href="/" className="text-xl font-bold text-sky-800">
            Harmonika Travel
          </a>
          <nav
            aria-label="Navigasi utama"
            className="flex flex-wrap gap-1 text-sm"
          >
            {/* min-h-6 keeps every tap target at 24px, the WCAG 2.5.8 minimum. */}
            <a className="inline-flex min-h-6 items-center rounded px-2 py-1 hover:bg-slate-100" href="/promos">Promo</a>
            <a className="inline-flex min-h-6 items-center rounded px-2 py-1 hover:bg-slate-100" href="/bookings">Pesanan</a>
            <a className="inline-flex min-h-6 items-center rounded px-2 py-1 hover:bg-slate-100" href="/wishlist">Wishlist</a>
            <a className="inline-flex min-h-6 items-center rounded px-2 py-1 hover:bg-slate-100" href="/partnership">Kemitraan</a>
            <a className="inline-flex min-h-6 items-center rounded px-2 py-1 hover:bg-slate-100" href="/login">Masuk</a>
          </nav>
        </div>
      </header>
      <main id="main">
        <section className="bg-sky-950 px-5 py-16 text-white">
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-sky-200">
              Mulai perjalananmu
            </p>
            <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
              Temukan cerita baru di setiap tujuan.
            </h1>
            <p className="mt-5 max-w-xl text-sky-100">
              Jelajahi penginapan, transportasi, dan aktivitas dalam satu
              tempat.
            </p>
            <form
              onSubmit={submit}
              className="mt-9 rounded-2xl bg-white p-5 text-slate-900 shadow-xl"
            >
              <fieldset>
                <legend className="mb-3 font-semibold">
                  Pilihan perjalanan
                </legend>
                <div className="flex flex-wrap gap-2">
                  {categories.map(([value, label]) => (
                    <label
                      key={value}
                      className={`cursor-pointer rounded-lg border px-4 py-3 ${category === value ? "border-sky-700 bg-sky-50 text-sky-900" : "border-slate-300"}`}
                    >
                      <input
                        className="mr-2 accent-sky-700"
                        type="radio"
                        name="category"
                        value={value}
                        checked={category === value}
                        onChange={() => setCategory(value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <label className="grid gap-2 text-sm font-medium">
                  Tujuan atau produk
                  <input
                    className="rounded-lg border border-slate-400 p-3"
                    value={query}
                    maxLength={100}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari Bali, Jakarta…"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Tanggal
                  <input
                    className="rounded-lg border border-slate-400 p-3"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Jumlah tamu / penumpang
                  <input
                    className="rounded-lg border border-slate-400 p-3"
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Number(event.target.value))
                    }
                  />
                </label>
                <button
                  className="self-end rounded-lg bg-orange-700 px-5 py-3 font-semibold text-white hover:bg-orange-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-700"
                  type="submit"
                >
                  Cari perjalanan
                </button>
              </div>
            </form>
          </div>
        </section>
        <section
          aria-labelledby="catalog-title"
          className="mx-auto max-w-6xl px-5 py-12"
        >
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="catalog-title" className="text-2xl font-bold">
                Pilihan untuk perjalananmu
              </h2>
              <p className="mt-2 text-slate-600">
                Katalog demo. Pemesanan belum menerbitkan tiket atau menerima
                pembayaran.
              </p>
            </div>
          </div>
          <div aria-live="polite" aria-busy={loading}>
            {loading ? (
              <p className="rounded-xl border bg-white p-8">
                Memuat pilihan perjalanan…
              </p>
            ) : error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-300 bg-red-50 p-8 text-red-900"
              >
                {error}
              </p>
            ) : items.length === 0 ? (
              <p className="rounded-xl border bg-white p-8">
                Belum ada pilihan untuk pencarian ini. Coba tujuan atau tanggal
                lain.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((product) => {
                  const schedules = product.variants.flatMap(
                    (variant) => variant.schedules,
                  );
                  const price = schedules.length
                    ? Math.min(
                        ...schedules.map((schedule) => schedule.priceIdr),
                      )
                    : null;
                  return (
                    <article
                      key={product.id}
                      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <p className="text-sm font-medium text-sky-800">
                        {product.location}
                      </p>
                      <h3 className="mt-3 text-xl font-bold">
                        <a
                          className="underline-offset-4 hover:underline"
                          href={`/products/${encodeURIComponent(product.slug)}`}
                        >
                          {product.name}
                        </a>
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                        {product.description}
                      </p>
                      {product.isDemo && (
                        <p className="mt-4 text-xs font-semibold text-amber-900">
                          Produk demo
                        </p>
                      )}
                      <div className="mt-auto pt-6">
                        <p className="text-xs text-slate-500">Mulai dari</p>
                        <p className="mt-1 text-lg font-bold text-orange-800">
                          {price === null
                            ? "Jadwal tidak tersedia"
                            : money(price)}
                        </p>
                        <a
                          className="mt-4 inline-block rounded-lg bg-sky-800 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-900"
                          href={`/products/${encodeURIComponent(product.slug)}`}
                        >
                          Lihat detail
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
          {!loading && !error && total > 12 && (
            <nav
              aria-label="Halaman katalog"
              className="mt-8 flex items-center justify-center gap-4"
            >
              <button
                className="rounded border bg-white px-4 py-3 disabled:opacity-40"
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Sebelumnya
              </button>
              <span>
                Halaman {page} dari {Math.ceil(total / 12)}
              </span>
              <button
                className="rounded border bg-white px-4 py-3 disabled:opacity-40"
                disabled={page * 12 >= total}
                onClick={() => setPage((value) => value + 1)}
              >
                Berikutnya
              </button>
            </nav>
          )}
        </section>
      </main>
      <footer className="border-t bg-white px-5 py-8 text-sm text-slate-600">
        <div className="mx-auto max-w-6xl">
          <p className="font-semibold text-slate-900">Harmonika Travel</p>
          <p className="mt-2">Rencanakan perjalanan dengan lebih mudah.</p>
        </div>
      </footer>
    </div>
  );
}
