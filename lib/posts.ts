import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import { YouTubeEmbed } from "@/components/mdx-components";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, CreditCard, Sparkles, Bell } from "lucide-react";

const postsDirectory = path.join(process.cwd(), "_posts");

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  image: string;
}

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

export function getPostBySlug(slug: string) {
  const realSlug = slug.replace(/\.mdx$/, "");
  const fullPath = path.join(postsDirectory, `${realSlug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data } = matter(fileContents);

  return {
    slug: realSlug,
    ...data,
  } as PostMeta;
}

export async function getPostData(slug: string) {
  const realSlug = slug.replace(/\.mdx$/, "");
  const fullPath = path.join(postsDirectory, `${realSlug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const mdxSource = await compileMDX({
    source: content,
    components: {
      YouTubeEmbed,
      Alert,
      AlertTitle,
      AlertDescription,
      Terminal,
      CreditCard,
      Sparkles,
      Bell,
    },
    options: { parseFrontmatter: false },
  });

  return {
    slug: realSlug,
    meta: data as PostMeta,
    source: mdxSource,
  };
}

export function getAllPosts() {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}
