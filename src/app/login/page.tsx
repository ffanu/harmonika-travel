import { BrandLogo, BrandWordmark } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Masuk atau daftar | Harmonika Travel",
  description: "Masuk ke akun Harmonika Travel untuk melihat pesanan dan wishlist.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const mode = typeof params.mode === "string" ? params.mode : "";

  return (
    <div className="flex min-h-screen flex-col bg-mist text-ink">
      <header className="border-b border-hairline bg-white">
        <div className="mx-auto flex h-[74px] max-w-[1240px] items-center px-5">
          <a className="flex items-center gap-3" href="/">
            <BrandLogo className="h-9 w-10 shrink-0" title="Harmonika Travel" />
            <BrandWordmark />
          </a>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <LoginForm initialRegister={mode === "register"} />
      </main>

      <SiteFooter />
    </div>
  );
}
