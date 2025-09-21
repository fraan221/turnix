import Link from "next/link";
import { getAllPosts, PostMeta } from "@/lib/posts";

function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="p-6 transition-colors border border-gray-200 rounded-lg dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
      <h2 className="mb-2 text-2xl font-bold font-heading">
        <Link
          href={`/blog/${post.slug}`}
          className="transition-colors hover:text-primary"
        >
          {post.title}
        </Link>
      </h2>
      <p className="mb-4 text-muted-foreground">{post.excerpt}</p>
      <div className="text-sm text-muted-foreground">
        <span>
          {new Date(post.date).toLocaleDateString("es-AR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
        <span className="mx-2">•</span>
        <span>{post.author}</span>
      </div>
    </article>
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
