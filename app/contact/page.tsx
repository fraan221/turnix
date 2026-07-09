import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <main className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Contacto</CardTitle>
          <CardDescription>
            Si tienes alguna pregunta sobre nuestras políticas de privacidad o necesitas ayuda con tu cuenta, no dudes en contactarnos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            Puedes enviarnos un correo electrónico a:
          </p>
          <a href="mailto:privacidad@hypeh.com.ar" className="text-xl font-semibold text-primary hover:underline">
            privacidad@hypeh.com.ar
          </a>
          <p className="mt-4 text-sm text-muted-foreground">
            Haremos todo lo posible por responderte a la brevedad.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}