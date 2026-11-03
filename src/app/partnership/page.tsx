"use client";
import { FormEvent, useState } from "react";

export default function PartnershipPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/partnerships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Pengajuan belum tersimpan.");
      setMessage(data.message);
      form.reset();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Koneksi terputus. Status pengajuan belum diketahui.",
      );
    } finally {
      setBusy(false);
    }
  }
  const field = "rounded-lg border border-slate-400 p-3";
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10">
      <a href="/" className="font-bold text-sky-800">
        Harmonika Travel
      </a>
      <h1 className="mt-8 text-3xl font-bold">Bergabung sebagai mitra</h1>
      <p className="mt-4 text-slate-600">
        Ceritakan usaha dan layanan perjalanan yang ingin Anda tawarkan.
        Pengajuan akan ditinjau oleh admin.
      </p>
      {error && (
        <p role="alert" className="mt-5 rounded bg-red-50 p-4 text-red-900">
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mt-5 rounded bg-green-50 p-4 text-green-900"
        >
          {message}
        </p>
      )}
      <form onSubmit={submit} className="mt-6">
        <fieldset disabled={busy} className="grid gap-5">
          <legend className="mb-4 font-semibold">Data usaha dan kontak</legend>
          <label className="grid gap-2">
            Nama usaha
            <input
              name="businessName"
              required
              minLength={2}
              maxLength={150}
              autoComplete="organization"
              className={field}
            />
          </label>
          <label className="grid gap-2">
            Nama kontak
            <input
              name="contactName"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              className={field}
            />
          </label>
          <label className="grid gap-2">
            Email
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              className={field}
            />
          </label>
          <label className="grid gap-2">
            Telepon
            <input
              name="phone"
              type="tel"
              required
              minLength={8}
              maxLength={25}
              autoComplete="tel"
              className={field}
            />
          </label>
          <label className="grid gap-2">
            Kategori layanan
            <select name="category" required defaultValue="" className={field}>
              <option value="" disabled>
                Pilih kategori
              </option>
              <option value="HOTEL">Hotel</option>
              <option value="FLIGHT">Pesawat</option>
              <option value="AIRPORT_TRANSFER">Antar jemput</option>
              <option value="CAR_RENTAL">Rental mobil</option>
              <option value="ACTIVITY">Aktivitas</option>
              <option value="CRUISE">Kapal pesiar</option>
            </select>
          </label>
          <label className="grid gap-2">
            Tentang usaha Anda
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              className={field}
            />
          </label>
          <p className="text-sm text-slate-600">
            Data kontak digunakan untuk meninjau dan menindaklanjuti pengajuan
            kemitraan.
          </p>
          <button className="rounded-lg bg-sky-800 px-5 py-3 font-semibold text-white disabled:opacity-50">
            {busy ? "Mengirim…" : "Kirim pengajuan"}
          </button>
        </fieldset>
      </form>
    </main>
  );
}
