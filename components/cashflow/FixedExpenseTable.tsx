"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Edit2, Trash2, CreditCard, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { deleteFixedExpense } from "@/actions/cashflow.actions";

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  startDate: Date;
  active: boolean;
  status: "PAID" | "PENDING" | "INACTIVE";
}

interface FixedExpenseTableProps {
  fixedExpenses: FixedExpense[];
  onPay: (fe: FixedExpense) => void;
  onEdit: (fe: FixedExpense) => void;
  onDeleteSuccess: () => void;
}

export default function FixedExpenseTable({
  fixedExpenses,
  onPay,
  onEdit,
  onDeleteSuccess,
}: FixedExpenseTableProps) {
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteFixedExpense(id);
      if (res.success) {
        toast.success(res.success);
        onDeleteSuccess();
      } else {
        toast.error(res.error || "No se pudo eliminar el gasto fijo.");
      }
    });
  };

  if (fixedExpenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg">
        <HelpCircle className="w-8 h-8 text-muted-foreground mb-2" />
        <h4 className="font-medium text-muted-foreground">No hay gastos fijos configurados</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Configurá tus gastos recurrentes (ej. Alquiler, Luz) para controlarlos mes a mes y pagarlos desde acá.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Desde</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fixedExpenses.map((fe) => (
            <TableRow key={fe.id}>
              {/* ITEM */}
              <TableCell className="font-semibold text-foreground">
                {fe.name}
              </TableCell>

              {/* MONTO */}
              <TableCell className="font-medium">
                {formatPrice(fe.amount)}
              </TableCell>

              {/* DESDE */}
              <TableCell className="text-muted-foreground capitalize text-sm">
                {format(new Date(fe.startDate), "MMMM yyyy", { locale: es })}
              </TableCell>

              {/* ESTADO */}
              <TableCell>
                {fe.status === "PAID" ? (
                  <Badge variant="outline" className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PAGO</span>
                  </Badge>
                ) : fe.status === "PENDING" ? (
                  <Badge variant="outline" className="text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 gap-1 font-semibold animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>PENDIENTE</span>
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-muted-foreground bg-muted border-none font-medium">
                    <span>Inactivo</span>
                  </Badge>
                )}
              </TableCell>

              {/* ACCIONES */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    size="sm"
                    variant={fe.status === "PENDING" ? "default" : "outline"}
                    disabled={fe.status !== "PENDING" || isPending}
                    onClick={() => onPay(fe)}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{fe.status === "PAID" ? "Pagado" : "Pagar"}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(fe)}
                    disabled={isPending}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar compromiso de gasto fijo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esto borrará la configuración recurrente de "{fe.name}". Los pagos ya registrados en meses anteriores no se verán afectados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(fe.id)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
