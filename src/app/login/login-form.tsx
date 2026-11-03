"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ initialRegister }: { initialRegister: boolean }) {
  const router = useRouter();
  const [register, setRegister] = useState(initialRegister);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const payload = {
      email: String(values.get("email") || ""),
      password: String(values.get("password") || ""),
      ...(register ? { name: String(values.get("name") || "") } : {}),
    };
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/auth/${register ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Permintaan belum berhasil.");
      }
      form.reset();
      if (register) {
        setRegister(false);
        setMessage(data.message);
      } else {
        router.replace("/bookings");
        router.refresh();
      }
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Koneksi terputus. Silakan coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }

  const fieldClass =
    "h-11 rounded-xl border border-hairline bg-white px-3 text-[14.5px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60";

  return (
    <div className="w-full max-w-md rounded-2xl border border-hairline bg-white p-6 shadow-[0_18px_45px_-24px_rgba(11,42,91,0.4)] sm:p-8">
      <h1 className="text-[24px] font-extrabold tracking-tight text-ink">
        {register ? "Buat akun" : "Masuk ke akun"}
      </h1>
      <p className="mt-1.5 text-[13px] text-slate-500">
        {register
          ? "Daftar untuk menyimpan pesanan dan wishlist perjalanan Anda."
          : "Lanjutkan pemesanan dan lihat riwayat perjalanan Anda."}
      </p>

      {error ? (
        <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-900" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-[13px] text-green-900" role="status">
          {message}
        </p>
      ) : null}

      <form className="mt-6 grid gap-4" onSubmit={submit}>
        {register ? (
          <label className="grid gap-1.5 text-[12.5px] font-semibold text-slate-600">
            Nama
            <input
              autoComplete="name"
              className={fieldClass}
              disabled={busy}
              maxLength={100}
              minLength={2}
              name="name"
              required
            />
          </label>
        ) : null}
        <label className="grid gap-1.5 text-[12.5px] font-semibold text-slate-600">
          Email
          <input
            autoComplete="email"
            className={fieldClass}
            disabled={busy}
            maxLength={254}
            name="email"
            required
            type="email"
          />
        </label>
        <label className="grid gap-1.5 text-[12.5px] font-semibold text-slate-600">
          Password
          <input
            aria-describedby="password-help"
            autoComplete={register ? "new-password" : "current-password"}
            className={fieldClass}
            disabled={busy}
            maxLength={256}
            minLength={12}
            name="password"
            required
            type="password"
          />
        </label>
        <p className="text-[12px] text-slate-500" id="password-help">
          Minimal 12 karakter, maksimal 256 byte.
        </p>
        <button
          className="mt-1 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-[14.5px] font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
          disabled={busy}
        >
          {busy ? "Memproses…" : register ? "Daftar" : "Masuk"}
        </button>
      </form>

      <button
        className="mt-5 inline-flex min-h-11 items-center text-[13px] font-semibold text-brand hover:text-brand-dark disabled:opacity-60"
        disabled={busy}
        onClick={() => {
          setRegister((value) => !value);
          setError("");
          setMessage("");
        }}
        type="button"
      >
        {register ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
      </button>
    </div>
  );
}
