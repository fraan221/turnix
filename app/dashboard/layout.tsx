import { DashboardSidebar } from "@/components/DashboardSidebar";
import { SiteHeader } from "@/components/SiteHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import TrialStatusBanner from "@/components/TrialStatusBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <TrialStatusBanner />
        <SiteHeader />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
