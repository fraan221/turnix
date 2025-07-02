"use client";

import { TimeBlock } from "@prisma/client";
import { Button } from "./ui/button";
import { deleteTimeBlock } from "@/actions/dashboard.actions";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <Button variant="destructive" size="icon" type="submit" disabled={pending}>
            <Trash2 className="w-4 h-4" />
        </Button>
    )
}

function TimeBlockItem({ block }: { block: TimeBlock }) {
    const deleteTimeBlockWithId = async (prevState: any, formData: FormData) => {
        return deleteTimeBlock(prevState, block.id);
    };

    const [state, formAction] = useFormState(deleteTimeBlockWithId, null);

    useEffect(() => {
        if (state?.success) {
            toast.success("¡Éxito!", { description: state.success });
        }
        if (state?.error) {
            toast.error("Error", { description: state.error });
        }
    }, [state]);

    return (
        <div className="flex items-center justify-between p-3 border rounded-md bg-slate-100">
            <div>
                <p className="font-semibold">{block.reason || "Bloqueo de tiempo"}</p>
                <p className="text-sm text-gray-600">
                    {new Date(block.startTime).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })} - {new Date(block.endTime).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
            </div>
            <form action={formAction}>
                <DeleteButton />
            </form>
        </div>
    );
}

export default function TimeBlockList({ timeBlocks }: { timeBlocks: TimeBlock[] }) {
  if (timeBlocks.length === 0) {
    return <p>No tienes ningún bloqueo programado.</p>;
  }

  return (
    <div className="space-y-3">
      {timeBlocks.map((block) => (
        <TimeBlockItem key={block.id} block={block} />
      ))}
    </div>
  );
}
