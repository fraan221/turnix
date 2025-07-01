import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { updateClientNotes } from "@/actions/dashboard.actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
interface ClientDetailPageProps {
  params: { clientId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
  });

  if (!client) return <p>Cliente no encontrado.</p>;

  const updateNotesAction = updateClientNotes.bind(null, client.id);

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Ficha de Cliente: {client.name}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Notas Privadas</CardTitle>
          <CardDescription>
            Añade aquí cualquier detalle importante sobre este cliente. Solo tú podrás verlo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateNotesAction}>
            <div className="grid w-full gap-2">
              <Label htmlFor="notes">Notas sobre {client.name}</Label>
              <Textarea 
                id="notes" 
                name="notes"
                placeholder="Ej: Prefiere la máquina en el número 2, le gusta hablar de fútbol, alérgico a..." 
                defaultValue={client.notes || ""}
                rows={6}
              />
              <Button type="submit" className="w-full mt-2">Guardar Notas</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}