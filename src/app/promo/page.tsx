import { redirect } from "next/navigation";

/** `/promo` is the short alias used in the brand structure; `/promos` is canonical. */
export default function PromoAliasPage() {
  redirect("/promos");
}