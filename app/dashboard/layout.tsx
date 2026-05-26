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
            version="v2026.05.e4"
            title="Nuevas herramientas para tu negocio"
            items={[
              "Nuevo módulo de Caja: registrá tus ingresos, egresos y gastos fijos para saber cuánto te queda realmente cada mes.",
              "Exportá tus reportes financieros en Excel o PDF para compartirlos con tu contador.",
              "Actualizamos la seguridad y estabilidad de la plataforma.",
            ]}
          />
          <SiteHeaderServer />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </PushNotificationProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
