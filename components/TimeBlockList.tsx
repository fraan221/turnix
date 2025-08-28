"use client";

import { TimeBlock } from "@prisma/client";
import { Button } from "./ui/button";
import { deleteTimeBlock } from "@/actions/dashboard.actions";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function TimeBlockItem({ block }: { block: TimeBlock }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTimeBlock(block.id);
      if (result?.success) {
        toast.success("¡Éxito!", { description: result.success });
      }
      if (result?.error) {
        toast.error("Error", { description: result.error });
      }
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-md">
      <div>
        <p className="font-semibold">{block.reason || "Bloqueo de tiempo"}</p>
        <p className="text-sm text-gray-600">
          {new Date(block.startTime).toLocaleString("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
          })}{" "}
          -{" "}
          {new Date(block.endTime).toLocaleString("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      </div>

      <div className="flex items-center gap-x-2">
        <Link href={`/dashboard/schedule/${block.id}/edit`}>
          <Button variant="outline" size="icon">
            <Pencil className="w-4 h-4" />
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente
                este bloqueo de tiempo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending ? "Eliminando..." : "Sí, eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function TimeBlockList({
  timeBlocks,
}: {
  timeBlocks: TimeBlock[];
}) {
  return (
    <div className="space-y-3">
      {timeBlocks.map((block) => (
        <TimeBlockItem key={block.id} block={block} />
      ))}
    </div>
  );
}
