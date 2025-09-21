import Link from "next/link";
import { getAllPosts, PostMeta } from "@/lib/posts";
import Image from "next/image";

function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="grid gap-6 p-5 transition-all border border-gray-200 rounded-lg group md:grid-cols-3 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
        <div className="relative h-48 overflow-hidden rounded-md md:col-span-1">
          <Image
            src={post.image}
            alt={post.title}
            layout="fill"
            objectFit="cover"
          />
        </div>

        <div className="md:col-span-2">
          <div className="flex flex-col items-center justify-center">
            <h2 className="mb-2 text-2xl font-bold transition-colors font-heading group-hover:text-primary">
              {post.title}
            </h2>
            <p className="mb-4 text-muted-foreground">{post.excerpt}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <span>
              {new Date(post.date).toLocaleString("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="mx-2">•</span>
            <span>{post.author}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="container max-w-4xl px-4 py-12 mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight font-heading">
          Turnix Blog
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Consejos, tutoriales y novedades para llevar tu Barbería al siguiente
          nivel.
        </p>
      </header>

      <div className="grid gap-8">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}

export const metadata = {
  title: "Blog | Turnix",
  description: "Consejos, tutoriales y novedades para barberos profesionales.",
};
