import { auth } from "@/auth";
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
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!session.user.role) {
    redirect("/complete-profile");
  }

  const hasActiveSubscription =
    session.user.subscription?.status === "authorized";
  const showTrialBanner =
    !hasActiveSubscription &&
    session.user.trialEndsAt &&
    new Date(session.user.trialEndsAt) > new Date();

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        {showTrialBanner && (
          <TrialStatusBanner
            trialEndsAt={session.user.trialEndsAt}
            isSubscribed={hasActiveSubscription}
          />
        )}
        <SiteHeader />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
