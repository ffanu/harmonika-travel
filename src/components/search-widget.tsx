"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ArrowLeftRight,
  BedDouble,
  CalendarDays,
  Car,
  ChevronDown,
  Compass,
  MapPin,
  MoonStar,
  Mountain,
  Plane,
  Search,
  Users,
} from "lucide-react";
import { airportOptions, cabinOptions, guestOptions } from "@/lib/home-content";

type TabId = "flights" | "hotels" | "umrah" | "trips" | "cars" | "activities";

const tabs: { id: TabId; label: string; icon: typeof Plane }[] = [
  { id: "flights", label: "Pesawat", icon: Plane },
  { id: "hotels", label: "Hotel", icon: BedDouble },
  { id: "umrah", label: "Umrah & Haji", icon: MoonStar },
  { id: "trips", label: "Paket Wisata", icon: Mountain },
  { id: "cars", label: "Sewa Mobil", icon: Car },
  { id: "activities", label: "Aktivitas", icon: Compass },
];

const submitLabel: Record<TabId, string> = {
  flights: "Cari Tiket",
  hotels: "Cari Hotel",
  umrah: "Cari Paket",
  trips: "Cari Paket",
  cars: "Cari Mobil",
  activities: "Cari Aktivitas",
};

/** Kelas grid ditulis literal per tab agar Tailwind dapat memindainya. */
const gridClass: Record<TabId, string> = {
  flights:
    "sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_0.85fr_0.85fr_1.3fr_auto]",
  hotels: "sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1.25fr_auto]",
  umrah: "sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]",
  trips: "sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_auto]",
  cars: "sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]",
  activities: "sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto]",
};

const initialValues = {
  from: "Jakarta (CGK)",
  to: "Madinah (MED)",
  depart: "",
  back: "",
  cabin: cabinOptions[0],
  city: "",
  checkin: "",
  checkout: "",
  guests: guestOptions[0],
  month: "",
  jamaah: "1 Jamaah",
};

type Values = typeof initialValues;

const labelClass = "mb-1.5 block text-[12.5px] font-semibold text-slate-600";

// Ikon kalender bawaan dihapus agar teks tanggal tidak tertimpa; pemilih tetap
// terbuka saat bidang diklik.
const controlClass =
  "h-[46px] w-full rounded-xl border border-hairline bg-white pl-9 pr-3 text-[14px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit]:truncate";

const iconClass =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400";

function FieldShell({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="min-w-0">
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  );
}

