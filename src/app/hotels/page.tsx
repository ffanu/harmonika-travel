import { CategoryCatalog, parseSearchDay, searchCategory } from "@/components/category-catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Booking hotel | Harmonika Travel",
  description: "Bandingkan hotel dan pesan kamar dengan harga server-side.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function HotelsPage({
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
  const result = await searchCategory(["HOTEL"], { q, date }).catch(() => ({
    items: [],
    notice: "",
  }));

  return (
    <CategoryCatalog
      basePath="/hotels"
      dateText={day?.label}
      eyebrow="Akomodasi"
      intro="Kamar dipilih berdasarkan tipe dan tanggal menginap. Harga final dihitung di server, bukan dari nilai yang dikirim browser."
      items={result.items}
      notice={result.notice}
      query={q}
      title="Booking hotel"
    />
  );
}
