import { getPersonalBarberStats } from "@/actions/analytics.actions";
import { StatCard } from "@/components/analytics/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { DollarSign, Scissors, Users, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function MyStatsPage() {
  const stats = await getPersonalBarberStats();

  if (stats.error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <Terminal className="w-4 h-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {stats.error} No tienes permiso para ver esta página o ha ocurrido un
          error al cargar tus estadísticas.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid max-w-4xl gap-4 mx-auto md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Ingresos generados"
          value={formatPrice(stats.totalRevenue)}
          icon={<DollarSign className="w-4 h-4 text-muted-foreground" />}
          description="Total facturado en todos tus turnos completados."
        />
        <StatCard
          title="Servicios completados"
          value={stats.completedBookings.toString()}
          icon={<Scissors className="w-4 h-4 text-muted-foreground" />}
          description="Cantidad total de turnos que has finalizado."
        />
        <StatCard
          title="Clientes únicos"
          value={stats.uniqueClients.toString()}
          icon={<Users className="w-4 h-4 text-muted-foreground" />}
          description="Número de clientes diferentes que has atendido."
        />
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            Servicios más Populares
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topServices.length > 0 ? (
            <ul className="space-y-4">
              {stats.topServices.map((service, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between pb-2 border-b last:border-b-0"
                >
                  <span className="font-medium">{service.name}</span>
                  <span className="text-lg font-bold text-muted-foreground">
                    {service.count}{" "}
                    <span className="text-sm font-normal">
                      {service.count === 1 ? "vez" : "veces"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground">
              Aún no tienes suficientes datos para mostrar tus servicios más
              populares.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