export function SearchWidget() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("flights");
  const [values, setValues] = useState<Values>(initialValues);

  const set = (key: keyof Values) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  function submit() {
    const params = new URLSearchParams();
    const q =
      tab === "flights"
        ? values.to.trim() || values.from.trim()
        : values.city.trim();

    if (tab === "flights") {
      if (q) params.set("q", q);
      if (values.from.trim()) params.set("from", values.from.trim());
      if (values.to.trim()) params.set("to", values.to.trim());
      if (values.depart) params.set("date", values.depart);
      if (values.back) params.set("return", values.back);
      if (values.cabin) params.set("pax", values.cabin);
      router.push(`/flights?${params.toString()}`);
      return;
    }

    if (tab === "hotels") {
      if (q) params.set("q", q);
      if (values.checkin) params.set("date", values.checkin);
      if (values.checkout) params.set("checkout", values.checkout);
      if (values.guests) params.set("pax", values.guests);
      router.push(`/hotels?${params.toString()}`);
      return;
    }

    if (tab === "umrah") {
      params.set("q", q || "Umrah");
      if (values.month) params.set("month", values.month);
      if (values.jamaah) params.set("pax", values.jamaah);
      router.push(`/trips?${params.toString()}`);
      return;
    }

    const fallback =
      tab === "cars" ? "Rental" : tab === "activities" ? "Aktivitas" : "Wisata";
    params.set("q", q || fallback);
    if (values.depart) params.set("date", values.depart);
    if (values.checkin) params.set("date", values.checkin);
    if (tab === "cars" && values.checkout) params.set("return", values.checkout);
    if (tab !== "cars" && values.jamaah) params.set("pax", values.jamaah);
    router.push(`/trips?${params.toString()}`);
  }

  return (
    <form
      className="rounded-[20px] border border-hairline bg-white p-4 shadow-[0_18px_45px_-18px_rgba(11,42,91,0.35)] sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div
        aria-label="Jenis perjalanan"
        className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        role="tablist"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              aria-selected={active}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-[14px] transition ${
                active
                  ? "border-brand bg-white font-semibold text-brand shadow-[0_6px_16px_-8px_rgba(28,90,224,0.55)]"
                  : "border-transparent bg-white font-medium text-slate-600 hover:border-hairline hover:text-ink"
              }`}
              key={id}
              onClick={() => setTab(id)}
              role="tab"
              type="button"
            >
              <Icon aria-hidden className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      <div className={`mt-4 grid gap-3 ${gridClass[tab]}`} role="tabpanel">
        {tab === "flights" ? (
          <>
            <FieldShell label="Dari">
              <div className="relative">
                <MapPin aria-hidden className={iconClass} />
                <input
                  aria-label="Kota atau bandara asal"
                  autoComplete="off"
                  className={controlClass}
                  list="bandara"
                  onChange={(event) => set("from")(event.target.value)}
                  value={values.from}
                />
              </div>
            </FieldShell>

            <button
              aria-label="Tukar asal dan tujuan"
              className="mb-[1px] hidden h-[46px] w-[46px] items-center justify-center self-end rounded-full border border-hairline bg-white text-brand transition hover:border-brand hover:bg-brand-soft lg:inline-flex"
              onClick={() =>
                setValues((current) => ({
                  ...current,
                  from: current.to,
                  to: current.from,
                }))
              }
              type="button"
            >
              <ArrowLeftRight aria-hidden className="h-4 w-4" />
            </button>

            <FieldShell label="Ke">
              <div className="relative">
                <MapPin aria-hidden className={iconClass} />
                <input
                  aria-label="Kota atau bandara tujuan"
                  autoComplete="off"
                  className={controlClass}
                  list="bandara"
                  onChange={(event) => set("to")(event.target.value)}
                  required
                  value={values.to}
                />
              </div>
            </FieldShell>
          </>
        ) : (
          <FieldShell label={tab === "cars" ? "Lokasi penjemputan" : "Destinasi"}>
            <div className="relative">
              <MapPin aria-hidden className={iconClass} />
              <input
                aria-label={tab === "cars" ? "Lokasi penjemputan" : "Destinasi"}
                autoComplete="off"
                className={controlClass}
                onChange={(event) => set("city")(event.target.value)}
                placeholder={
                  tab === "umrah"
                    ? "Jakarta, Surabaya…"
                    : tab === "cars"
                      ? "Bali, Jakarta…"
                      : "Bali, Labuan Bajo…"
                }
                required={tab !== "umrah"}
                value={values.city}
              />
            </div>
          </FieldShell>
        )}

        {tab === "flights" || tab === "hotels" ? (
          <FieldShell
            label={tab === "flights" ? "Tanggal berangkat" : "Check-in"}
          >
            <div className="relative">
              <CalendarDays aria-hidden className={iconClass} />
              <input
                aria-label={
                  tab === "flights" ? "Tanggal berangkat" : "Tanggal check-in"
                }
                className={controlClass}
                onChange={(event) => set("depart")(event.target.value)}
                type="date"
                value={values.depart}
              />
            </div>
          </FieldShell>
        ) : null}

        {tab === "flights" ? (
          <FieldShell label="Pulang (opsional)">
            <div className="relative">
              <CalendarDays aria-hidden className={iconClass} />
              <input
                aria-label="Tanggal pulang, opsional"
                className={controlClass}
                min={values.depart || undefined}
                onChange={(event) => set("back")(event.target.value)}
                type="date"
                value={values.back}
              />
            </div>
          </FieldShell>
        ) : null}

        {tab === "hotels" ? (
          <FieldShell label="Check-out">
            <div className="relative">
              <CalendarDays aria-hidden className={iconClass} />
              <input
                aria-label="Tanggal check-out"
                className={controlClass}
                min={values.depart || undefined}
                onChange={(event) => set("checkout")(event.target.value)}
                type="date"
                value={values.checkout}
              />
            </div>
          </FieldShell>
        ) : null}

        {tab === "flights" ? (
          <FieldShell label="Penumpang & kelas">
            <div className="relative">
              <Users aria-hidden className={iconClass} />
              <select
                aria-label="Jumlah penumpang dan kelas kabin"
                className={`${controlClass} appearance-none truncate pr-7 text-[13.5px]`}
                onChange={(event) => set("cabin")(event.target.value)}
                value={values.cabin}
              >
                {cabinOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              />
            </div>
          </FieldShell>
        ) : null}

        {tab === "hotels" ? (
          <FieldShell label="Tamu & kamar">
            <div className="relative">
              <Users aria-hidden className={iconClass} />
              <select
                aria-label="Jumlah tamu dan kamar"
                className={`${controlClass} appearance-none truncate pr-7 text-[13.5px]`}
                onChange={(event) => set("guests")(event.target.value)}
                value={values.guests}
              >
                {guestOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              />
            </div>
          </FieldShell>
        ) : null}

        {tab === "umrah" ? (
          <FieldShell label="Bulan keberangkatan">
            <div className="relative">
              <CalendarDays aria-hidden className={iconClass} />
              <input
                aria-label="Bulan keberangkatan"
                className={controlClass}
                onChange={(event) => set("month")(event.target.value)}
                type="month"
                value={values.month}
              />
            </div>
          </FieldShell>
        ) : null}

        {tab === "trips" || tab === "activities" ? (
          <FieldShell label="Tanggal">
            <div className="relative">
              <CalendarDays aria-hidden className={iconClass} />
              <input
                aria-label="Tanggal perjalanan"
                className={controlClass}
                onChange={(event) => set("depart")(event.target.value)}
                type="date"
                value={values.depart}
              />
            </div>
          </FieldShell>
        ) : null}

        {tab === "cars" ? (
          <>
            <FieldShell label="Mulai">
              <div className="relative">
                <CalendarDays aria-hidden className={iconClass} />
                <input
                  aria-label="Tanggal mulai sewa"
                  className={controlClass}
                  onChange={(event) => set("checkin")(event.target.value)}
                  type="date"
                  value={values.checkin}
                />
              </div>
            </FieldShell>
            <FieldShell label="Selesai">
              <div className="relative">
                <CalendarDays aria-hidden className={iconClass} />
                <input
                  aria-label="Tanggal selesai sewa"
                  className={controlClass}
                  min={values.checkin || undefined}
                  onChange={(event) => set("checkout")(event.target.value)}
                  type="date"
                  value={values.checkout}
                />
              </div>
            </FieldShell>
          </>
        ) : null}

        {tab === "umrah" || tab === "trips" || tab === "activities" ? (
          <FieldShell label={tab === "umrah" ? "Jumlah jamaah" : "Peserta"}>
            <div className="relative">
              <Users aria-hidden className={iconClass} />
              <select
                aria-label={tab === "umrah" ? "Jumlah jamaah" : "Jumlah peserta"}
                className={`${controlClass} appearance-none truncate pr-7 text-[13.5px]`}
                onChange={(event) => set("jamaah")(event.target.value)}
                value={values.jamaah}
              >
                {["1 Jamaah", "2 Jamaah", "3 Jamaah", "4 Jamaah", "6 Jamaah"].map(
                  (option) => (
                    <option key={option}>{option}</option>
                  ),
                )}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              />
            </div>
          </FieldShell>
        ) : null}

        <button
          className="inline-flex h-[46px] items-center justify-center gap-2 self-end rounded-xl bg-sun px-6 text-[15px] font-bold text-white transition hover:bg-sun-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun"
          type="submit"
        >
          <Search aria-hidden className="h-4 w-4" />
          {submitLabel[tab]}
        </button>
      </div>

      <datalist id="bandara">
        {airportOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </form>
  );
}