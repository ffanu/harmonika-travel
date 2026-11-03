import { MessageCircle, Plane } from "lucide-react";
import { BrandLogo, BrandWordmark } from "./brand-logo";
import { supportWhatsApp, supportWhatsAppLabel } from "@/lib/home-content";

const columns = [
  {
    title: "Layanan",
    links: [
      { label: "Tiket Pesawat", href: "/flights" },
      { label: "Hotel", href: "/hotels" },
      { label: "Paket Wisata", href: "/trips" },
      { label: "Promo", href: "/promos" },
      { label: "Aktivitas", href: "/trips" },
    ],
  },
  {
    title: "Harmonika",
    links: [
      { label: "Kemitraan", href: "/partnership" },
      { label: "Blog Perjalanan", href: "/blog" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Pesanan Saya", href: "/bookings" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#061a41] text-white/80">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <BrandLogo className="h-9 w-10 shrink-0" />
            <BrandWordmark tone="light" />
          </div>
          <p className="mt-4 max-w-[290px] text-[13px] leading-relaxed text-white/70">
            Tiket pesawat, hotel, paket wisata, hingga Umrah dan Haji dalam satu
            tempat. Perjalanan nyaman, aman, dan penuh makna.
          </p>
        </div>

        {columns.map((column) => (
          <nav aria-label={column.title} key={column.title}>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-white">
              {column.title}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={`${column.title}-${link.label}`}>
                  <a
                    className="text-[13px] text-white/75 transition hover:text-white"
                    href={link.href}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-white">
            Bantuan
          </h2>
          <p className="mt-4 text-[13px] leading-relaxed text-white/75">
            Tim kami siap membantu setiap hari, 24 jam.
          </p>
          <a
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-white/10 px-4 text-[13px] font-semibold text-white transition hover:bg-white/20"
            href={supportWhatsApp}
            rel="noopener noreferrer"
            target="_blank"
          >
            <MessageCircle aria-hidden className="h-4 w-4" />
            WhatsApp {supportWhatsAppLabel}
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-5 text-[12px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Harmonika Travel. Semua hak dilindungi.</p>
          <p className="flex items-center gap-1.5">
            <Plane aria-hidden className="h-3.5 w-3.5" />
            Katalog saat ini berisi data demo; pemesanan belum menerbitkan tiket
            atau menerima pembayaran.
          </p>
        </div>
      </div>
    </footer>
  );
}