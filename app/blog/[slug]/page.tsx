import { getPostData, getAllPosts } from "@/lib/posts";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const { meta } = await getPostData(params.slug);
  return {
    title: `${meta.title} | Turnix Blog`,
    description: meta.excerpt,
  };
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const { source, meta } = await getPostData(params.slug);

  if (!source) {
    notFound();
  }

  return (
    <div className="container max-w-4xl px-4 py-12 mx-auto">
      <article className="mx-auto prose prose-lg dark:prose-invert">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight font-heading sm:text-5xl">
            {meta.title}
          </h1>
          <div className="mt-4 text-base text-muted-foreground">
            <span>
              Publicado el{" "}
              {new Date(meta.date).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="mx-2">•</span>
            <span>Autor: {meta.author}</span>
          </div>
        </header>

        {source.content}
      </article>
    </div>
  );
}
