import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PromosPage() {
  const now = new Date();
  let items;
  try {
    items = await db.promo.findMany({
      where: { active: true, startsAt: { lte: now }, endsAt: { gt: now } },
      orderBy: [{ endsAt: "asc" }, { id: "asc" }],
      take: 50,
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        discountIdr: true,
        minimumTotalIdr: true,
        endsAt: true,
      },
    });
  } catch {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <a href="/">Harmonika Travel</a>
        <h1 className="my-8 text-3xl font-bold">Promo perjalanan</h1>
        <p role="alert">Promo belum dapat dimuat. Silakan coba lagi nanti.</p>
      </main>
    );
  }
  const money = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-10">
      <a href="/" className="font-bold text-sky-800">
        Harmonika Travel
      </a>
      <h1 className="my-8 text-3xl font-bold">Promo perjalanan</h1>
      <p className="mb-6 text-slate-600">
        Gunakan kode saat membuat pesanan demo. Syarat dan masa berlaku
        diperiksa kembali oleh server.
      </p>
      {items.length === 0 ? (
        <p>Belum ada promo aktif.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-300 p-5"
            >
              <h2 className="text-xl font-bold">{item.title}</h2>
              <p className="mt-3 whitespace-pre-wrap">{item.description}</p>
              <p className="mt-4">Potongan {money(item.discountIdr)}</p>
              <p>Minimum transaksi {money(item.minimumTotalIdr)}</p>
              <p className="mt-3">
                Kode: <strong className="break-all">{item.code}</strong>
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Berlaku sampai{" "}
                {item.endsAt.toLocaleString("id-ID", {
                  timeZone: "Asia/Jakarta",
                })}{" "}
                WIB
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
