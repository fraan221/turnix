"use client";

import { useState, useTransition, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TimeBlock } from "@prisma/client";
import { toast } from "sonner";
import { updateTimeBlock, updateRecurringTimeBlock } from "@/actions/dashboard.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ARGENTINA_TIMEZONE,
  createArgentinaDate,
  formatTime,
} from "@/lib/date-helpers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader, CalendarIcon } from "lucide-react";
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

function isRecurringTimeBlock(
  block: TimeBlock
): block is TimeBlock & {
  dayOfWeek: number;
  startTimeOfDay: string;
  endTimeOfDay: string;
  recurrenceEndDate: Date | null;
} {
  return block.dayOfWeek !== null && block.startTime === null;
}

export default function EditTimeBlockForm({
  timeBlock,
  returnHref = "/dashboard/schedule",
}: {
  timeBlock: TimeBlock;
  returnHref?: string;
}) {
  const formatDateInputInArgentina = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-CA", {
      timeZone: ARGENTINA_TIMEZONE,
    });

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isStartTimeOpen, setIsStartTimeOpen] = useState(false);
  const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);

  const isRecurring = isRecurringTimeBlock(timeBlock);

  const form = useForm<TimeBlockFormValues>({
    resolver: zodResolver(TimeBlockFormSchema),
    mode: "onChange",
    defaultValues: isRecurring
      ? {
          type: "recurring",
          dayOfWeek: timeBlock.dayOfWeek,
          startTimeOfDay: timeBlock.startTimeOfDay ?? "",
          endTimeOfDay: timeBlock.endTimeOfDay ?? "",
          recurrenceEndDate: timeBlock.recurrenceEndDate
            ? formatDateInputInArgentina(timeBlock.recurrenceEndDate)
            : "",
          reason: timeBlock.reason || "",
          startDate: "",
          startTime: "",
          endDate: "",
          endTime: "",
          daysOfWeek: [timeBlock.dayOfWeek],
        }
      : {
          type: "once",
          startDate: timeBlock.startTime
            ? formatDateInputInArgentina(timeBlock.startTime)
            : "",
          startTime: timeBlock.startTime ? formatTime(timeBlock.startTime) : "",
          endDate: timeBlock.endTime
            ? formatDateInputInArgentina(timeBlock.endTime)
            : "",
          endTime: timeBlock.endTime ? formatTime(timeBlock.endTime) : "",
          reason: timeBlock.reason || "",
          daysOfWeek: [],
          startTimeOfDay: "",
          endTimeOfDay: "",
          recurrenceEndDate: "",
        },
  });

  const startVal = form.watch("startTime");
  const endVal = form.watch("endTime");

  const computedStartTimeOptions = useMemo(() => {
    if (startVal && !timeOptions.includes(startVal)) {
      return [...timeOptions, startVal].sort();
    }
    return timeOptions;
  }, [startVal]);

  const computedEndTimeOptions = useMemo(() => {
    if (endVal && !timeOptions.includes(endVal)) {
      return [...timeOptions, endVal].sort();
    }
    return timeOptions;
  }, [endVal]);

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

        result = await updateTimeBlock(timeBlock.id, null, formData);
      } else {
        result = await updateRecurringTimeBlock(timeBlock.id, {
          dayOfWeek: data.dayOfWeek ?? 0,
          startTimeOfDay: data.startTimeOfDay!,
          endTimeOfDay: data.endTimeOfDay!,
          recurrenceEndDate: data.recurrenceEndDate || null,
          reason: data.reason || null,
        });
      }

      if (result?.success) {
        toast.success("Bloqueo actualizado", {
          description: "Los cambios se guardaron correctamente",
        });
        router.push(returnHref);
      } else if (result?.error) {
        const errorMessage =
          typeof result.error === "string"
            ? result.error
            : (Object.values(result.error).flat()[0] as string) ||
              "No pudimos guardar los cambios. Intentá de nuevo.";
        toast.error("Error al guardar", { description: errorMessage });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <Link href={returnHref}>
              <Button variant="ghost" size="icon" className="w-9 h-9">
                <ArrowLeft className="w-4 h-4" />
                <span className="sr-only">Volver a horarios</span>
              </Button>
            </Link>
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Editar Bloqueo</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isRecurring
                  ? "Modificá el día y la franja horaria del bloqueo recurrente"
                  : "Modificá el período y horario del bloqueo"}
              </p>
            </div>
          </div>

          {isRecurring ? (
            <RecurrenceFields
              control={form.control}
              showEndDate
              daySelectionMode="single"
              reasonLabel="Razón del bloqueo"
              reasonPlaceholder="Ej: Almuerzo, reunión semanal"
            />
          ) : (
            <>
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
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
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
                            {computedStartTimeOptions.map((time) => (
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
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
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
                            {computedEndTimeOptions.map((time) => (
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
                      Razón del bloqueo{" "}
                      <span className="text-muted-foreground">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Vacaciones, evento familiar, feriado"
                        rows={3}
                        className="resize-none"
                        autoComplete="off"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Ayuda a recordar por qué bloqueaste este horario
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Link href={returnHref} className="w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isPending}
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto min-w-[160px]"
          >
            {isPending ? (
              <>
                <Loader className="mr-2 w-4 h-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
