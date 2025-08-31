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
            ¿Trabajás con otros barberos?
          </CardTitle>
          <CardDescription className="max-w-sm pt-2 text-base">
            Agregá a tu equipo y que cada barbero maneje su propia agenda. Más
            organización, más clientes, más facturación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-left">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-3 text-green-500 shrink-0" />
              <span>
                <span className="font-semibold">Control Total:</span> Agregás
                barberos y manejás toda la barbería desde un solo panel.
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-3 text-green-500 shrink-0" />
              <span>
                <span className="font-semibold">Sin Líos:</span> Cada barbero
                tiene su agenda propia. No más confusiones ni turnos
                superpuestos.
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-3 text-green-500 shrink-0" />
              <span>
                <span className="font-semibold">Más Turnos:</span> Los clientes
                pueden elegir barbero y horario. Más opciones = más reservas.
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
                "Activar gestión de equipo"
              )}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
