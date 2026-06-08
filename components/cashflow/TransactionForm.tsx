"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarIcon, Plus, Tag, Loader } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CashflowTransactionSchema } from "@/lib/schemas";
import {
  createCashflowTransaction,
  updateCashflowTransaction,
  createCashflowCategory,
} from "@/actions/cashflow.actions";
import { cn } from "@/lib/utils";
import { formatPrice, cleanPriceValue } from "@/lib/format";

type FormValues = z.infer<typeof CashflowTransactionSchema>;

interface TransactionFormProps {
  categories: { id: string; name: string }[];
  fixedExpenses: { id: string; name: string; amount: number }[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  editingTransaction?: {
    id: string;
    amount: number;
    type: "INFLOW" | "OUTFLOW";
    paymentMethod: "CASH" | "TRANSFER" | "CARD";
    categoryId: string;
    description: string | null;
    date: Date;
    fixedExpenseId: string | null;
  };
  preloadFixedExpenseId?: string;
}

export default function TransactionForm({
  categories,
  fixedExpenses,
  isOpen,
  onClose,
  onSubmitSuccess,
  editingTransaction,
  preloadFixedExpenseId,
}: TransactionFormProps) {
  const [isPending, startTransition] = React.useTransition();
  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [isCategoryPending, setIsCategoryPending] = React.useState(false);
  const [date, setDate] = React.useState<Date>(new Date());
  const [amountDisplay, setAmountDisplay] = React.useState("");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatPrice(inputValue);
    setAmountDisplay(formattedValue);
    const cleanValue = cleanPriceValue(formattedValue);
    setValue("amount", cleanValue ? parseFloat(cleanValue) : 0);
  };

