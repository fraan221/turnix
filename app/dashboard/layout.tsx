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

  const hasPaidSubscription = !!session.user.subscription;
  const showTrialBanner = !hasPaidSubscription && session.user.trialEndsAt;

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        {showTrialBanner && (
          <TrialStatusBanner trialEndsAt={session.user.trialEndsAt} />
        )}
        <SiteHeader />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
