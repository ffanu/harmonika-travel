import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

/**
 * Travelpayouts Drive (program afiliasi, partner ID 595040).
 *
 * Kode dari dasbor Travelpayouts sengaja dipasang apa adanya sebagai inline
 * script di <head> root layout: Next.js menyuntikkannya ke HTML awal sehingga
 * berlaku di setiap halaman dan sempat berjalan sebelum pengguna mengklik
 * tautan afiliasi. `data-cmp-ab` dan `data-cfasync` dipertahankan agar Cloudflare
 * Rocket Loader tidak menunda eksekusinya.
 */
const TRAVELPAYOUTS_DRIVE_ID = "595040";

export const metadata: Metadata = {
  title: "Harmonika Travel — Tiket Pesawat, Hotel, Umrah & Paket Wisata",
  description:
    "Pesan tiket pesawat, hotel, paket wisata, hingga Umrah dan Haji dengan mudah di Harmonika Travel.",
  applicationName: "Harmonika Travel",
  openGraph: {
    title: "Harmonika Travel",
    description:
      "Perjalanan nyaman, aman, dan penuh makna. Tiket pesawat, hotel, Umrah & Haji, paket wisata, sewa mobil, dan aktivitas.",
    siteName: "Harmonika Travel",
    locale: "id_ID",
    type: "website",
  },
};

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Font dimuat lewat <link> agar build tidak bergantung pada jaringan; bila gagal, font sistem dipakai. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
        <Script
          data-cfasync="false"
          data-cmp-ab="2"
          id="travelpayouts-drive"
          strategy="beforeInteractive"
        >
          {`(function () {
  // Next.js menjalankan inline script ini dari antrean awal dan sekali lagi
  // saat hidrasi; penjaga di bawah memastikan berkas Travelpayouts hanya
  // dimuat sekali per halaman.
  if (window.__harmonikaTpDrive) return;
  window.__harmonikaTpDrive = true;
  var script = document.createElement("script");
  script.async = 1;
  script.setAttribute("data-cmp-ab", "2");
  script.src = "https://emrldtp.com/NTk1MDQw.js?t=${TRAVELPAYOUTS_DRIVE_ID}";
  document.head.appendChild(script);
})();`}
        </Script>
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
