import { CategoryCatalog, parseSearchDay, searchCategory } from "@/components/category-catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Paket perjalanan | Harmonika Travel",
  description: "Paket aktivitas, antar jemput, rental mobil, dan kapal pesiar.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TripsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const read = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };

  const q = read("q");
  const date = read("date");
  const day = parseSearchDay(date);
  const result = await searchCategory(
    ["ACTIVITY", "AIRPORT_TRANSFER", "CAR_RENTAL", "CRUISE"],
    { q, date },
  ).catch(() => ({ items: [], notice: "" }));

  return (
    <CategoryCatalog
      basePath="/trips"
      dateText={day?.label}
      eyebrow="Paket perjalanan"
      intro="Lengkapi perjalanan dengan tur, antar jemput bandara, sewa mobil, atau pelayaran. Semua jadwal mengikuti ketersediaan yang tersimpan di basis data."
      items={result.items}
      notice={result.notice}
      query={q}
      title="Aktivitas, transfer, rental, dan cruise"
    />
  );
}
