"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { promoSlides } from "@/lib/home-content";

const GAP = 16;

export function PromoCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(3);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const width = track.clientWidth;
      setPerView(width >= 1024 ? 3 : width >= 640 ? 2 : 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const steps = Math.max(1, promoSlides.length - perView + 1);

  function goTo(target: number) {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>("[data-card]");
    if (!track || !card) return;
    const clamped = Math.max(0, Math.min(target, steps - 1));
    track.scrollTo({ left: clamped * (card.offsetWidth + GAP), behavior: "smooth" });
  }

  function handleScroll() {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>("[data-card]");
    if (!track || !card) return;
    setIndex(Math.round(track.scrollLeft / (card.offsetWidth + GAP)));
  }

  return (
    <section aria-label="Promo dan paket pilihan" className="bg-white">
      <div className="relative mx-auto max-w-[1240px] px-5 pb-10">
        <div
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
          onScroll={handleScroll}
          ref={trackRef}
        >
          {promoSlides.map((slide) => (
            <article
              className="relative h-[212px] shrink-0 basis-full snap-start overflow-hidden rounded-2xl bg-ink sm:basis-[calc(50%-8px)] lg:basis-[calc(33.333%-11px)]"
              data-card
              key={slide.id}
            >
              <img
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover"
                height={512}
                loading="lazy"
                src={slide.image}
                width={512}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-[#061a41]/95 via-[#061a41]/70 to-[#061a41]/10"
              />
              <div className="relative flex h-full flex-col justify-center gap-2 p-5">
                <h3 className="text-[18px] font-extrabold leading-tight text-white">
                  {slide.title}
                </h3>
                {slide.highlight ? (
                  <div className="mt-0.5">
                    <span className="block text-[11.5px] font-medium leading-none text-white/80">
                      {slide.highlightLabel}
                    </span>
                    <span className="mt-1 block text-[26px] font-extrabold leading-none text-amber-300">
                      {slide.highlight}
                    </span>
                  </div>
                ) : null}
                <p className="line-clamp-2 max-w-[235px] text-[12.5px] leading-snug text-white/85">
                  {slide.description}
                </p>
                <a
                  className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-ink transition hover:bg-brand-soft"
                  href={slide.href}
                >
                  {slide.cta}
                  <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>

        <button
          aria-label="Promo sebelumnya"
          className="absolute -left-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-hairline bg-white text-ink shadow-md transition hover:bg-mist disabled:opacity-40 lg:inline-flex"
          disabled={index <= 0}
          onClick={() => goTo(index - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden className="h-5 w-5" />
        </button>
        <button
          aria-label="Promo berikutnya"
          className="absolute -right-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-hairline bg-white text-ink shadow-md transition hover:bg-mist disabled:opacity-40 lg:inline-flex"
          disabled={index >= steps - 1}
          onClick={() => goTo(index + 1)}
          type="button"
        >
          <ChevronRight aria-hidden className="h-5 w-5" />
        </button>

        {steps > 1 ? (
          <div className="mt-3 flex items-center justify-center gap-2">
            {Array.from({ length: steps }, (_, position) => (
              <button
                aria-label={`Ke promo ${position + 1}`}
                aria-current={index === position}
                className={`h-2 rounded-full transition-all ${
                  index === position
                    ? "w-5 bg-brand"
                    : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
                key={position}
                onClick={() => goTo(position)}
                type="button"
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}