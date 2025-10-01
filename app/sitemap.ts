import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const siteUrl = "https://www.turnix.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 1.0,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.8,
    },
  ];

  const barbershops = await prisma.barbershop.findMany({
    select: {
      slug: true,
    },
  });

  const barbershopRoutes = barbershops.map((barbershop) => ({
    url: `${siteUrl}/${barbershop.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...barbershopRoutes];
}
