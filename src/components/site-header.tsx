"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CircleHelp, Heart, Menu, UserRound, X } from "lucide-react";
import { BrandLogo, BrandWordmark } from "./brand-logo";
import { primaryNav } from "@/lib/home-content";

const iconMap = { heart: Heart, user: UserRound, help: CircleHelp } as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[74px] max-w-[1240px] items-center gap-4 px-5">
        <Link className="flex items-center gap-3" href="/">
          <BrandLogo className="h-9 w-10 shrink-0" title="Harmonika Travel" />
          <BrandWordmark />
        </Link>

        <nav aria-label="Navigasi utama" className="ml-auto hidden items-center gap-1 lg:flex">
          {primaryNav.map((item) => {
            const Icon = item.icon ? iconMap[item.icon] : null;
            const active = isActive(item.href);
            const className = `inline-flex min-h-9 items-center gap-2 rounded-lg px-3.5 py-2 text-[14.5px] transition-colors ${
              active
                ? "bg-brand-soft font-semibold text-brand"
                : "font-medium text-slate-700 hover:bg-mist hover:text-brand"
            }`;
            return item.external ? (
              <a
                key={item.label}
                className={className}
                href={item.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {Icon ? <Icon aria-hidden className="h-4 w-4" /> : null}
                {item.label}
              </a>
            ) : (
              <Link key={item.label} className={className} href={item.href}>
                {Icon ? <Icon aria-hidden className="h-4 w-4" /> : null}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-4">
          <Link
            className="hidden min-h-10 items-center rounded-lg border border-brand/35 px-5 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft sm:inline-flex"
            href="/login"
          >
            Masuk
          </Link>
          <Link
            className="inline-flex min-h-10 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            href="/login?mode=register"
          >
            Daftar
          </Link>
          <button
            aria-controls="navigasi-seluler"
            aria-expanded={open}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-hairline text-ink lg:hidden"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? (
              <X aria-hidden className="h-5 w-5" />
            ) : (
              <Menu aria-hidden className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="border-t border-hairline bg-white px-5 pb-4 pt-2 lg:hidden"
          id="navigasi-seluler"
        >
          <nav aria-label="Navigasi seluler" className="flex flex-col">
            {primaryNav.map((item) => {
              const Icon = item.icon ? iconMap[item.icon] : null;
              const className = `inline-flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] ${
                isActive(item.href)
                  ? "bg-brand-soft font-semibold text-brand"
                  : "font-medium text-slate-700"
              }`;
              return item.external ? (
                <a
                  className={className}
                  href={item.href}
                  key={item.label}
                  onClick={closeMenu}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {Icon ? <Icon aria-hidden className="h-4 w-4" /> : null}
                  {item.label}
                </a>
              ) : (
                <Link
                  className={className}
                  href={item.href}
                  key={item.label}
                  onClick={closeMenu}
                >
                  {Icon ? <Icon aria-hidden className="h-4 w-4" /> : null}
                  {item.label}
                </Link>
              );
            })}
            <Link
              className="mt-1 inline-flex min-h-11 items-center px-3 text-[15px] font-semibold text-brand sm:hidden"
              href="/login"
              onClick={closeMenu}
            >
              Masuk
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}