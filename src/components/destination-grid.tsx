import { ArrowRight, MapPin } from "lucide-react";
import { popularDestinations } from "@/lib/home-content";

export function DestinationGrid() {
  return (
    <section aria-labelledby="destinasi-populer" className="bg-white">
      <div className="mx-auto max-w-[1240px] px-5 pb-14 pt-2">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-[3px] w-8 rounded-full bg-brand" />
              <h2
                className="text-[26px] font-extrabold tracking-tight text-ink"
                id="destinasi-populer"
              >
                Destinasi Populer
              </h2>
            </div>
            <p className="mt-2 text-[13.5px] text-slate-500">
              Temukan berbagai destinasi favorit untuk perjalanan liburan,
              bisnis, maupun ibadah.
            </p>
          </div>
          <a
            className="inline-flex min-h-9 items-center gap-2 text-[13.5px] font-semibold text-brand hover:text-brand-dark"
            href="/trips"
          >
            Lihat Semua Destinasi
            <ArrowRight aria-hidden className="h-4 w-4" />
          </a>
        </div>

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {popularDestinations.map((destination) => (
            <li key={destination.slug}>
              <a
                className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                href={destination.href}
              >
                                <img
                  alt={`Destinasi ${destination.city}, ${destination.country}`}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  height={384}
                  loading="lazy"
                  src={destination.image}
                  width={512}
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-[#04163a]/85 via-[#04163a]/20 to-transparent"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#04163a]/90 to-transparent px-3 pb-3 pt-6 text-white">
                  <span className="flex items-center gap-1.5 text-[15px] font-bold leading-tight">
                    <MapPin aria-hidden className="h-3.5 w-3.5" />
                    {destination.city}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-white/85">
                    {destination.country}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}