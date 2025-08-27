"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { enableTeamFeature } from "@/actions/team.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Users } from "lucide-react";

export function EnableTeamView() {
  const [isPending, startTransition] = useTransition();

  const handleEnableFeature = async () => {
    startTransition(async () => {
      const result = await enableTeamFeature();
      if (result.error) {
        toast.error("Error al activar", {
          description: result.error,
        });
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader className="items-center">
          <div className="p-4 rounded-full bg-primary/10">
            <Users className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="mt-4 text-3xl">
            Gestiona tu Equipo de Barberos
          </CardTitle>
          <CardDescription className="max-w-md pt-2 text-base">
            Invita a otros barberos a tu espacio de trabajo. Cada uno tendrá su
            propia agenda y servicios, todo bajo el mismo techo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-left">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-3 text-green-500 shrink-0" />
              <span>
                <span className="font-semibold">Centraliza la Gestión:</span>{" "}
                Añade barberos a tu barbería y gestiona todo desde un solo
                lugar.
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-3 text-green-500 shrink-0" />
              <span>
                <span className="font-semibold">Agendas Individuales:</span>{" "}
                Cada barbero gestiona sus propios turnos y servicios, evitando
                conflictos.
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-3 text-green-500 shrink-0" />
              <span>
                <span className="font-semibold">Más Reservas:</span> Ofrece a
                tus clientes la opción de elegir con qué barbero agendar su
                turno.
              </span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <form action={handleEnableFeature} className="w-full">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Activando...
                </>
              ) : (
                "Comenzar a crear mi equipo"
              )}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
