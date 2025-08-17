import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
    <div className="flex flex-col items-center justify-center gap-6 p-6 bg-muted min-h-svh md:p-10">
      <div className="flex flex-col w-full max-w-sm gap-6">
        <Link
          href="/"
          className="flex items-center self-center gap-2 font-semibold"
        >
          <Image
            src="/logo.png"
            alt="Logo de Turnix"
            width={32}
            height={32}
            className="rounded-md"
          />
          Turnix
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Un último paso...</CardTitle>
            <CardDescription>
              ¡Hola, {session.user.name}! Para terminar de configurar tu cuenta,
              necesitamos un par de datos más.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompleteProfileForm user={session.user} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}