"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { formatPhoneNumberForWhatsApp } from "@/lib/utils";

interface BookingConfirmedPageProps {
  searchParams: {
    client?: string;
    phone?: string;
    barberName?: string;
    serviceName?: string;
    startTime?: string;
    teamsEnabled?: string;
  };
}

const capitalize = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatBookingDateTime = (isoString?: string) => {
  if (!isoString) return "Fecha y hora por confirmar";
  const date = new Date(isoString);
  const timeZone = "America/Argentina/Buenos_Aires";

  const weekday = date.toLocaleDateString("es-AR", {
    weekday: "long",
    timeZone,
  });
  const day = date.getDate();
  const month = date.toLocaleDateString("es-AR", { month: "long", timeZone });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });

  return `${capitalize(weekday)}, ${day} de ${capitalize(
    month
  )} de ${year}, ${time} hs`;
};

export default function BookingConfirmedPage({
  searchParams,
}: BookingConfirmedPageProps) {
  const { client, phone, barberName, serviceName, startTime, teamsEnabled } =
    searchParams;
  const formattedDateTime = formatBookingDateTime(startTime);
  const isTeamBooking = teamsEnabled === "true";

  const barberLine = isTeamBooking ? `Con: ${barberName}\n` : "";

  const message = `Hola! Soy ${client || "un cliente"}, acabo de reservar un turno y quería confirmar mi asistencia.\n\n${barberLine}- Servicio: ${serviceName || "Servicio"}\n- Día y Hora: ${formattedDateTime}\n\n¡Gracias!`;

  const whatsappUrl = `https://wa.me/${formatPhoneNumberForWhatsApp(
    phone || ""
  )}?text=${encodeURIComponent(message)}`;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/40 md:p-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="items-center">
          <CheckCircle2 className="w-16 h-16 mb-4 text-green-500" />
          <CardTitle className="text-3xl">
            ¡Listo! Tu turno está confirmado
          </CardTitle>
          <CardDescription className="pt-2 text-lg sr-only text-muted-foreground">
            {formattedDateTime}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="py-6 space-y-4 text-center border-t border-b">
            <h3 className="font-semibold">Guardá los detalles</h3>
            <p className="text-sm text-muted-foreground">
              Envialos por WhatsApp para no olvidarte.
            </p>
            <Button asChild size="lg">
              <Link href={whatsappUrl} target="_blank">
                <WhatsAppIcon className="w-5 h-5" />
                Enviar por WhatsApp
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            ¡Gracias por confiar en nosotros!
            <br />
            Ya podés cerrar esta ventana. 😊
          </p>
        </CardContent>
      </Card>
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Powered by{" "}
          <Link
            href="/"
            target="_blank"
            className="font-semibold text-primary hover:underline"
          >
            Turnix
          </Link>
        </p>
      </div>
    </main>
  );
}
