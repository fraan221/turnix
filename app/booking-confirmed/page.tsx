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

  const message = `Hola! Soy ${client || "un cliente"}. Acabo de reservar un turno y quería confirmar que voy a asistir. ¡Gracias!`;
  const whatsappUrl = `https://wa.me/${formatPhoneNumberForWhatsApp(phone || "")}?text=${encodeURIComponent(message)}`;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/40 md:p-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="items-center">
          <CheckCircle2 className="w-16 h-16 mb-4 text-green-500" />
          <CardTitle className="text-3xl">¡Tu turno está reservado!</CardTitle>
          <CardDescription className="pt-2 text-lg sr-only text-muted-foreground">
            Ya tenés tu lugar asegurado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="py-6 space-y-4 text-center border-t border-b">
            <h3 className="font-semibold">Solo falta un paso</h3>
            <p className="text-sm text-muted-foreground">
              Enviá un mensaje rápido a {barberName || "tu barbero"} para
              confirmar que vas a ir. ¡Así evitás perder tu lugar!
            </p>
            <Button asChild size="lg">
              <Link href={whatsappUrl} target="_blank">
                <WhatsAppIcon className="w-5 h-5" />
                Confirmar por WhatsApp
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            ¡Gracias por elegirnos!
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
