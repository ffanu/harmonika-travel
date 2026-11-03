/**
 * Data katalog demo yang dipakai bersama oleh seed penuh dan seed katalog.
 * Semua entri ditandai isDemo oleh pemanggil; tidak ada data pelanggan di sini.
 */

export const destinations = [
  { slug: "bali", name: "Bali", country: "Indonesia", description: "Pulau dewata dengan pantai, sawah terasering, dan budaya yang kaya." },
  { slug: "jakarta", name: "Jakarta", country: "Indonesia", description: "Ibu kota dengan pusat bisnis, kuliner, dan wisata kota." },
  { slug: "yogyakarta", name: "Yogyakarta", country: "Indonesia", description: "Kota budaya dengan candi, keraton, dan seni tradisional." },
  { slug: "labuan-bajo", name: "Labuan Bajo", country: "Indonesia", description: "Gerbang menuju Komodo dengan panorama laut dan perbukitan." },
  { slug: "singapore", name: "Singapura", country: "Singapura", description: "Kota-negara modern dengan taman tematik dan pusat belanja." },
  { slug: "tokyo", name: "Tokyo", country: "Jepang", description: "Metropolis dengan transportasi rapi, kuliner, dan budaya pop." },
  { slug: "mekkah", name: "Mekkah", country: "Arab Saudi", description: "Kota suci dengan Masjidil Haram dan Ka'bah sebagai pusat ibadah umrah dan haji." },
  { slug: "madinah", name: "Madinah", country: "Arab Saudi", description: "Kota Nabi dengan Masjid Nabawi, pusat ziarah dan ibadah jamaah Indonesia." },
];

