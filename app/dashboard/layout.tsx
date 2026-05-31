import { DashboardSidebar } from "@/components/DashboardSidebar";
import { SiteHeaderServer } from "@/components/SiteHeaderServer";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import TrialStatusBanner from "@/components/TrialStatusBanner";
import SubscriptionStatusHandler from "@/components/SubscriptionStatusHandler";
import { SubscriptionWarningBanner } from "@/components/layout/SubscriptionWarningBanner";
import { WhatsNewDialog } from "@/components/WhatsNewDialog";

import { PushNotificationProvider } from "@/components/providers/PushNotificationProvider";
import { SubscriptionHydrator } from "@/components/providers/SubscriptionHydrator";
import { RealtimeToastHandler } from "@/components/providers/RealtimeToastHandler";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <PushNotificationProvider>
          <SubscriptionHydrator />
          <SubscriptionStatusHandler />
          <RealtimeToastHandler />
          <TrialStatusBanner />
          <SubscriptionWarningBanner />
          <WhatsNewDialog
            version="v2026.05.e5"
            title="Mejoras de rendimiento"
            items={[
              "Analytics carga más rápido: optimizamos la base de datos para que tus reportes no se queden trabados.",
            ]}
          />
          <SiteHeaderServer />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </PushNotificationProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
