"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, CalendarX, Lightbulb } from "lucide-react";
import { createTimeBlock } from "@/actions/dashboard.actions";
import { createArgentinaDate } from "@/lib/date-helpers";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TimeBlockFormSchema } from "@/lib/schemas";

interface AddTimeBlockModalContentProps {
  onClose: () => void;
  selectedBarberId: string;
}

type TimeBlockFormValues = z.infer<typeof TimeBlockFormSchema>;

export function AddTimeBlockModalContent({
  onClose,
  selectedBarberId,
}: AddTimeBlockModalContentProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<TimeBlockFormValues>({
    resolver: zodResolver(TimeBlockFormSchema),
    mode: "onBlur",
    defaultValues: {
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      reason: "",
    },
  });

  const onSubmit = (data: TimeBlockFormValues) => {
    startTransition(async () => {
      const startDateTimeISO = createArgentinaDate(
        data.startDate,
        data.startTime,
      ).toISOString();
      const endDateTimeISO = createArgentinaDate(
        data.endDate,
        data.endTime,
      ).toISOString();

      const newFormData = new FormData();
      newFormData.append("startDateTime", startDateTimeISO);
      newFormData.append("endDateTime", endDateTimeISO);
      newFormData.append("reason", data.reason || "");
      newFormData.append("barberId", selectedBarberId);

      const result = await createTimeBlock(null, newFormData);

      if (result?.success) {
        toast.success("¡Horario bloqueado!", {
          description: "Los clientes no podrán reservar en este período.",
        });
        form.reset();
        onClose();
      } else if (result?.error) {
        let errorMessage = "Ocurrió un error inesperado.";
        if (typeof result.error === "string") {
          errorMessage = result.error;
        } else {
          const errorValues = Object.values(result.error).flat();
          if (errorValues.length > 0) {
            errorMessage = errorValues[0] as string;
          }
        }
        toast.error("No se pudo bloquear el horario", {
          description: errorMessage,
        });
      }
    });
  };

  return (
    <>
      <DialogHeader className="space-y-3">
        <div className="flex gap-3 items-center">
          <div className="p-2 rounded-lg bg-destructive/10">
            <CalendarX className="w-5 h-5 text-destructive" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl">
            Bloquear Horario
          </DialogTitle>
        </div>
        <DialogDescription className="text-sm text-muted-foreground">
          Definí un período en el que no estarás disponible para atender
          clientes
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="py-4 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Fecha de inicio</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Fecha de fin</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Hora de inicio</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Hora de fin</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>
                  Razón{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Vacaciones, día libre, evento personal"
                    autoComplete="off"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2 items-start p-3 rounded-lg border bg-muted/50 border-muted-foreground/10 text-muted-foreground">
            <Lightbulb className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
            <p className="text-xs leading-relaxed sm:text-sm">
              Tip: Durante este período, los clientes no podrán reservar turnos en
              tu agenda
            </p>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 pt-2 sm:flex-row">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto min-w-[160px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Bloqueando…
                </>
              ) : (
                "Bloquear Horario"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

