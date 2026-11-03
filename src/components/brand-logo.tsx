type LogoProps = { className?: string; title?: string };

/**
 * Logo Harmonika Travel: huruf "H" miring warna biru brand dengan pita oranye
 * yang menyapu dari kiri bawah ke kanan atas. Digambar sebagai SVG agar tajam
 * di segala ukuran dan tidak menambah permintaan jaringan.
 */
export function BrandLogo({ className = "h-9 w-10", title }: LogoProps) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      className={className}
      fill="none"
      role={title ? "img" : undefined}
      viewBox="0 0 44 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      {/* pita oranye di belakang huruf */}
      <path
        d="M3 33.6C14.4 34.9 27.8 27.6 41.4 10.4"
        stroke="#f2711c"
        strokeLinecap="round"
        strokeWidth="5.4"
      />
      {/* kaki kiri */}
      <path d="M7.4 4h7.3l-3.1 32H4.3l3.1-32Z" fill="#1c5ae0" />
      {/* kaki kanan */}
      <path d="M29.3 4h7.3l-3.1 32h-7.3l3.1-32Z" fill="#1c5ae0" />
      {/* palang tengah */}
      <path d="M13.4 16.4h15.2l-.7 7.2H12.7l.7-7.2Z" fill="#1c5ae0" />
    </svg>
  );
}

export function BrandWordmark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <span className="flex min-w-0 flex-col leading-none">
      <span
        className={`text-[16.5px] font-extrabold leading-tight tracking-tight sm:text-[19px] ${
          light ? "text-white" : "text-ink"
        }`}
      >
        Harmonika Travel
      </span>
      <span
        className={`mt-[5px] hidden text-[9.5px] font-semibold uppercase leading-none tracking-[0.14em] sm:block ${
          light ? "text-white/60" : "text-slate-500"
        }`}
      >
        Travel • Ticketing • Umrah • Hotel • Tour
      </span>
    </span>
  );
}