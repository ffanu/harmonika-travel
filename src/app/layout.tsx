import type { Metadata } from "next";
import "./globals.css";

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
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
