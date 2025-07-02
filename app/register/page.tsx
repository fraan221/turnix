import RegisterForm from "@/components/RegisterForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <main className="flex flex-col items-center justify-center py-12">
      <Card className="max-w-sm mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Regístrate</CardTitle>
          <CardDescription>
            Ingresa tus datos para crear tu cuenta en Turnix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm /> 
          <div className="mt-4 text-sm text-center">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" passHref legacyBehavior>
              <Button asChild variant="link">
                <a>Inicia Sesión</a>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
