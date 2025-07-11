import { MainNav } from "./MainNav";
import UserButton from "./UserButton";
import NotificationCenter from "./NotificationCenter";

export default async function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16">
        <MainNav />

        <div className="flex items-center gap-2">
          <NotificationCenter />
          <UserButton />
        </div>
      </div>
    </header>
  );
}
