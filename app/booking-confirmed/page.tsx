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
  };
}

export default function BookingConfirmedPage({
  searchParams,
}: BookingConfirmedPageProps) {
  const { client, phone, barberName } = searchParams;

  const message = `Hola! Soy ${client || "un cliente"}, acabo de agendar un turno y quería confirmar mi asistencia. ¡Gracias!`;
  const whatsappUrl = `https://wa.me/${formatPhoneNumberForWhatsApp(phone || "")}?text=${encodeURIComponent(message)}`;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/40 md:p-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="items-center">
          <CheckCircle2 className="w-16 h-16 mb-4 text-green-500" />
          <CardTitle className="text-3xl">¡Turno Confirmado!</CardTitle>
          <CardDescription className="pt-2 text-lg sr-only text-muted-foreground">
            Tu reserva ha sido agendada con éxito.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="py-6 space-y-4 text-center border-t border-b">
            <h3 className="font-semibold">Confirma tu asistencia</h3>
            <p className="text-sm text-muted-foreground">
              Para asegurar tu turno, envía un mensaje de confirmación a{" "}
              <span className="font-bold">{barberName || "tu barbero"}</span>.
            </p>
            <Button asChild size="lg">
              <Link href={whatsappUrl} target="_blank">
                <WhatsAppIcon className="w-5 h-5 mr-2" />
                Confirmar por WhatsApp
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            ¡Muchas gracias por confiar en nosotros!
            <br />
            Ya puedes cerrar esta pestaña. 😊
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
