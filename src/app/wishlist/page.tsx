"use client";
import { useEffect, useState } from "react";

type Item = {
  product: {
    id: string;
    slug: string;
    name: string;
    location: string;
    isDemo: boolean;
  };
};
export default function WishlistPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const requestKey = `${page}:${revision}`;
  const [previousRequestKey, setPreviousRequestKey] = useState(requestKey);
  if (previousRequestKey !== requestKey) {
    setPreviousRequestKey(requestKey);
    setLoading(true);
    setError("");
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/wishlist?page=${page}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Wishlist belum dapat dimuat.");
        if (!controller.signal.aborted) {
          setItems(data.items);
          setTotal(data.total);
        }
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error ? reason.message : "Koneksi terputus.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, revision]);
  async function remove(productId: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Produk belum dapat dihapus.");
      if (items.length === 1 && page > 1) setPage((value) => value - 1);
      else setRevision((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Koneksi terputus.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-10">
      <nav aria-label="Navigasi" className="flex flex-wrap gap-5 text-sky-800">
        <a href="/">Harmonika Travel</a>
        <a href="/bookings">Pesanan</a>
        <a href="/login">Masuk</a>
      </nav>
      <h1 className="my-8 text-3xl font-bold">Wishlist saya</h1>
      {error && (
        <p role="alert" className="my-5 rounded bg-red-50 p-4 text-red-900">
          {error}{" "}
          <button
            className="underline"
            onClick={() => setRevision((value) => value + 1)}
          >
            Coba lagi
          </button>
        </p>
      )}
      <section aria-live="polite" aria-busy={loading}>
        {loading ? (
          <p>Memuat wishlist…</p>
        ) : !error && items.length === 0 ? (
          <p>
            Belum ada produk tersimpan.{" "}
            <a href="/" className="text-sky-800 underline">
              Jelajahi katalog
            </a>
          </p>
        ) : (
          !error &&
          items.map(({ product }) => (
            <article
              key={product.id}
              className="mb-5 rounded-xl border border-slate-300 p-5"
            >
              <h2 className="text-xl font-bold">
                <a
                  className="text-sky-800 underline"
                  href={`/products/${encodeURIComponent(product.slug)}`}
                >
                  {product.name}
                </a>
              </h2>
              <p className="mt-2">{product.location}</p>
              {product.isDemo && (
                <p className="mt-2 text-amber-900">Produk demo</p>
              )}
              <button
                disabled={busy}
                onClick={() => remove(product.id)}
                className="mt-4 rounded border border-red-800 px-4 py-3 text-red-900 disabled:opacity-50"
              >
                Hapus dari wishlist
              </button>
            </article>
          ))
        )}
      </section>
      {!loading && !error && total > 20 && (
        <nav
          aria-label="Halaman wishlist"
          className="mt-6 flex flex-wrap items-center gap-4"
        >
          <button
            disabled={busy || page === 1}
            onClick={() => setPage((value) => value - 1)}
            className="rounded border p-3 disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span>
            Halaman {page} dari {Math.ceil(total / 20)}
          </span>
          <button
            disabled={busy || page * 20 >= total}
            onClick={() => setPage((value) => value + 1)}
            className="rounded border p-3 disabled:opacity-40"
          >
            Berikutnya
          </button>
        </nav>
      )}
    </main>
  );
}
