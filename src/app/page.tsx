import { Plane } from "lucide-react";
import { DestinationGrid } from "@/components/destination-grid";
import { ProductRail } from "@/components/product-rail";
import { PromoCarousel } from "@/components/promo-carousel";
import { SearchWidget } from "@/components/search-widget";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrustBar } from "@/components/trust-bar";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        href="#main"
      >
        Lewati ke konten
      </a>

      <SiteHeader />

      <main id="main">
        <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
                    <img
            alt="Suasana Masjidil Haram di Mekkah saat senja"
            className="absolute inset-0 h-full w-full object-cover object-[62%_38%] sm:object-center"
            height={1024}
            src="/images/hero-mecca.webp"
            width={1024}
          />
          <div aria-hidden className="hero-shade absolute inset-0" />

          <div className="relative mx-auto max-w-[1240px] px-5 pb-40 pt-12 sm:pt-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-4 py-1.5 text-[12.5px] font-medium text-white backdrop-blur-sm">
              <Plane aria-hidden className="h-3.5 w-3.5" />
              Harmoni Perjalanan Anda
            </span>
            <h1
              className="mt-5 max-w-[680px] text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[46px] lg:text-[52px]"
              id="hero-title"
            >
              Perjalanan Nyaman,
              <br className="hidden sm:block" /> Aman, dan Penuh Makna
            </h1>
            <p className="mt-4 max-w-[480px] text-[14.5px] leading-relaxed text-white/85 sm:text-[15.5px]">
              Pesan tiket pesawat, hotel, paket wisata, hingga Umrah &amp; Haji
              dengan mudah di Harmonika Travel.
            </p>
          </div>
        </section>

        <div className="relative z-10 mx-auto -mt-30 max-w-[1180px] px-5 pb-6">
          <SearchWidget />
        </div>

        <TrustBar />
        <PromoCarousel />
        <DestinationGrid />
        <ProductRail />
      </main>

      <SiteFooter />
    </div>
  );
}
