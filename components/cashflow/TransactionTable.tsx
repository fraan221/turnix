"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Edit2, Trash2, ArrowUpRight, ArrowDownLeft, Tag, HelpCircle } from "lucide-react";
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
import { deleteCashflowTransaction } from "@/actions/cashflow.actions";

interface Transaction {
  id: string;
  amount: number;
  type: "INFLOW" | "OUTFLOW";
  paymentMethod: "CASH" | "TRANSFER" | "CARD";
  categoryId: string;
  description: string | null;
  date: Date;
  fixedExpenseId: string | null;
  category: { id: string; name: string };
  createdBy: { name: string };
  fixedExpense: { id: string; name: string } | null;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDeleteSuccess: () => void;
}

const PAYMENT_METHOD_LABELS = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
};

export default function TransactionTable({
  transactions,
  onEdit,
  onDeleteSuccess,
}: TransactionTableProps) {
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteCashflowTransaction(id);
      if (res.success) {
        toast.success(res.success);
        onDeleteSuccess();
      } else {
        toast.error(res.error || "No se pudo eliminar el movimiento.");
      }
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg">
        <HelpCircle className="w-8 h-8 text-muted-foreground mb-2" />
        <h4 className="font-medium text-muted-foreground">No hay movimientos registrados</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Podés registrar tus entradas y salidas de caja usando el botón "Registrar Movimiento".
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="max-w-[200px]">Descripción</TableHead>
            <TableHead>Caja / Método</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="font-medium">
                {format(new Date(tx.date), "dd/MM/yyyy", { locale: es })}
              </TableCell>
              <TableCell>
                {tx.type === "INFLOW" ? (
                  <Badge variant="outline" className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 gap-1 font-medium">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Ingreso</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 gap-1 font-medium">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Egreso</span>
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{tx.category?.name || "Otros"}</span>
                  {tx.fixedExpense && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Gasto Fijo
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground" title={tx.description || ""}>
                {tx.description || <span className="italic text-muted-foreground/50">Sin descripción</span>}
              </TableCell>
              <TableCell className="text-sm">
                {PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod}
              </TableCell>
              <TableCell className={`text-right font-semibold ${tx.type === "INFLOW" ? "text-emerald-600" : "text-red-600"}`}>
                {tx.type === "INFLOW" ? "+" : "-"} {formatPrice(tx.amount)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(tx)}
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
                        <AlertDialogTitle>¿Confirmás la eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará de forma permanente el movimiento de caja de tu balance.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(tx.id)}
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
