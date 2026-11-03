"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
type Booking = {
  id: string;
  reference: string;
  productName: string;
  variantName: string;
  quantity: number;
  totalIdr: number;
  status: string;
  isDemo: boolean;
  schedule: { startsAt: string; endsAt: string };
};
export default function BookingsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const requestKey = `${page}:${revision}`;
  const [previousRequestKey, setPreviousRequestKey] = useState(requestKey);
  if (previousRequestKey !== requestKey) {
    setPreviousRequestKey(requestKey);
    setLoading(true);
    setError("");
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/bookings?page=${page}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Pesanan belum dapat dimuat.");
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
  async function cancel(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    if (busy) return;
    const reason = String(
      new FormData(event.currentTarget).get("reason") || "",
    );
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_cancellation", reason }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Permintaan belum tersimpan.");
      setRevision((value) => value + 1);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Periksa status pesanan sebelum mencoba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Belum berhasil keluar.");
      router.replace("/login");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Koneksi terputus.");
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-10">
      <nav aria-label="Navigasi" className="flex flex-wrap gap-5 text-sky-800">
        <a href="/">Harmonika Travel</a>
        <a href="/login">Masuk</a>
        <a href="/wishlist">Wishlist</a>
        <button disabled={busy} onClick={logout}>
          Keluar
        </button>
      </nav>
      <h1 className="my-8 text-3xl font-bold">Pesanan saya</h1>
      {error && (
        <p role="alert" className="my-5 rounded bg-red-50 p-4 text-red-900">
          {error}
        </p>
      )}
      <section aria-live="polite" aria-busy={loading}>
        {loading ? (
          <p>Memuat pesanan…</p>
        ) : !error && items.length === 0 ? (
          <p>
            Belum ada pesanan.{" "}
            <a href="/" className="text-sky-800 underline">
              Jelajahi katalog
            </a>
          </p>
        ) : (
          !error &&
          items.map((item) => (
            <article
              key={item.id}
              className="mb-5 rounded-xl border border-slate-300 p-5"
            >
              <h2 className="text-xl font-bold">{item.productName}</h2>
              <p>{item.variantName}</p>
              <p className="break-all text-sm">{item.reference}</p>
              <p className="mt-3">
                {new Date(item.schedule.startsAt).toLocaleString("id-ID", {
                  timeZone: "Asia/Jakarta",
                })}{" "}
                WIB
              </p>
              <p>
                {item.quantity} unit ·{" "}
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(item.totalIdr)}
              </p>
              <p>
                Status: <strong>{item.status}</strong>
              </p>
              {item.isDemo && (
                <p className="mt-3 text-amber-900">
                  Pesanan demo tanpa pembayaran atau tiket nyata.
                </p>
              )}
              {["PENDING", "CONFIRMED"].includes(item.status) &&
                new Date(item.schedule.startsAt).getTime() > Date.now() && (
                  <form
                    onSubmit={(event) => cancel(event, item.id)}
                    className="mt-5 grid gap-3"
                  >
                    <label className="grid gap-2">
                      Alasan pembatalan
                      <textarea
                        name="reason"
                        required
                        minLength={5}
                        maxLength={1000}
                        disabled={busy}
                        className="rounded border border-slate-400 p-3"
                      />
                    </label>
                    <button
                      disabled={busy}
                      className="rounded border border-red-800 px-4 py-3 text-red-900 disabled:opacity-50"
                    >
                      Ajukan pembatalan
                    </button>
                  </form>
                )}
            </article>
          ))
        )}
      </section>
      {!loading && !error && total > 20 && (
        <nav aria-label="Halaman pesanan" className="flex items-center gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
            className="rounded border p-3 disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span>
            Halaman {page} dari {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page * 20 >= total}
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
