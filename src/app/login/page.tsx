"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [register, setRegister] = useState(false);
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
      const response = await fetch(
        `/api/auth/${register ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Permintaan belum berhasil.");
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
        reason instanceof Error
          ? reason.message
          : "Koneksi terputus. Silakan coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-12">
      <a href="/" className="font-bold text-sky-800">
        Harmonika Travel
      </a>
      <h1 className="mt-8 text-3xl font-bold">
        {register ? "Buat akun" : "Masuk ke akun"}
      </h1>
      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-red-900">
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mt-5 rounded-lg bg-green-50 p-4 text-green-900"
        >
          {message}
        </p>
      )}
      <form onSubmit={submit} className="mt-6 grid gap-5">
        {register && (
          <label className="grid gap-2">
            Nama
            <input
              required
              name="name"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              disabled={busy}
              className="rounded-lg border border-slate-400 p-3"
            />
          </label>
        )}
        <label className="grid gap-2">
          Email
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            maxLength={254}
            disabled={busy}
            className="rounded-lg border border-slate-400 p-3"
          />
        </label>
        <label className="grid gap-2">
          Password
          <input
            required
            type="password"
            name="password"
            autoComplete={register ? "new-password" : "current-password"}
            minLength={12}
            maxLength={256}
            disabled={busy}
            aria-describedby="password-help"
            className="rounded-lg border border-slate-400 p-3"
          />
        </label>
        <p id="password-help" className="text-sm text-slate-600">
          Minimal 12 karakter, maksimal 256 byte.
        </p>
        <button
          disabled={busy}
          className="rounded-lg bg-sky-800 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Memproses…" : register ? "Daftar" : "Masuk"}
        </button>
      </form>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setRegister((value) => !value);
          setError("");
          setMessage("");
        }}
        className="mt-6 py-3 text-sky-800 underline disabled:opacity-50"
      >
        {register ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
      </button>
    </main>
  );
}
