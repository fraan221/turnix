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
            version="v2026.05.annual"
            title="¡Ya está disponible el Plan Anual!"
            items={[
              "Suscripción Anual: Pagá 12 meses juntos y olvidate de los vencimientos.",
              "Teléfono opcional: Ya no es obligatorio pedirle el teléfono a tus clientes al agendarlos manualmente.",
              "Métodos de pago: Registrá con qué método te pagó cada cliente para un mejor control de ingresos.",
              "Mejoras de sistema: Actualizamos nuestros servidores para que Turnix sea más rápido y estable.",
            ]}
          />
          <SiteHeaderServer />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </PushNotificationProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
