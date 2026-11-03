import { CategoryCatalog, listCategory } from "@/components/category-catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Booking hotel | Harmonika Travel",
  description: "Bandingkan hotel dan pesan kamar dengan harga server-side.",
};

export default async function HotelsPage() {
  const items = await listCategory(["HOTEL"]).catch(() => []);
  return (
    <CategoryCatalog
      eyebrow="Akomodasi"
      title="Booking hotel"
      intro="Kamar dipilih berdasarkan tipe dan tanggal menginap. Harga final dihitung di server, bukan dari nilai yang dikirim browser."
      items={items}
    />
  );
}