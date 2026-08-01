"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader, CalendarX, Lightbulb, CalendarIcon, Clock } from "lucide-react";
import { createTimeBlock, createRecurringTimeBlock } from "@/actions/dashboard.actions";
import { createArgentinaDate } from "@/lib/date-helpers";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  TimeBlockFormSchema,
  type TimeBlockFormValues,
} from "@/lib/schemas";
import { RecurrenceFields } from "./RecurrenceFields";

const timeOptions = Array.from({ length: 96 }, (_, i) => {
  const hour = Math.floor(i / 4).toString().padStart(2, "0");
  const minute = ((i % 4) * 15).toString().padStart(2, "0");
  return `${hour}:${minute}`;
});

interface AddTimeBlockModalContentProps {
  onClose: () => void;
  selectedBarberId: string;
}

export function AddTimeBlockModalContent({
  onClose,
  selectedBarberId,
}: AddTimeBlockModalContentProps) {
  const [isPending, startTransition] = useTransition();
  const [isStartTimeOpen, setIsStartTimeOpen] = useState(false);
  const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);
  const [recurrenceMode, setRecurrenceMode] = useState<"once" | "recurring">(
    "once"
  );

  const form = useForm<TimeBlockFormValues>({
    resolver: zodResolver(TimeBlockFormSchema),
    mode: "onChange",
    defaultValues: {
      type: "once",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      daysOfWeek: [],
      startTimeOfDay: "",
      endTimeOfDay: "",
      recurrenceEndDate: "",
      reason: "",
    },
  });

  const onSubmit = (data: TimeBlockFormValues) => {
    startTransition(async () => {
      let result:
        | { success: string; error?: undefined }
        | { error: string | Record<string, string[]>; success?: undefined }
        | undefined;

      if (data.type === "once") {
        const startDateTimeISO = createArgentinaDate(
          data.startDate!,
          data.startTime!
        ).toISOString();
        const endDateTimeISO = createArgentinaDate(
          data.endDate!,
          data.endTime!
        ).toISOString();

        const formData = new FormData();
        formData.append("startDateTime", startDateTimeISO);
        formData.append("endDateTime", endDateTimeISO);
        formData.append("reason", data.reason || "");
        formData.append("barberId", selectedBarberId);

        result = await createTimeBlock(null, formData);
      } else {
        result = await createRecurringTimeBlock({
          daysOfWeek: data.daysOfWeek ?? [],
          startTimeOfDay: data.startTimeOfDay!,
          endTimeOfDay: data.endTimeOfDay!,
          recurrenceEndDate: data.recurrenceEndDate || null,
          reason: data.reason || null,
          barberId: selectedBarberId,
        });
      }

      if (result?.success) {
        toast.success("¡Horario bloqueado!", {
          description: "Los clientes no podrán reservar en este período.",
        });
        form.reset();
        onClose();
      } else if (result?.error) {
        const errorMessage =
          typeof result.error === "string"
            ? result.error
            : (Object.values(result.error).flat()[0] as string) ||
              "Ocurrió un error inesperado.";
        toast.error("No se pudo bloquear el horario", {
          description: errorMessage,
        });
      }
    });
  };

  const handleModeChange = (value: string) => {
    if (value !== "once" && value !== "recurring") return;
    setRecurrenceMode(value);
    form.setValue("type", value, { shouldValidate: true });
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
          <Tabs
            value={recurrenceMode}
            onValueChange={handleModeChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="once">Una vez</TabsTrigger>
              <TabsTrigger value="recurring">Cada semana</TabsTrigger>
            </TabsList>

            <TabsContent value="once" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="space-y-2 flex flex-col">
                      <FormLabel>Fecha de inicio</FormLabel>
                      <Popover modal={true}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-11 px-4",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              {field.value ? (
                                format(
                                  new Date(`${field.value}T12:00:00`),
                                  "d 'de' MMMM, yyyy",
                                  { locale: es }
                                )
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value
                                ? new Date(`${field.value}T12:00:00`)
                                : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(format(date, "yyyy-MM-dd"));
                              } else {
                                field.onChange("");
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="space-y-2 flex flex-col">
                      <FormLabel>Fecha de fin</FormLabel>
                      <Popover modal={true}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-11 px-4",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              {field.value ? (
                                format(
                                  new Date(`${field.value}T12:00:00`),
                                  "d 'de' MMMM, yyyy",
                                  { locale: es }
                                )
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value
                                ? new Date(`${field.value}T12:00:00`)
                                : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(format(date, "yyyy-MM-dd"));
                              } else {
                                field.onChange("");
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                    <FormItem className="space-y-2 flex flex-col">
                      <FormLabel>Hora de inicio</FormLabel>
                      <Popover
                        open={isStartTimeOpen}
                        onOpenChange={setIsStartTimeOpen}
                        modal={true}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-11 px-4",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <Clock className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              {field.value ? (
                                `${field.value} hs`
                              ) : (
                                <span>Seleccionar hora</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-36 p-1.5" align="start">
                          <div className="h-64 overflow-y-auto flex flex-col gap-1.5 pr-1 scrollbar-thin">
                            {timeOptions.map((time) => (
                              <Button
                                key={time}
                                variant="ghost"
                                className={cn(
                                  "justify-start font-normal w-full h-10 px-3",
                                  field.value === time &&
                                    "bg-accent text-accent-foreground font-semibold"
                                )}
                                onClick={() => {
                                  field.onChange(time);
                                  field.onBlur();
                                  setIsStartTimeOpen(false);
                                }}
                              >
                                {time} hs
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem className="space-y-2 flex flex-col">
                      <FormLabel>Hora de fin</FormLabel>
                      <Popover
                        open={isEndTimeOpen}
                        onOpenChange={setIsEndTimeOpen}
                        modal={true}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-11 px-4",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <Clock className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              {field.value ? (
                                `${field.value} hs`
                              ) : (
                                <span>Seleccionar hora</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-36 p-1.5" align="start">
                          <div className="h-64 overflow-y-auto flex flex-col gap-1.5 pr-1 scrollbar-thin">
                            {timeOptions.map((time) => (
                              <Button
                                key={time}
                                variant="ghost"
                                className={cn(
                                  "justify-start font-normal w-full h-10 px-3",
                                  field.value === time &&
                                    "bg-accent text-accent-foreground font-semibold"
                                )}
                                onClick={() => {
                                  field.onChange(time);
                                  field.onBlur();
                                  setIsEndTimeOpen(false);
                                }}
                              >
                                {time} hs
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
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
            </TabsContent>

            <TabsContent value="recurring" className="mt-4">
              <RecurrenceFields control={form.control} showEndDate />
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 items-start p-3 rounded-lg border bg-muted/50 border-muted-foreground/10 text-muted-foreground">
            <Lightbulb className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
            <p className="text-xs leading-relaxed sm:text-sm">
              {recurrenceMode === "once"
                ? "Tip: Durante este período, los clientes no podrán reservar turnos en tu agenda."
                : "Tip: Este bloqueo se repetirá automáticamente cada semana hasta la fecha de fin o hasta que lo elimines."}
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
                  <Loader className="mr-2 w-4 h-4 animate-spin" />
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
