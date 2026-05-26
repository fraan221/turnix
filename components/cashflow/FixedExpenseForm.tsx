"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FixedExpenseSchema } from "@/lib/schemas";
import { createFixedExpense, updateFixedExpense } from "@/actions/cashflow.actions";
import { cn } from "@/lib/utils";
import { formatPrice, cleanPriceValue } from "@/lib/format";

type FormValues = z.infer<typeof FixedExpenseSchema>;

interface FixedExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  editingFixedExpense?: {
    id: string;
    name: string;
    amount: number;
    startDate: Date;
    active: boolean;
  };
}

export default function FixedExpenseForm({
  isOpen,
  onClose,
  onSubmitSuccess,
  editingFixedExpense,
}: FixedExpenseFormProps) {
  const [isPending, startTransition] = React.useTransition();
  const [startDate, setStartDate] = React.useState<Date>(new Date());
  const [amountDisplay, setAmountDisplay] = React.useState("");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatPrice(inputValue);
    setAmountDisplay(formattedValue);
    const cleanValue = cleanPriceValue(formattedValue);
    setValue("amount", cleanValue ? parseFloat(cleanValue) : 0);
  };

  const defaultValues = React.useMemo(() => {
    if (editingFixedExpense) {
      return {
        name: editingFixedExpense.name,
        amount: editingFixedExpense.amount,
        startDate: new Date(editingFixedExpense.startDate),
        active: editingFixedExpense.active,
      };
    }
    // Para gastos fijos, arrancar por defecto el 1 del mes actual
    const firstOfCurrentMonth = new Date();
    firstOfCurrentMonth.setDate(1);
    firstOfCurrentMonth.setHours(12, 0, 0, 0);

    return {
      name: "",
      amount: 0,
      startDate: firstOfCurrentMonth,
      active: true,
    };
  }, [editingFixedExpense]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FixedExpenseSchema) as any,
    defaultValues,
  });

  const isActive = watch("active");

  React.useEffect(() => {
    if (isOpen) {
      const initialDate = defaultValues.startDate;
      setStartDate(initialDate);
      setValue("startDate", initialDate);
      
      const initialAmount = defaultValues.amount;
      setAmountDisplay(initialAmount > 0 ? formatPrice(initialAmount.toString()) : "");
      
      reset(defaultValues);
    }
  }, [isOpen, defaultValues, reset, setValue]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const adjustedDate = new Date(selectedDate);
      adjustedDate.setHours(12, 0, 0, 0);
      setStartDate(adjustedDate);
      setValue("startDate", adjustedDate);
    }
  };

  const onFormSubmit = (values: FormValues) => {
    startTransition(async () => {
      let res;
      if (editingFixedExpense) {
        res = await updateFixedExpense(editingFixedExpense.id, values);
      } else {
        res = await createFixedExpense(values);
      }

      if (res.success) {
        toast.success(res.success);
        onSubmitSuccess();
        onClose();
      } else {
        toast.error(res.error || "Ocurrió un error.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {editingFixedExpense
              ? "Editar Gasto Fijo"
              : "Configurar Gasto Fijo Recurrente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          {/* ITEM NAME */}
          <div className="space-y-1">
            <Label htmlFor="name">Item / Concepto</Label>
            <Input
              id="name"
              placeholder="Ej. Alquiler del local, Luz Edesur, Contador"
              {...register("name")}
              disabled={isPending}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* MONTO */}
            <div className="space-y-1">
              <Label htmlFor="fixed-amount">Monto Estimado ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="fixed-amount"
                  type="text"
                  placeholder="0"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  onBlur={() => {
                    const cleanValue = cleanPriceValue(amountDisplay);
                    setValue("amount", cleanValue ? parseFloat(cleanValue) : 0);
                  }}
                  className="pl-7"
                  disabled={isPending}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* DESDE */}
            <div className="space-y-1">
              <Label>Desde (Mes de inicio)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                    disabled={isPending}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "MMMM yyyy", { locale: es })
                    ) : (
                      <span>Seleccionar mes</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && (
                <p className="text-xs text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>
          </div>

          {/* ESTADO */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
            <div className="space-y-0.5">
              <Label htmlFor="active-status">Estado del compromiso</Label>
              <p className="text-xs text-muted-foreground">
                Si está inactivo, no se computará como pendiente en el mes.
              </p>
            </div>
            <Switch
              id="active-status"
              checked={isActive}
              onCheckedChange={(checked) => setValue("active", checked)}
              disabled={isPending}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingFixedExpense ? "Guardar Cambios" : "Guardar Gasto Fijo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