  const defaultValues = React.useMemo(() => {
    if (editingTransaction) {
      return {
        amount: editingTransaction.amount,
        type: editingTransaction.type,
        paymentMethod: editingTransaction.paymentMethod,
        categoryId: editingTransaction.categoryId,
        description: editingTransaction.description || "",
        date: new Date(editingTransaction.date),
        fixedExpenseId: editingTransaction.fixedExpenseId || "",
      };
    }

    if (preloadFixedExpenseId) {
      const fx = fixedExpenses.find((f) => f.id === preloadFixedExpenseId);
      // Intentar encontrar la categoría "Alquiler" o "Servicios" o "Gastos" para asociarla por defecto
      const defaultCat = categories.find((c) => 
        c.name.toLowerCase().includes("alquiler") || 
        c.name.toLowerCase().includes("servicios") || 
        c.name.toLowerCase().includes("gastos")
      ) || categories[0];

      return {
        amount: fx?.amount || 0,
        type: "OUTFLOW" as const,
        paymentMethod: "TRANSFER" as const, // default for fixed expenses
        categoryId: defaultCat?.id || "",
        description: fx ? `Pago mensual: ${fx.name}` : "",
        date: new Date(),
        fixedExpenseId: preloadFixedExpenseId,
      };
    }

    return {
      amount: 0,
      type: "OUTFLOW" as const,
      paymentMethod: "CASH" as const,
      categoryId: categories[0]?.id || "",
      description: "",
      date: new Date(),
      fixedExpenseId: "",
    };
  }, [editingTransaction, preloadFixedExpenseId, categories, fixedExpenses]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(CashflowTransactionSchema) as any,
    defaultValues,
  });

  const transactionType = watch("type");
  const selectedCategoryId = watch("categoryId");
  const selectedPaymentMethod = watch("paymentMethod");

  // Mantener sincronizado el estado local de fecha con react-hook-form
  React.useEffect(() => {
    if (isOpen) {
      const initialDate = defaultValues.date;
      setDate(initialDate);
      setValue("date", initialDate);
      
      const initialAmount = defaultValues.amount;
      setAmountDisplay(initialAmount > 0 ? formatPrice(initialAmount.toString()) : "");
      
      reset(defaultValues);
    }
  }, [isOpen, defaultValues, reset, setValue]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Hardcodear a mediodía local para evitar problemas con desfase de zona horaria UTC
      const adjustedDate = new Date(selectedDate);
      adjustedDate.setHours(12, 0, 0, 0);
      setDate(adjustedDate);
      setValue("date", adjustedDate);
    }
  };

  const onFormSubmit = (values: FormValues) => {
    startTransition(async () => {
      let res;
      if (editingTransaction) {
        res = await updateCashflowTransaction(editingTransaction.id, values);
      } else {
        res = await createCashflowTransaction(values);
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

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || isCategoryPending) return;

    setIsCategoryPending(true);
    try {
      const res = await createCashflowCategory({ name: newCategoryName });
      if (res.success && res.category) {
        toast.success(res.success);
        setValue("categoryId", res.category.id);
        setNewCategoryName("");
        setIsAddingCategory(false);
      } else {
        toast.error(res.error || "No se pudo crear la categoría.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de red al crear la categoría.");
    } finally {
      setIsCategoryPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {editingTransaction
              ? "Editar Movimiento de Caja"
              : preloadFixedExpenseId
              ? "Registrar Pago de Gasto Fijo"
              : "Registrar Movimiento de Caja"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          {/* TIPO DE MOVIMIENTO */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              disabled={!!preloadFixedExpenseId} // No se puede cambiar a ingreso si viene de gasto fijo
              onClick={() => setValue("type", "INFLOW")}
              className={cn(
                "py-1.5 text-sm font-medium rounded-md transition-all",
                transactionType === "INFLOW"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Ingreso (Entrada)
            </button>
            <button
              type="button"
              disabled={!!preloadFixedExpenseId}
              onClick={() => setValue("type", "OUTFLOW")}
              className={cn(
                "py-1.5 text-sm font-medium rounded-md transition-all",
                transactionType === "OUTFLOW"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Egreso (Salida)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* MONTO */}
            <div className="space-y-1">
              <Label htmlFor="amount">Monto ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  type="text"
                  placeholder="0"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  onBlur={() => {
                    const cleanValue = cleanPriceValue(amountDisplay);
                    setValue("amount", cleanValue ? parseFloat(cleanValue) : 0);
                  }}
                  className="pl-7"
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* FECHA */}
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "dd/MM/yyyy", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>
          </div>

          {/* CAJA / METODO DE PAGO */}
          <div className="space-y-1">
            <Label htmlFor="paymentMethod">Caja / Forma de Pago</Label>
            <Select
              value={selectedPaymentMethod}
              onValueChange={(val: "CASH" | "TRANSFER" | "CARD") =>
                setValue("paymentMethod", val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná la caja/método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Efectivo (Caja Física)</SelectItem>
                <SelectItem value="TRANSFER">Transferencia / Débito</SelectItem>
                <SelectItem value="CARD">Tarjeta de Crédito</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentMethod && (
              <p className="text-xs text-destructive">
                {errors.paymentMethod.message}
              </p>
            )}
          </div>

          {/* CATEGORIA */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="categoryId">Categoría</Label>
              {!isAddingCategory ? (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs gap-1"
                  onClick={() => setIsAddingCategory(true)}
                >
                  <Plus className="w-3 h-3" /> Nueva categoría
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs text-muted-foreground"
                  onClick={() => setIsAddingCategory(false)}
                >
                  Cancelar
                </Button>
              )}
            </div>

            {isAddingCategory ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Ej. Insumos Especiales"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 h-9"
                  disabled={isCategoryPending}
                />
                <Button
                  type="button"
                  onClick={handleAddCategorySubmit}
                  className="h-9 px-3"
                  disabled={isCategoryPending || !newCategoryName.trim()}
                >
                  {isCategoryPending ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    "Agregar"
                  )}
                </Button>
              </div>
            ) : (
              <Select
                value={selectedCategoryId}
                onValueChange={(val) => setValue("categoryId", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.categoryId && (
              <p className="text-xs text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          {/* DESCRIPCION */}
          <div className="space-y-1">
            <Label htmlFor="description">Descripción / Detalle</Label>
            <Textarea
              id="description"
              placeholder="Ej. Compra de café Juan Valdez y leche de almendras para clientes."
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
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
              {isPending && <Loader className="w-4 h-4 animate-spin mr-2" />}
              {editingTransaction ? "Guardar Cambios" : "Registrar Movimiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
