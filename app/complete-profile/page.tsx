import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CompleteProfileForm from "@/components/CompleteProfileForm";

export default async function CompleteProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Un último paso...</CardTitle>
          <CardDescription>
            ¡Hola, {session.user.name}! Para terminar de configurar tu cuenta,
            necesitamos un par de datos más.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompleteProfileForm user={session.user} />
        </CardContent>
      </Card>
    </main>
  );
}
