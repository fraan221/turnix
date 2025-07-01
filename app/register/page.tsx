import { registerBarber } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <main className="flex flex-col items-center justify-center py-12">
      <Card className="max-w-sm mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Registrate</CardTitle>
          <CardDescription>
            Ingresa tus datos para crear tu cuenta en Turnix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={registerBarber} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" placeholder="Ej: Juan Pérez" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="barbershopName">Nombre de tu Barbería (Opcional)</Label>
              <Input id="barbershopName" name="barbershopName" placeholder="Ej: La Cueva del Barbero" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full text-white bg-black">
              Crear Cuenta
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}