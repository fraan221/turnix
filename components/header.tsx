import { auth } from "@/auth";
import { MainNav } from "./MainNav";
import UserButton from "./UserButton";
import Link from "next/link";

export default async function Header() {
  const session = await auth();
  const barbershopName = (session?.user as any)?.barbershop?.name || null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center h-16">
        <div className="mr-4">{session?.user && <MainNav />}</div>

        <div className="flex justify-center flex-1">
          <Link
            href={session?.user ? "/dashboard" : "/"}
            className="flex items-center gap-2"
          >
            {barbershopName && (
              <h1 className="text-lg font-bold tracking-tight">
                {barbershopName}
              </h1>
            )}
          </Link>
        </div>

        <div className="ml-4">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
