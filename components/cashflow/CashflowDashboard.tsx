"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  RefreshCw,
  Tag,
  CreditCard,
  Briefcase,
  DollarSign,
  FileText,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PeriodDropdown } from "@/components/analytics/PeriodDropdown";
import { ExportReportDropdown } from "@/components/cashflow/ExportReportDropdown";
import TransactionForm from "@/components/cashflow/TransactionForm";
import TransactionTable from "@/components/cashflow/TransactionTable";
import FixedExpenseForm from "@/components/cashflow/FixedExpenseForm";
import FixedExpenseTable from "@/components/cashflow/FixedExpenseTable";
import CategoryManager from "@/components/cashflow/CategoryManager";
import { formatPrice, cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: "INFLOW" | "OUTFLOW";
  paymentMethod: "CASH" | "TRANSFER" | "CARD";
  categoryId: string;
  description: string | null;
  date: Date;
  fixedExpenseId: string | null;
  category: Category;
  createdBy: { name: string };
  fixedExpense: { id: string; name: string } | null;
}

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  startDate: Date;
  active: boolean;
  status: "PAID" | "PENDING" | "INACTIVE";
}

interface CashflowDashboardData {
  totalIncome: number;
  bookingIncome: number;
  manualInflow: number;
  incomeByMethod: {
    CASH: number;
    TRANSFER: number;
    CARD: number;
  };
  totalExpenses: number;
  expensesByCategory: {
    categoryName: string;
    total: number;
    count: number;
  }[];
  expensesByMethod: {
    CASH: number;
    TRANSFER: number;
    CARD: number;
  };
  netBalance: number;
  categories: Category[];
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
}

interface CashflowDashboardProps {
  initialData: CashflowDashboardData;
  period: string;
  customDate?: string;
}

const periodDescriptions: Record<string, string> = {
  day: "hoy",
  yesterday: "ayer",
  week: "esta semana",
  month: "este mes",
  lastMonth: "el mes pasado",
  custom: "el día seleccionado",
  all: "historial completo",
};

