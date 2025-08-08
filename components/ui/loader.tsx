import { Loader2 } from "lucide-react";

export function Loader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Cargando...</p>
    </div>
  );
}