export const catalog = [
  { slug: "hotel-bali-pantai-nusa-dua", name: "Harmonika Resort Nusa Dua", category: "HOTEL", destination: "bali", location: "Nusa Dua, Bali", description: "Resor tepi pantai dengan kolam renang dan sarapan untuk dua orang.", variants: [{ name: "Deluxe Garden View", price: 1250000 }, { name: "Premier Ocean View", price: 1850000 }] },
  { slug: "hotel-jakarta-pusat", name: "Harmonika City Hotel Jakarta", category: "HOTEL", destination: "jakarta", location: "Sudirman, Jakarta", description: "Hotel bisnis dekat stasiun MRT dengan ruang kerja dan gym.", variants: [{ name: "Superior Room", price: 780000 }, { name: "Executive Room", price: 1150000 }] },
  { slug: "flight-cgk-dps", name: "Penerbangan Jakarta - Denpasar", category: "FLIGHT", destination: "bali", location: "CGK ke DPS", description: "Penerbangan langsung kelas ekonomi dengan bagasi kabin 7 kg.", variants: [{ name: "Ekonomi Reguler", price: 890000 }, { name: "Ekonomi Fleksibel", price: 1340000 }] },
  { slug: "flight-cgk-sin", name: "Penerbangan Jakarta - Singapura", category: "FLIGHT", destination: "singapore", location: "CGK ke SIN", description: "Penerbangan internasional langsung, bagasi 20 kg termasuk.", variants: [{ name: "Ekonomi Reguler", price: 1450000 }, { name: "Ekonomi Plus", price: 2100000 }] },
  { slug: "transfer-cgk-hotel", name: "Airport Transfer Soekarno-Hatta", category: "AIRPORT_TRANSFER", destination: "jakarta", location: "CGK ke Jakarta Pusat", description: "Antar jemput bandara dengan mobil berpendingin dan pengemudi.", variants: [{ name: "Sedan (1-3 orang)", price: 250000 }, { name: "MPV (1-5 orang)", price: 400000 }] },
  { slug: "car-rental-bali", name: "Sewa Mobil Bali Lepas Kunci", category: "CAR_RENTAL", destination: "bali", location: "Denpasar, Bali", description: "Sewa mobil harian lepas kunci, termasuk asuransi dasar.", variants: [{ name: "City Car 1 hari", price: 320000 }, { name: "SUV 1 hari", price: 560000 }] },
  { slug: "activity-ubud-sawah", name: "Tur Sawah Terasering Ubud", category: "ACTIVITY", destination: "bali", location: "Ubud, Bali", description: "Tur setengah hari ke Tegallalang dengan pemandu lokal.", variants: [{ name: "Tur Reguler", price: 375000 }, { name: "Tur Privat", price: 690000 }] },
  { slug: "activity-komodo-sailing", name: "Sailing Komodo 1 Hari", category: "ACTIVITY", destination: "labuan-bajo", location: "Labuan Bajo, NTT", description: "Pelayaran sehari ke Padar dan Pink Beach dengan makan siang.", variants: [{ name: "Open Trip", price: 1150000 }, { name: "Private Charter", price: 4200000 }] },
  { slug: "cruise-singapore-strait", name: "Cruise Selat Singapura 3 Hari", category: "CRUISE", destination: "singapore", location: "Singapura", description: "Pelayaran tiga hari dua malam dengan kabin interior dan makan penuh.", variants: [{ name: "Interior Cabin", price: 3850000 }, { name: "Balcony Cabin", price: 5600000 }] },
  { slug: "cruise-tokyo-bay", name: "Cruise Teluk Tokyo 5 Hari", category: "CRUISE", destination: "tokyo", location: "Tokyo, Jepang", description: "Lima hari empat malam menyusuri teluk dengan tur kota singkat.", variants: [{ name: "Ocean View", price: 7200000 }] },
  { slug: "flight-cgk-med", name: "Penerbangan Jakarta - Madinah", category: "FLIGHT", destination: "madinah", location: "CGK ke MED", description: "Penerbangan langsung menuju Madinah dengan bagasi 30 kg dan makan di pesawat.", variants: [{ name: "Ekonomi Reguler", price: 12500000 }, { name: "Ekonomi Fleksibel", price: 15900000 }] },
  { slug: "flight-cgk-jed", name: "Penerbangan Jakarta - Jeddah", category: "FLIGHT", destination: "mekkah", location: "CGK ke JED", description: "Rute menuju Jeddah untuk jamaah umrah, termasuk bagasi 30 kg.", variants: [{ name: "Ekonomi Reguler", price: 11800000 }, { name: "Ekonomi Plus", price: 14600000 }] },
  { slug: "hotel-mekkah-haram-view", name: "Harmonika Hotel Haram View Mekkah", category: "HOTEL", destination: "mekkah", location: "Makkah, Arab Saudi", description: "Hotel berjarak jalan kaki ke Masjidil Haram dengan sarapan dan antar jemput bandara.", variants: [{ name: "Double Room", price: 2150000 }, { name: "Triple Room", price: 3100000 }] },
  { slug: "hotel-madinah-nabawi", name: "Harmonika Hotel Nabawi Madinah", category: "HOTEL", destination: "madinah", location: "Madinah, Arab Saudi", description: "Akomodasi dekat Masjid Nabawi dengan kamar keluarga dan sarapan halal.", variants: [{ name: "Double Room", price: 1650000 }, { name: "Family Room", price: 2400000 }] },
  { slug: "umrah-paket-9-hari", name: "Paket Umrah 9 Hari Harmonika", category: "ACTIVITY", destination: "mekkah", location: "Makkah & Madinah", description: "Paket umrah sembilan hari: tiket, hotel, visa, transportasi, dan pembimbing ibadah.", variants: [{ name: "Kamar Quad", price: 32500000 }, { name: "Kamar Double", price: 41000000 }] },
  { slug: "activity-ziarah-madinah", name: "Ziarah Kota Madinah", category: "ACTIVITY", destination: "madinah", location: "Madinah", description: "Ziarah setengah hari ke Masjid Quba, Jabal Uhud, dan lokasi bersejarah Madinah.", variants: [{ name: "Reguler", price: 850000 }, { name: "Privat", price: 1450000 }] },
];
