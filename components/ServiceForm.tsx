import { createService } from "@/actions/dashboard.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ServiceForm() {
  return (
    <form action={createService} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre del Servicio</Label>
        <Input id="name" name="name" placeholder="Ej: Corte Fade" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="price">Precio ($)</Label>
        <Input id="price" name="price" type="number" step="0.01" placeholder="Ej: 8000" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="duration">Duración (minutos)</Label>
        <Input id="duration" name="duration" type="number" placeholder="Ej: 60 (1 hora)" required />
      </div>
      <Button type="submit" className="w-full">
        Añadir Servicio
      </Button>
    </form>
  );
}