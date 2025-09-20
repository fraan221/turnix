import { redirect } from "next/navigation";
import { getUserForSettings } from "@/lib/data";
import { SiteHeader } from "./SiteHeader";

export async function SiteHeaderServer() {
  const userWithDetails = await getUserForSettings();

  if (!userWithDetails) {
    redirect("/login");
  }

  const slug =
    userWithDetails.ownedBarbershop?.slug ||
    userWithDetails.teamMembership?.barbershop?.slug ||
    null;

  const userForHeader = {
    slug: slug,
  };

  return <SiteHeader user={userForHeader} />;
}
