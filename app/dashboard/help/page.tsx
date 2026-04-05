import Link from "next/link";
import { getAllPosts, PostMeta } from "@/lib/posts";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight, BookOpen } from "lucide-react";

export default function HelpPage() {
  const posts = getAllPosts();

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">
          Centro de Ayuda
        </h1>
        <p className="text-muted-foreground mt-2">
          Resolvé tus dudas, leé nuestros tutoriales y sacale el máximo jugo a tu barbería con Turnix.
        </p>
      </div>

      {/* Empty State */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border rounded-xl border-dashed bg-muted/20">
          <BookOpen
            className="h-12 w-12 text-muted-foreground/50 mb-4"
            strokeWidth={1.5}
          />
          <h2 className="text-lg font-semibold">
            Todavía no hay guías publicadas
          </h2>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Estamos preparando el mejor contenido para ayudarte. ¡Volvé a
            revisar pronto!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: PostMeta) => (
            <Link
              href={`/blog/${post.slug}`}
              key={post.slug}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Card className="h-full border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg font-heading leading-tight group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    <ArrowUpRight
                      className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0"
                      aria-hidden="true"
                    />
                  </div>
                  <CardDescription className="pt-2 line-clamp-2">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
