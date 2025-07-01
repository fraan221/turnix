import LoginForm from "@/components/LoginForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center py-12">
      <Card className="max-w-sm mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Inicia Sesión</CardTitle>
          <CardDescription>
            Ingresa tu email para acceder a tu panel de Turnix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}