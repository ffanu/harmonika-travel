import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog perjalanan | Harmonika Travel",
  description: "Artikel panduan perjalanan dari Harmonika Travel.",
};

const published = (value: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(value);

export default async function BlogPage() {
  let posts: { id: string; slug: string; title: string; body: string; updatedAt: Date }[] = [];
  try {
    posts = await db.content.findMany({
      where: { published: true },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: 50,
      select: { id: true, slug: true, title: true, body: true, updatedAt: true },
    });
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <a href="/" className="font-bold text-sky-800">Harmonika Travel</a>
        <h1 className="my-8 text-3xl font-bold">Blog perjalanan</h1>
        <p role="alert">Artikel belum dapat dimuat. Silakan coba lagi nanti.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10">
      <nav className="mb-8 flex flex-wrap items-center gap-4 text-sm">
        <a href="/" className="font-bold text-sky-800">Harmonika Travel</a>
        <a href="/flights" className="text-slate-600 hover:text-sky-800">Pesawat</a>
        <a href="/hotels" className="text-slate-600 hover:text-sky-800">Hotel</a>
        <a href="/trips" className="text-slate-600 hover:text-sky-800">Paket</a>
        <a href="/promos" className="text-slate-600 hover:text-sky-800">Promo</a>
      </nav>
      <p className="text-xs font-semibold uppercase tracking-widest text-sky-700">Artikel</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Blog perjalanan</h1>
      <p className="mt-3 text-slate-600">
        Konten dikelola admin. Artikel di bawah dapat berupa contoh demo.
      </p>
      {posts.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-slate-300 p-8 text-slate-600">
          Belum ada artikel terbit.
        </p>
      ) : (
        <ul className="mt-10 space-y-6">
          {posts.map((post) => (
            <li key={post.id} className="border-b border-slate-200 pb-6">
              <a href={`/blog/${post.slug}`} className="group">
                <h2 className="text-xl font-semibold text-slate-900 group-hover:text-sky-800">
                  {post.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">{published(post.updatedAt)}</p>
                <p className="mt-3 line-clamp-3 text-sm text-slate-600">{post.body}</p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}