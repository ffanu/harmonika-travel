import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const published = (value: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(value);

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) notFound();

  const post = await db.content
    .findUnique({
      where: { slug },
      select: { title: true, body: true, updatedAt: true, published: true },
    })
    .catch(() => null);

  if (!post || !post.published) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10">
      <nav className="mb-8 flex flex-wrap items-center gap-4 text-sm">
        <a href="/" className="font-bold text-sky-800">Harmonika Travel</a>
        <a href="/blog" className="text-slate-600 hover:text-sky-800">Semua artikel</a>
      </nav>
      <article>
        <h1 className="text-3xl font-bold text-slate-900">{post.title}</h1>
        <p className="mt-2 text-xs text-slate-500">Diperbarui {published(post.updatedAt)}</p>
        <div className="mt-6 whitespace-pre-line text-slate-700">{post.body}</div>
      </article>
      <p className="mt-10 text-xs text-slate-500">
        Artikel ini bersifat informasi umum dan bukan jaminan ketersediaan atau harga.
      </p>
    </main>
  );
}