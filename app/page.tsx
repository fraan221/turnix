import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "../components/ui/card";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-slate-100">
      <Card className="w-[450px]">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Bienvenido a Turnix</CardTitle>
          <CardDescription className="pt-2">Tu entorno de desarrollo está listo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-center text-slate-700">
            <p>✅ Next.js 14</p>
            <p>✅ Prisma + PostgreSQL</p>
            <p>✅ shadcn/ui</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Acceder al Panel</Button>
        </CardFooter>
      </Card>
    </main>
  );
}