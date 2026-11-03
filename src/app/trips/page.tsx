import { CategoryCatalog, listCategory } from "@/components/category-catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Paket perjalanan | Harmonika Travel",
  description: "Paket aktivitas, antar jemput, rental mobil, dan kapal pesiar.",
};

export default async function TripsPage() {
  const items = await listCategory([
    "ACTIVITY",
    "AIRPORT_TRANSFER",
    "CAR_RENTAL",
    "CRUISE",
  ]).catch(() => []);
  return (
    <CategoryCatalog
      eyebrow="Paket perjalanan"
      title="Aktivitas, transfer, rental, dan cruise"
      intro="Lengkapi perjalanan dengan tur, antar jemput bandara, sewa mobil, atau pelayaran. Semua jadwal mengikuti ketersediaan yang tersimpan di basis data."
      items={items}
    />
  );
}