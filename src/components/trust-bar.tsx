import {
  BadgeCheck,
  BadgePercent,
  CreditCard,
  Headset,
  ShieldCheck,
} from "lucide-react";
import { trustPoints, type TrustIcon } from "@/lib/home-content";

const iconMap: Record<TrustIcon, typeof ShieldCheck> = {
  shield: ShieldCheck,
  price: BadgePercent,
  support: Headset,
  payment: CreditCard,
  partner: BadgeCheck,
};

export function TrustBar() {
  return (
    <ul className="mx-auto grid max-w-[1240px] grid-cols-2 gap-x-3 gap-y-5 px-5 py-8 sm:gap-x-4 sm:grid-cols-3 lg:grid-cols-5">
      {trustPoints.map(({ icon, title, note }) => {
        const Icon = iconMap[icon];
        return (
          <li className="flex items-center gap-3" key={title}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Icon aria-hidden className="h-[19px] w-[19px]" strokeWidth={1.9} />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold leading-snug text-ink sm:text-[13.5px]">
                {title}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-slate-500 sm:text-[11.5px]">
                {note}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}