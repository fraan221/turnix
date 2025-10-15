import Link from "next/link";
import { getAllPosts, PostMeta } from "@/lib/posts";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

export default function HelpPage() {
  const posts = getAllPosts();

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {posts.map((post: PostMeta) => (
          <Link
            href={`/blog/${post.slug}`}
            key={post.slug}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card className="h-full border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-heading">
                    {post.title}
                  </CardTitle>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <CardDescription className="pt-2">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
