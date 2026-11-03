"use client";
import { FormEvent, useEffect, useState } from "react";

const resources = [
  "destinations",
  "products",
  "variants",
  "schedules",
  "promos",
  "contents",
  "bookings",
  "partnerships",
];
const labels: Record<string, string> = {
  destinations: "Destinasi",
  products: "Produk",
  variants: "Varian",
  schedules: "Jadwal",
  promos: "Promo",
  contents: "Konten",
  bookings: "Pesanan",
  partnerships: "Kemitraan",
};

export default function AdminPage() {
  const [resource, setResource] = useState("destinations");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    items: Record<string, unknown>[];
    total: number;
  }>({ items: [], total: 0 });
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [method, setMethod] = useState("POST");
  const [body, setBody] = useState("{}");

  const requestKey = `${resource}:${page}:${revision}`;
  const [previousRequestKey, setPreviousRequestKey] = useState(requestKey);
  if (previousRequestKey !== requestKey) {
    setPreviousRequestKey(requestKey);
    setLoading(true);
    setError("");
    setResult({ items: [], total: 0 });
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/${resource}?page=${page}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Data belum dapat dimuat.");
        if (!controller.signal.aborted) setResult(data);
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
  }, [resource, page, revision]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch {
      setError("JSON tidak valid.");
      return;
    }
    if (
      method === "DELETE" &&
      !window.confirm(
        "Hapus data ini? Data yang masih digunakan akan ditolak oleh server.",
      )
    )
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/${resource}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Perubahan belum tersimpan.");
      setMessage("Perubahan tersimpan.");
      setRevision((value) => value + 1);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Koneksi terputus. Periksa data sebelum mengulangi perubahan.",
      );
    } finally {
      setBusy(false);
    }
  }

  const statusResource = resource === "bookings" || resource === "partnerships";
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10">
      <nav className="flex gap-5 text-sky-800" aria-label="Navigasi">
        <a href="/">Harmonika Travel</a>
        <a href="/login">Masuk</a>
      </nav>
      <h1 className="my-8 text-3xl font-bold">Administrasi perjalanan</h1>
      <label className="grid max-w-md gap-2">
        Kelola data
        <select
          disabled={busy}
          value={resource}
          onChange={(event) => {
            setResource(event.target.value);
            setPage(1);
            setMethod(
              ["bookings", "partnerships"].includes(event.target.value)
                ? "PATCH"
                : "POST",
            );
            setBody("{}");
            setMessage("");
          }}
          className="rounded border border-slate-400 p-3"
        >
          {resources.map((value) => (
            <option key={value} value={value}>
              {labels[value]}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="my-5 rounded bg-red-50 p-4 text-red-900">
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="my-5 rounded bg-green-50 p-4 text-green-900"
        >
          {message}
        </p>
      )}
      <section aria-live="polite" aria-busy={loading} className="my-8">
        <h2 className="mb-4 text-xl font-bold">{labels[resource]}</h2>
        {loading ? (
          <p>Memuat data…</p>
        ) : result.items.length === 0 ? (
          <p>Belum ada data yang dapat ditampilkan.</p>
        ) : (
          result.items.map((item, index) => (
            <details
              key={String(item.id ?? index)}
              className="mb-3 rounded border p-4"
            >
              <summary className="cursor-pointer break-all">
                {String(
                  item.name ??
                    item.title ??
                    item.reference ??
                    item.businessName ??
                    item.id,
                )}
              </summary>
              <pre className="mt-4 overflow-auto whitespace-pre-wrap break-all text-sm">
                {JSON.stringify(item, null, 2)}
              </pre>
            </details>
          ))
        )}
        <nav
          aria-label="Halaman data"
          className="mt-5 flex flex-wrap items-center gap-4"
        >
          <button
            disabled={loading || busy || page === 1}
            onClick={() => setPage((value) => value - 1)}
            className="rounded border p-3 disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span>
            Halaman {page} · {result.total} data
          </span>
          <button
            disabled={loading || busy || page * 20 >= result.total}
            onClick={() => setPage((value) => value + 1)}
            className="rounded border p-3 disabled:opacity-40"
          >
            Berikutnya
          </button>
          <button
            disabled={busy}
            onClick={() => setRevision((value) => value + 1)}
            className="rounded border p-3"
          >
            Muat ulang
          </button>
        </nav>
      </section>
      <section aria-labelledby="editor-title">
        <h2 id="editor-title" className="text-xl font-bold">
          Editor data terstruktur
        </h2>
        <p className="my-3">
          Masukkan properti yang diterima API. Gunakan id untuk hapus. Pembaruan
          jadwal dan promo memakai objek id dan data. Status pesanan memakai id,
          expectedStatus, dan status; kemitraan memakai id dan status.
        </p>
        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-2">
            Tindakan
            <select
              disabled={busy}
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className="rounded border border-slate-400 p-3"
            >
              {(statusResource ? ["PATCH"] : ["POST", "PUT", "DELETE"]).map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </label>
          <label className="grid gap-2">
            Data JSON
            <textarea
              required
              disabled={busy}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={14}
              maxLength={30000}
              spellCheck={false}
              className="rounded border border-slate-400 p-3 font-mono text-sm"
            />
          </label>
          <button
            disabled={busy || loading}
            className="rounded bg-sky-800 p-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Menyimpan…" : "Simpan perubahan"}
          </button>
        </form>
      </section>
    </main>
  );
}
