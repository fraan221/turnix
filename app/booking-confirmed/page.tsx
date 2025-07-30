import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function BookingConfirmedPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/40 md:p-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="items-center">
          <CheckCircle2 className="w-16 h-16 mb-4 text-green-500" />
          <CardTitle className="text-3xl">¡Turno Confirmado!</CardTitle>
          <CardDescription className="pt-2 text-lg text-muted-foreground">
            Tu reserva ha sido agendada con éxito.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="py-4 space-y-2 text-left border-t border-b">
            <p className="text-sm">
              Recibirás un recordatorio por WhatsApp antes de tu turno.
            </p>
            <p className="text-sm">
              Si necesitas cancelar o reprogramar, por favor contacta
              directamente a la barbería.
            </p>
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
