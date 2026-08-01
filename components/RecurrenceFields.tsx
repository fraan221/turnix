"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

const DAYS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const timeOptions = Array.from({ length: 96 }, (_, i) => {
  const hour = Math.floor(i / 4).toString().padStart(2, "0");
  const minute = ((i % 4) * 15).toString().padStart(2, "0");
  return `${hour}:${minute}`;
});

type RecurrenceFieldProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  showEndDate?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  // "multiple" para el modal de crear (array daysOfWeek),
  // "single" para el editor de un timeblock existente (campo dayOfWeek, con Select).
  daySelectionMode?: "multiple" | "single";
};

export function RecurrenceFields({
  control,
  showEndDate = true,
  reasonLabel = "Razón",
  reasonPlaceholder = "Ej: Almuerzo, reunión semanal",
  daySelectionMode = "multiple",
}: RecurrenceFieldProps) {
  return (
    <div className="space-y-4">
      {daySelectionMode === "multiple" ? (
        <FormField
          control={control}
          name="daysOfWeek"
          render={({ field }) => (
            <FormItem className="space-y-2 flex flex-col">
              <FormLabel>Días de la semana</FormLabel>
              <ToggleGroup
                type="multiple"
                value={(field.value ?? []).map(String)}
                onValueChange={(values) => {
                  field.onChange(values.map(Number));
                }}
                className="justify-start flex-wrap"
              >
                {DAYS_SHORT.map((day, idx) => (
                  <ToggleGroupItem
                    key={idx}
                    value={idx.toString()}
                    aria-label={DAYS_ES[idx]}
                    variant="outline"
                    size="sm"
                  >
                    {day}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={control}
          name="dayOfWeek"
          render={({ field }) => (
            <FormItem className="space-y-2 flex flex-col">
              <FormLabel>Día de la semana</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(parseInt(val, 10))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger id="recurrence-dayOfWeek">
                    <SelectValue placeholder="Seleccioná un día" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DAYS_ES.map((day, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="startTimeOfDay"
          render={({ field }) => (
            <FormItem className="space-y-2 flex flex-col">
              <FormLabel>Hora de inicio</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger id="recurrence-startTimeOfDay">
                    <Clock className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time} hs
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="endTimeOfDay"
          render={({ field }) => (
            <FormItem className="space-y-2 flex flex-col">
              <FormLabel>Hora de fin</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger id="recurrence-endTimeOfDay">
                    <Clock className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time} hs
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {showEndDate && (
        <FormField
          control={control}
          name="recurrenceEndDate"
          render={({ field }) => (
            <FormItem className="space-y-2 flex flex-col">
              <FormLabel>
                Repetir hasta{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (opcional)
                </span>
              </FormLabel>
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
                        <span>Sin fecha de fin (permanente)</span>
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
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="reason"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>
              {reasonLabel}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (opcional)
              </span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder={reasonPlaceholder}
                autoComplete="off"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}