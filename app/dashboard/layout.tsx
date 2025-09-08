import { getUserForLayout } from "@/lib/data";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { SiteHeader } from "@/components/SiteHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import TrialStatusBanner from "@/components/TrialStatusBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserForLayout();
  if (!user) {
    redirect("/login");
  }
  if (!user.role) {
    redirect("/complete-profile");
  }

  const isOwner = user.role === "OWNER";
  const hasActiveSubscription = user.subscription?.status === "authorized";
  const showTrialBanner =
    isOwner &&
    !hasActiveSubscription &&
    user.trialEndsAt &&
    new Date(user.trialEndsAt) > new Date();

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        {showTrialBanner && (
          <TrialStatusBanner
            trialEndsAt={user.trialEndsAt}
            isSubscribed={hasActiveSubscription}
          />
        )}
        <SiteHeader />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