export default function CashflowDashboard({
  initialData,
  period,
  customDate,
}: CashflowDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Modales
  const [isTransactionOpen, setIsTransactionOpen] = React.useState(false);
  const [isFixedExpenseOpen, setIsFixedExpenseOpen] = React.useState(false);

  // Edición
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | undefined>(undefined);
  const [editingFixedExpense, setEditingFixedExpense] = React.useState<FixedExpense | undefined>(undefined);
  const [preloadFixedExpenseId, setPreloadFixedExpenseId] = React.useState<string | undefined>(undefined);

  const handlePeriodChange = (newPeriod: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", newPeriod);
    params.delete("date");
    router.push(`/dashboard/cashflow?${params.toString()}`);
  };

  const handleCustomDateChange = (date: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    params.set("date", date);
    router.push(`/dashboard/cashflow?${params.toString()}`);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleOpenNewTransaction = () => {
    setEditingTransaction(undefined);
    setPreloadFixedExpenseId(undefined);
    setIsTransactionOpen(true);
  };

  const handleOpenEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setPreloadFixedExpenseId(undefined);
    setIsTransactionOpen(true);
  };

  const handleOpenPayFixedExpense = (fe: FixedExpense) => {
    setEditingTransaction(undefined);
    setPreloadFixedExpenseId(fe.id);
    setIsTransactionOpen(true);
  };

  const handleOpenNewFixedExpense = () => {
    setEditingFixedExpense(undefined);
    setIsFixedExpenseOpen(true);
  };

  const handleOpenEditFixedExpense = (fe: FixedExpense) => {
    setEditingFixedExpense(fe);
    setIsFixedExpenseOpen(true);
  };

  return (
    <div className="mx-auto space-y-6 max-w-7xl">
      {/* Barra de herramientas integrada */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/60">
        <div className="text-sm font-medium text-muted-foreground">
          Resumen de caja y transacciones
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <PeriodDropdown
            currentPeriod={period as any}
            onPeriodChange={handlePeriodChange}
            customDate={customDate}
            onCustomDateChange={handleCustomDateChange}
          />
          <ExportReportDropdown currentPeriod={period} customDate={customDate} />
          <Button variant="outline" size="icon" onClick={handleRefresh} className="shrink-0" title="Actualizar datos">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* TARJETAS RESUMEN PERSONALIZADAS (DISEÑO PREMIUM) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* INGRESOS */}
        <div className="relative overflow-hidden rounded-xl border bg-card/65 backdrop-blur-sm p-6 hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.04)] transition-all duration-300 group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300" />
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Total Ingresos</span>
            <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-100 dark:border-emerald-900/10 group-hover:scale-105 transition-all">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">{formatPrice(initialData.totalIncome)}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium leading-relaxed">
              Turnos ({formatPrice(initialData.bookingIncome)}) + Caja ({formatPrice(initialData.manualInflow)})
            </p>
          </div>
        </div>

        {/* EGRESOS */}
        <div className="relative overflow-hidden rounded-xl border bg-card/65 backdrop-blur-sm p-6 hover:border-rose-500/40 hover:shadow-[0_0_25px_rgba(244,63,94,0.04)] transition-all duration-300 group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-rose-500/5 blur-2xl group-hover:bg-rose-500/10 transition-all duration-300" />
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Total Egresos (Gastos)</span>
            <div className="rounded-lg p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-500 border border-rose-100 dark:border-rose-900/10 group-hover:scale-105 transition-all">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">{formatPrice(initialData.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium leading-relaxed">
              Egresos manuales cargados en {periodDescriptions[period] || period}
            </p>
          </div>
        </div>

        {/* BALANCE NETO */}
        <div className={cn(
          "relative overflow-hidden rounded-xl border bg-card/65 backdrop-blur-sm p-6 transition-all duration-300 group",
          initialData.netBalance >= 0 
            ? "hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.04)]" 
            : "hover:border-rose-500/40 hover:shadow-[0_0_25px_rgba(244,63,94,0.04)]"
        )}>
          <div className={cn(
            "absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full blur-2xl group-hover:opacity-100 opacity-60 transition-all duration-300",
            initialData.netBalance >= 0 ? "bg-emerald-500/5 group-hover:bg-emerald-500/10" : "bg-rose-500/5 group-hover:bg-rose-500/10"
          )} />
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Balance Neto</span>
            <div className={cn(
              "rounded-lg p-2 border transition-all group-hover:scale-105",
              initialData.netBalance >= 0 
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border-emerald-100 dark:border-emerald-900/10" 
                : "bg-rose-50 dark:bg-rose-950/20 text-rose-500 border-rose-100 dark:border-rose-900/10"
            )}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className={cn(
              "text-2xl font-bold",
              initialData.netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {formatPrice(initialData.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium leading-relaxed">
              Diferencia total (Ingresos - Egresos)
            </p>
          </div>
        </div>
      </div>

      {/* PESTAÑAS PRINCIPALES */}
      <Tabs defaultValue="movements" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="balance">Resumen</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="fixed-expenses">Gastos Fijos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
        </TabsList>

        {/* CONTENIDO 1: RESUMEN / BALANCE */}
        <TabsContent value="balance" className="space-y-6">
          {(() => {
            const totalIncomeByMethod = 
              initialData.incomeByMethod.CASH + 
              initialData.incomeByMethod.TRANSFER + 
              initialData.incomeByMethod.CARD;
            const cashIncPct = totalIncomeByMethod > 0 ? (initialData.incomeByMethod.CASH / totalIncomeByMethod) * 100 : 0;
            const transIncPct = totalIncomeByMethod > 0 ? (initialData.incomeByMethod.TRANSFER / totalIncomeByMethod) * 100 : 0;
            const cardIncPct = totalIncomeByMethod > 0 ? (initialData.incomeByMethod.CARD / totalIncomeByMethod) * 100 : 0;

            const totalExpensesByMethod = 
              initialData.expensesByMethod.CASH + 
              initialData.expensesByMethod.TRANSFER + 
              initialData.expensesByMethod.CARD;
            const cashExpPct = totalExpensesByMethod > 0 ? (initialData.expensesByMethod.CASH / totalExpensesByMethod) * 100 : 0;
            const transExpPct = totalExpensesByMethod > 0 ? (initialData.expensesByMethod.TRANSFER / totalExpensesByMethod) * 100 : 0;
            const cardExpPct = totalExpensesByMethod > 0 ? (initialData.expensesByMethod.CARD / totalExpensesByMethod) * 100 : 0;

            const totalCategoryExpenses = initialData.expensesByCategory.reduce((sum, cat) => sum + cat.total, 0);

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* INGRESOS POR MEDIO DE PAGO */}
                <Card className="bg-card/65 backdrop-blur-sm border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span>Ingresos por Medio de Pago</span>
                    </CardTitle>
                    <CardDescription>Consolidado por método de cobro.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* CASH */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          Efectivo
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatPrice(initialData.incomeByMethod.CASH)}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1.5 font-normal">({cashIncPct.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${cashIncPct}%` }} />
                      </div>
                    </div>

                    {/* TRANSFER */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          Transferencia / Débito
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatPrice(initialData.incomeByMethod.TRANSFER)}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1.5 font-normal">({transIncPct.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${transIncPct}%` }} />
                      </div>
                    </div>

                    {/* CARD */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          Tarjeta de Crédito
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatPrice(initialData.incomeByMethod.CARD)}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1.5 font-normal">({cardIncPct.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${cardIncPct}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* EGRESOS POR MEDIO DE PAGO */}
                <Card className="bg-card/65 backdrop-blur-sm border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                      <span>Egresos por Medio de Pago</span>
                    </CardTitle>
                    <CardDescription>Medios utilizados para saldar gastos.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* CASH */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          Efectivo
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {formatPrice(initialData.expensesByMethod.CASH)}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1.5 font-normal">({cashExpPct.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${cashExpPct}%` }} />
                      </div>
                    </div>

                    {/* TRANSFER */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          Transferencia / Débito
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {formatPrice(initialData.expensesByMethod.TRANSFER)}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1.5 font-normal">({transExpPct.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${transExpPct}%` }} />
                      </div>
                    </div>

                    {/* CARD */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          Tarjeta de Crédito
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {formatPrice(initialData.expensesByMethod.CARD)}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1.5 font-normal">({cardExpPct.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${cardExpPct}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* EGRESOS POR CATEGORIA */}
                <Card className="md:col-span-2 bg-card/65 backdrop-blur-sm border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" />
                      <span>Desglose de Gastos por Categoría</span>
                    </CardTitle>
                    <CardDescription>Gastos acumulados por rubro en el período.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {initialData.expensesByCategory.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay gastos registrados en este período.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {initialData.expensesByCategory.map((cat, idx) => {
                          const catPct = totalCategoryExpenses > 0 ? (cat.total / totalCategoryExpenses) * 100 : 0;
                          return (
                            <div key={idx} className="p-4 border rounded-xl bg-card/50 hover:border-primary/20 hover:shadow-sm transition-all duration-200 space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block truncate max-w-[150px]">
                                  {cat.categoryName}
                                </span>
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {cat.count} {cat.count === 1 ? "gasto" : "gastos"}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="text-lg font-bold text-red-600">
                                  {formatPrice(cat.total)}
                                </div>
                                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${catPct}%` }} />
                                </div>
                                <div className="text-[10px] text-muted-foreground flex justify-between">
                                  <span>Proporción</span>
                                  <span>{catPct.toFixed(0)}% del total</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </TabsContent>

        {/* CONTENIDO 2: MOVIMIENTOS */}
        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Historial de Movimientos</CardTitle>
                <CardDescription>
                  Listado de entradas y salidas manuales registradas en caja.
                </CardDescription>
              </div>
              <Button onClick={handleOpenNewTransaction} className="gap-1 text-xs">
                <Plus className="w-4 h-4" />
                <span>Registrar Movimiento</span>
              </Button>
            </CardHeader>
            <CardContent>
              <TransactionTable
                transactions={initialData.transactions}
                onEdit={handleOpenEditTransaction}
                onDeleteSuccess={handleRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTENIDO 3: GASTOS FIJOS */}
        <TabsContent value="fixed-expenses" className="space-y-6">
          {(() => {
            const activeFixedExpenses = initialData.fixedExpenses.filter(fe => fe.active);
            const paidFixedExpenses = activeFixedExpenses.filter(fe => fe.status === "PAID");
            const pendingFixedExpenses = activeFixedExpenses.filter(fe => fe.status === "PENDING");
            
            const totalFixedAmount = activeFixedExpenses.reduce((sum, fe) => sum + fe.amount, 0);
            const paidFixedAmount = paidFixedExpenses.reduce((sum, fe) => sum + fe.amount, 0);
            
            const paidPct = activeFixedExpenses.length > 0 ? (paidFixedExpenses.length / activeFixedExpenses.length) * 100 : 0;
            const paidAmountPct = totalFixedAmount > 0 ? (paidFixedAmount / totalFixedAmount) * 100 : 0;

            return (
              <div className="space-y-6">
                {activeFixedExpenses.length > 0 && (
                  <Card className="bg-card/65 backdrop-blur-sm border shadow-sm">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Estado de Compromisos</span>
                          <h3 className="text-lg font-bold text-foreground">
                            {paidFixedExpenses.length} de {activeFixedExpenses.length} pagados
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {pendingFixedExpenses.length === 0 ? "¡Todo al día este mes!" : `Faltan registrar ${pendingFixedExpenses.length} pagos.`}
                          </p>
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                            <span>Saldado: {formatPrice(paidFixedAmount)} de {formatPrice(totalFixedAmount)}</span>
                            <span>{paidAmountPct.toFixed(0)}%</span>
                          </div>
                          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${paidAmountPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-card/65 backdrop-blur-sm border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">Gastos Fijos Mensuales</CardTitle>
                      <CardDescription>
                        Definí tus costos fijos y controlá cuáles ya pagaste este mes.
                      </CardDescription>
                    </div>
                    <Button onClick={handleOpenNewFixedExpense} className="gap-1 text-xs">
                      <Plus className="w-4 h-4" />
                      <span>Configurar Gasto Fijo</span>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <FixedExpenseTable
                      fixedExpenses={initialData.fixedExpenses}
                      onPay={handleOpenPayFixedExpense}
                      onEdit={handleOpenEditFixedExpense}
                      onDeleteSuccess={handleRefresh}
                    />
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </TabsContent>

        {/* CONTENIDO 4: CATEGORIAS */}
        <TabsContent value="categories" className="space-y-4">
          <CategoryManager
            categories={initialData.categories}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>

      {/* FORMULARIO DE MOVIMIENTO DE CAJA */}
      <TransactionForm
        categories={initialData.categories}
        fixedExpenses={initialData.fixedExpenses}
        isOpen={isTransactionOpen}
        onClose={() => {
          setIsTransactionOpen(false);
          setEditingTransaction(undefined);
          setPreloadFixedExpenseId(undefined);
        }}
        onSubmitSuccess={handleRefresh}
        editingTransaction={editingTransaction}
        preloadFixedExpenseId={preloadFixedExpenseId}
      />

      {/* FORMULARIO DE GASTOS FIJOS */}
      <FixedExpenseForm
        isOpen={isFixedExpenseOpen}
        onClose={() => {
          setIsFixedExpenseOpen(false);
          setEditingFixedExpense(undefined);
        }}
        onSubmitSuccess={handleRefresh}
        editingFixedExpense={editingFixedExpense}
      />
    </div>
  );
}
