import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Harmonika Travel — Rencanakan Perjalananmu",
  description:
    "Jelajahi hotel, transportasi, dan aktivitas bersama Harmonika Travel.",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
