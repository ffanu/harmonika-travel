import { CategoryCatalog, listCategory } from "@/components/category-catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tiket pesawat | Harmonika Travel",
  description: "Cari tiket pesawat dengan jadwal dan harga yang dihitung di server.",
};

export default async function FlightsPage() {
  const items = await listCategory(["FLIGHT"]).catch(() => []);
  return (
    <CategoryCatalog
      eyebrow="Penerbangan"
      title="Tiket pesawat"
      intro="Pilih rute, tanggal, dan jumlah penumpang. Ketersediaan kursi diperiksa ulang secara transaksional saat pemesanan."
      items={items}
    />
  );
}