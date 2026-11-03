/**
 * Konten statis beranda. Dipisah dari komponen agar teks, tautan, dan aset
 * mudah ditinjau tanpa menyentuh markup.
 */

export const supportWhatsApp = "https://wa.me/6285771378237";
export const supportWhatsAppLabel = "0857-7137-8237";

export type NavIcon = "heart" | "user" | "help";

export type NavLink = {
  label: string;
  href: string;
  icon?: NavIcon;
  external?: boolean;
};

export const primaryNav: NavLink[] = [
  { label: "Beranda", href: "/" },
  { label: "Promo", href: "/promos" },
  { label: "Pesanan Saya", href: "/bookings" },
  { label: "Wishlist", href: "/wishlist", icon: "heart" },
  { label: "Kemitraan", href: "/partnership", icon: "user" },
  { label: "Bantuan", href: supportWhatsApp, icon: "help", external: true },
];

export type TrustIcon =
  | "shield"
  | "price"
  | "support"
  | "payment"
  | "partner";

export const trustPoints: { icon: TrustIcon; title: string; note: string }[] = [
  { icon: "shield", title: "Aman & Terpercaya", note: "Transaksi terlindungi" },
  { icon: "price", title: "Harga Kompetitif", note: "Promo menarik setiap hari" },
  { icon: "support", title: "Layanan 24/7", note: "Bantuan kapan saja" },
  {
    icon: "payment",
    title: "Pembayaran Fleksibel",
    note: "Beragam metode pembayaran",
  },
  { icon: "partner", title: "Partner Resmi", note: "Maskapai & hotel terpercaya" },
];

export type PromoCard = {
  id: string;
  title: string;
  highlightLabel?: string;
  highlight?: string;
  description: string;
  image: string;
  href: string;
  cta: string;
};

export const promoSlides: PromoCard[] = [
  {
    id: "flight",
    title: "Promo Tiket Pesawat",
    highlightLabel: "Diskon hingga",
    highlight: "12%",
    description: "Terbang lebih hemat ke destinasi favoritmu.",
    image: "/images/promo-flight.webp",
    href: "/flights",
    cta: "Lihat Promo",
  },
  {
    id: "umrah",
    title: "Paket Umrah Bersama Harmonika",
    description:
      "Jadwal fleksibel, pembimbing berpengalaman, dan layanan lengkap.",
    image: "/images/promo-umrah.webp",
    href: "/trips",
    cta: "Lihat Paket",
  },
  {
    id: "tour",
    title: "Paket Wisata Domestik & Internasional",
    description: "Jelajahi destinasi terbaik dengan harga hemat.",
    image: "/images/promo-beach.webp",
    href: "/trips",
    cta: "Lihat Destinasi",
  },
];

export type DestinationCard = {
  slug: string;
  city: string;
  country: string;
  image: string;
  href: string;
};

export const popularDestinations: DestinationCard[] = [
  {
    slug: "mekkah",
    city: "Mekkah",
    country: "Arab Saudi",
    image: "/images/dest-makkah.webp",
    href: "/flights?q=Mekkah",
  },
  {
    slug: "madinah",
    city: "Madinah",
    country: "Arab Saudi",
    image: "/images/dest-madinah.webp",
    href: "/flights?q=Madinah",
  },
  {
    slug: "bali",
    city: "Bali",
    country: "Indonesia",
    image: "/images/dest-bali.webp",
    href: "/trips?q=Bali",
  },
  {
    slug: "labuan-bajo",
    city: "Labuan Bajo",
    country: "Indonesia",
    image: "/images/dest-labuanbajo.webp",
    href: "/trips?q=Labuan%20Bajo",
  },
  {
    slug: "tokyo",
    city: "Tokyo",
    country: "Jepang",
    image: "/images/dest-tokyo.webp",
    href: "/trips?q=Tokyo",
  },
];

/** Pilihan bandara untuk datalist; pengguna tetap boleh menulis kota lain. */
export const airportOptions = [
  "Jakarta (CGK)",
  "Surabaya (SUB)",
  "Denpasar (DPS)",
  "Medan (KNO)",
  "Makassar (UPG)",
  "Madinah (MED)",
  "Jeddah (JED)",
  "Mekkah (JED)",
  "Kuala Lumpur (KUL)",
  "Singapura (SIN)",
  "Tokyo (NRT)",
];

export const cabinOptions = [
  "1 Dewasa · Ekonomi",
  "2 Dewasa · Ekonomi",
  "3 Dewasa · Ekonomi",
  "4 Dewasa · Ekonomi",
  "1 Dewasa · Bisnis",
  "2 Dewasa · Bisnis",
];

export const guestOptions = [
  "1 Tamu, 1 Kamar",
  "2 Tamu, 1 Kamar",
  "3 Tamu, 2 Kamar",
  "4 Tamu, 2 Kamar",
];

/**
 * Foto destinasi dipakai sebagai gambar kartu produk bila `Product.imageUrl`
 * belum diisi. Pencocokan dilakukan pada nama kota/destinasi.
 */
export function imageForDestination(city: string | null | undefined): string {
  const value = (city ?? "").toLowerCase();
  if (value.includes("mekkah") || value.includes("makkah")) return "/images/dest-makkah.webp";
  if (value.includes("madinah") || value.includes("medina")) return "/images/dest-madinah.webp";
  if (value.includes("bali") || value.includes("denpasar") || value.includes("ubud")) return "/images/dest-bali.webp";
  if (value.includes("labuan") || value.includes("komodo")) return "/images/dest-labuanbajo.webp";
  if (value.includes("tokyo") || value.includes("jepang") || value.includes("japan")) return "/images/dest-tokyo.webp";
  if (value.includes("jakarta")) return "/images/dest-jakarta.webp";
  if (value.includes("singapur") || value.includes("singapore")) return "/images/dest-singapore.webp";
  return "";
}

/**
 * Gambar kartu produk: utamakan foto destinasi yang cocok, lalu gambar
 * kategori agar hotel tidak tampil dengan foto pantai.
 */
export function imageForProduct(
  category: string,
  locationOrDestination: string | null | undefined,
): string {
  // Kategori dengan foto khas sendiri didahulukan agar hotel tidak tampil
  // sebagai pantai dan transfer tidak tampil sebagai gedung kota.
  switch (category) {
    case "HOTEL":
      return "/images/cat-hotel-room.webp";
    case "AIRPORT_TRANSFER":
    case "CAR_RENTAL":
      return "/images/cat-transfer.webp";
    case "FLIGHT":
      return "/images/promo-flight.webp";
    case "CRUISE":
      return "/images/promo-beach.webp";
    default:
      return imageForDestination(locationOrDestination) || "/images/promo-beach.webp";
  }
}
