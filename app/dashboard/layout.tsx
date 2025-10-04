import { DashboardSidebar } from "@/components/DashboardSidebar";
import { SiteHeaderServer } from "@/components/SiteHeaderServer";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import TrialStatusBanner from "@/components/TrialStatusBanner";
import SubscriptionStatusHandler from "@/components/SubscriptionStatusHandler";
import { PusherHandler } from "@/components/PusherHandler";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <SubscriptionStatusHandler />
        <TrialStatusBanner />
        <SiteHeaderServer />
        <PusherHandler />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
