"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Schedule = {
  id: string;
  startsAt: string;
  endsAt: string;
  priceIdr: number;
  available: number;
};
type Product = {
  id: string;
  name: string;
  description: string;
  location: string;
  isDemo: boolean;
  variants: {
    id: string;
    name: string;
    description: string;
    schedules: Schedule[];
  }[];
};
const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState<{
    fingerprint: string;
    key: string;
  } | null>(null);

  const [previousSlug, setPreviousSlug] = useState(slug);
  if (previousSlug !== slug) {
    setPreviousSlug(slug);
    setLoading(true);
    setError("");
    setMessage("");
    setProduct(null);
    setScheduleId("");
    setQuantity(1);
    setAttempt(null);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/products/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Produk belum dapat dimuat.");
        if (!controller.signal.aborted) setProduct(data.item);
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Produk belum dapat dimuat.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  const selected = product?.variants
    .flatMap((variant) => variant.schedules)
    .find((schedule) => schedule.id === scheduleId);

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      scheduleId,
      quantity,
      contactName: String(form.get("contactName") || ""),
      contactEmail: String(form.get("contactEmail") || ""),
      contactPhone: String(form.get("contactPhone") || ""),
      promoCode: String(form.get("promoCode") || "").trim(),
    };
    const fingerprint = JSON.stringify(payload);
    const key =
      attempt?.fingerprint === fingerprint ? attempt.key : crypto.randomUUID();
    setAttempt({ fingerprint, key });
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, idempotencyKey: key }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Pemesanan belum berhasil.");
      setMessage(
        `Pesanan ${data.booking.reference} tersimpan. Total ${money(data.booking.totalIdr)}. Ini pesanan demo tanpa tiket atau pembayaran.`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Koneksi terputus. Periksa daftar pesanan sebelum mencoba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveWishlist() {
    if (!product || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Wishlist belum tersimpan.");
      setMessage("Produk tersimpan di wishlist.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Wishlist belum tersimpan.",
      );
    } finally {
      setBusy(false);
    }
  }

  const field = "rounded-lg border border-slate-400 p-3";
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-10">
      <nav
        aria-label="Navigasi"
        className="mb-8 flex flex-wrap gap-5 text-sky-800"
      >
        <a href="/">Harmonika Travel</a>
        <a href="/bookings">Pesanan saya</a>
        <a href="/login">Masuk</a>
      </nav>
      {loading && <p role="status">Memuat produk…</p>}
      {error && (
        <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-red-900">
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mb-5 rounded-lg bg-green-50 p-4 text-green-900"
        >
          {message}{" "}
          <a href="/bookings" className="underline">
            Lihat pesanan
          </a>
        </p>
      )}
      {product && (
        <>
          <p className="text-sky-800">{product.location}</p>
          <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
          <p className="mt-5 whitespace-pre-wrap leading-relaxed">
            {product.description}
          </p>
          <p className="my-5 rounded-lg bg-amber-50 p-4 text-amber-950">
            {product.isDemo
              ? "Produk demo. Pemesanan hanya untuk mencoba alur aplikasi; tidak ada pembayaran atau tiket nyata."
              : "Pemesanan operasional belum tersedia."}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={saveWishlist}
            className="rounded-lg border border-sky-800 px-4 py-3 text-sky-900 disabled:opacity-50"
          >
            Simpan ke wishlist
          </button>
          <section className="mt-10" aria-labelledby="booking-heading">
            <h2 id="booking-heading" className="text-2xl font-bold">
              Pilih jadwal
            </h2>
            {!product.variants.some(
              (variant) => variant.schedules.length > 0,
            ) ? (
              <p className="mt-4">Belum ada jadwal tersedia.</p>
            ) : (
              <form onSubmit={book} className="mt-5 grid gap-5">
                <label className="grid gap-2">
                  Varian dan jadwal
                  <select
                    required
                    value={scheduleId}
                    onChange={(event) => setScheduleId(event.target.value)}
                    className={field}
                  >
                    <option value="">Pilih jadwal</option>
                    {product.variants.map((variant) => (
                      <optgroup key={variant.id} label={variant.name}>
                        {variant.schedules.map((schedule) => (
                          <option key={schedule.id} value={schedule.id}>
                            {new Date(schedule.startsAt).toLocaleString(
                              "id-ID",
                              { timeZone: "Asia/Jakarta" },
                            )}{" "}
                            WIB — {money(schedule.priceIdr)} — tersedia{" "}
                            {schedule.available}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  Jumlah
                  <input
                    required
                    type="number"
                    min={1}
                    max={Math.min(20, selected?.available ?? 20)}
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Number(event.target.value))
                    }
                    className={field}
                  />
                </label>
                <label className="grid gap-2">
                  Nama kontak
                  <input
                    required
                    name="contactName"
                    autoComplete="name"
                    minLength={2}
                    maxLength={100}
                    className={field}
                  />
                </label>
                <label className="grid gap-2">
                  Email kontak
                  <input
                    required
                    type="email"
                    name="contactEmail"
                    autoComplete="email"
                    maxLength={254}
                    className={field}
                  />
                </label>
                <label className="grid gap-2">
                  Telepon
                  <input
                    required
                    type="tel"
                    name="contactPhone"
                    autoComplete="tel"
                    minLength={8}
                    maxLength={25}
                    className={field}
                  />
                </label>
                <label className="grid gap-2">
                  Kode promo (opsional)
                  <input name="promoCode" maxLength={40} className={field} />
                </label>
                {selected && (
                  <p>
                    Subtotal sebelum promo:{" "}
                    <strong>{money(selected.priceIdr * quantity)}</strong>.
                    Harga dan ketersediaan diperiksa kembali oleh server.
                  </p>
                )}
                <button
                  disabled={busy || !product.isDemo || !selected}
                  className="rounded-lg bg-sky-800 px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "Memproses…" : "Buat pesanan demo"}
                </button>
              </form>
            )}
          </section>
        </>
      )}
    </main>
  );
}
