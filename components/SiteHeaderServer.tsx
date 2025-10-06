import { redirect } from "next/navigation";
import { getUserForSettings } from "@/lib/data";
import { SiteHeader } from "./SiteHeader";

export async function SiteHeaderServer() {
  const userWithDetails = await getUserForSettings();

  if (!userWithDetails) {
    redirect("/login");
  }

  const barbershop =
    userWithDetails.ownedBarbershop ||
    userWithDetails.teamMembership?.barbershop;

  const slug = barbershop?.slug || null;
  const logoUrl = barbershop?.image || null;

  const userForHeader = {
    slug: slug,
    logoUrl: logoUrl,
  };

  return <SiteHeader user={userForHeader} />;
}
