import { auth } from "@/auth";
import { MainNav } from "./MainNav"; 
import UserButton from "./UserButton"; 

export default async function Header() {
  const session = await auth();

  const barbershopName = (session?.user as any)?.barbershopName || null;

  return (
    <header className="sticky top-0 z-50 flex justify-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between w-full h-16 px-4 mx-auto max-w-7xl sm:px-6">
        <MainNav barbershopName={barbershopName} />
        <UserButton />
      </div>
    </header>
  );
}