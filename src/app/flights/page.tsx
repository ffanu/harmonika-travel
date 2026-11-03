import { CategoryCatalog, parseSearchDay, searchCategory } from "@/components/category-catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tiket pesawat | Harmonika Travel",
  description:
    "Cari tiket pesawat dengan jadwal dan harga yang dihitung di server.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FlightsPage({
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
  const result = await searchCategory(["FLIGHT"], { q, date }).catch(() => ({
    items: [],
    notice: "",
  }));

  return (
    <CategoryCatalog
      basePath="/flights"
      dateText={day?.label}
      eyebrow="Penerbangan"
      intro="Pilih rute, tanggal, dan jumlah penumpang. Ketersediaan kursi diperiksa ulang secara transaksional saat pemesanan."
      items={result.items}
      notice={result.notice}
      query={q}
      title="Tiket pesawat"
    />
  );
}
