"use server";

import { getUserForSettings } from "@/lib/data";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  CashflowCategorySchema,
  CashflowTransactionSchema,
  FixedExpenseSchema,
} from "@/lib/schemas";
import { Role, PaymentMethod, CashflowType } from "@prisma/client";
import {
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  getAllTimeStart,
} from "@/lib/date-helpers";

type TransactionInput = z.infer<typeof CashflowTransactionSchema>;
type CategoryInput = z.infer<typeof CashflowCategorySchema>;
type FixedExpenseInput = z.infer<typeof FixedExpenseSchema>;

function getFirstValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message || "Los datos ingresados no son válidos.";
}

function getDateRange(period: string) {
  const now = new Date();
  switch (period) {
    case "day":
      return { startDate: getStartOfDay(now), endDate: getEndOfDay(now) };
    case "week":
      return { startDate: getStartOfWeek(now), endDate: getEndOfWeek(now) };
    case "month":
      return { startDate: getStartOfMonth(now), endDate: getEndOfMonth(now) };
    case "quarter": {
      const start = getStartOfMonth(new Date(now));
      start.setMonth(start.getMonth() - 2);
      return { startDate: start, endDate: getEndOfDay(now) };
    }
    case "year":
      return { startDate: getStartOfYear(now), endDate: getEndOfYear(now) };
    case "all":
      return { startDate: getAllTimeStart(), endDate: getEndOfDay(now) };
    default:
      return { startDate: getStartOfMonth(now), endDate: getEndOfMonth(now) };
  }
}

// ----------------------------------------------------
// DEFAULT CATEGORIES INITIALIZER
// ----------------------------------------------------
const DEFAULT_CATEGORIES = [
  "Alquiler",
  "Servicios",
  "Insumos",
  "Personal",
  "Impuestos",
  "Otros",
];

async function ensureDefaultCategories(barbershopId: string) {
  const count = await prisma.cashflowCategory.count({
    where: { barbershopId },
  });

  if (count === 0) {
    const data = DEFAULT_CATEGORIES.map((name) => ({
      name,
      barbershopId,
    }));
    await prisma.cashflowCategory.createMany({ data });
  }
}

// ----------------------------------------------------
// GET DATA CONSOLIDATED
// ----------------------------------------------------
export async function getCashflowData(period: string = "month") {
  const user = await getUserForSettings();
  if (!user || user.role !== Role.OWNER) {
    return { error: "No autorizado." };
  }

  const barbershopId = user.ownedBarbershop?.id;
  if (!barbershopId) {
    return { error: "No asociado a una barbería." };
  }

  try {
    // 1. Asegurar que existan las categorías por defecto
    await ensureDefaultCategories(barbershopId);

    const { startDate, endDate } = getDateRange(period);

    // 2. Fetch categories
    const categories = await prisma.cashflowCategory.findMany({
      where: { barbershopId },
      orderBy: { name: "asc" },
    });

    // 3. Fetch Bookings completados (Ingresos por Turnos)
    const bookings = await prisma.booking.findMany({
      where: {
        barbershopId,
        status: "COMPLETED",
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        priceAtBooking: true,
        paymentMethod: true,
      },
    });

    // 4. Fetch Manual Transactions (Caja)
    const transactions = await prisma.cashflowTransaction.findMany({
      where: {
        barbershopId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
        createdBy: {
          select: { name: true },
        },
        fixedExpense: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // 5. Fetch Fixed Expenses configured
    const fixedExpenses = await prisma.fixedExpense.findMany({
      where: { barbershopId },
      orderBy: { name: "asc" },
    });

    // Calcular montos por método de pago para turnos (Ingresos Automáticos)
    let bookingIncome = 0;
    const bookingIncomeByMethod = {
      CASH: { count: 0, total: 0 },
      TRANSFER: { count: 0, total: 0 },
      CARD: { count: 0, total: 0 },
    };

    bookings.forEach((b) => {
      const price = b.priceAtBooking || 0;
      bookingIncome += price;
      if (b.paymentMethod && bookingIncomeByMethod[b.paymentMethod]) {
        bookingIncomeByMethod[b.paymentMethod].count++;
        bookingIncomeByMethod[b.paymentMethod].total += price;
      }
    });

    // Calcular montos manuales
    let manualInflow = 0;
    let manualOutflow = 0;

    const manualInflowByMethod = {
      CASH: { count: 0, total: 0 },
      TRANSFER: { count: 0, total: 0 },
      CARD: { count: 0, total: 0 },
    };

    const manualOutflowByMethod = {
      CASH: { count: 0, total: 0 },
      TRANSFER: { count: 0, total: 0 },
      CARD: { count: 0, total: 0 },
    };

    const expensesByCategory: Record<string, { categoryName: string; total: number; count: number }> = {};
    categories.forEach((cat) => {
      expensesByCategory[cat.id] = { categoryName: cat.name, total: 0, count: 0 };
    });

    transactions.forEach((tx) => {
      const amt = tx.amount;
      if (tx.type === CashflowType.INFLOW) {
        manualInflow += amt;
        if (manualInflowByMethod[tx.paymentMethod]) {
          manualInflowByMethod[tx.paymentMethod].count++;
          manualInflowByMethod[tx.paymentMethod].total += amt;
        }
      } else {
        manualOutflow += amt;
        if (manualOutflowByMethod[tx.paymentMethod]) {
          manualOutflowByMethod[tx.paymentMethod].count++;
          manualOutflowByMethod[tx.paymentMethod].total += amt;
        }
        if (expensesByCategory[tx.categoryId]) {
          expensesByCategory[tx.categoryId].total += amt;
          expensesByCategory[tx.categoryId].count++;
        } else {
          // Si por alguna razón la categoría no está en la lista inicial
          expensesByCategory[tx.categoryId] = {
            categoryName: tx.category?.name || "Desconocido",
            total: amt,
            count: 1,
          };
        }
      }
    });

    // Para saber si está pago, usamos el rango del período seleccionado,
    // a menos que sea un período amplio (trimestre, año, todo), en cuyo caso usamos el mes calendario actual.
    const isWiderPeriod = period === "quarter" || period === "year" || period === "all";
    const paymentStart = isWiderPeriod ? getStartOfMonth(new Date()) : startDate;
    const paymentEnd = isWiderPeriod ? getEndOfMonth(new Date()) : endDate;

    // Buscamos transacciones vinculadas a FixedExpense en el rango correspondiente
    const currentPeriodPayments = await prisma.cashflowTransaction.findMany({
      where: {
        barbershopId,
        fixedExpenseId: { not: null },
        date: {
          gte: paymentStart,
          lte: paymentEnd,
        },
      },
      select: {
        fixedExpenseId: true,
      },
    });

    const paidFixedExpenseIds = new Set(
      currentPeriodPayments.map((p) => p.fixedExpenseId).filter(Boolean)
    );

    const fixedExpensesWithStatus = fixedExpenses.map((fe) => {
      const isPaid = paidFixedExpenseIds.has(fe.id);
      const isPending = !isPaid && fe.active && paymentEnd >= fe.startDate;

      let status: "PAID" | "PENDING" | "INACTIVE" = "INACTIVE";
      if (fe.active) {
        status = isPaid ? "PAID" : "PENDING";
      }

      return {
        ...fe,
        status,
      };
    });

    return {
      // Ingresos Totales
      totalIncome: bookingIncome + manualInflow,
      bookingIncome,
      manualInflow,
      
      // Ingresos por método de pago consolidado (Booking + Manual)
      incomeByMethod: {
        CASH: bookingIncomeByMethod.CASH.total + manualInflowByMethod.CASH.total,
        TRANSFER: bookingIncomeByMethod.TRANSFER.total + manualInflowByMethod.TRANSFER.total,
        CARD: bookingIncomeByMethod.CARD.total + manualInflowByMethod.CARD.total,
      },

      // Egresos Totales
      totalExpenses: manualOutflow,
      expensesByCategory: Object.values(expensesByCategory).filter((x) => x.total > 0),
      
      // Egresos por método de pago
      expensesByMethod: {
        CASH: manualOutflowByMethod.CASH.total,
        TRANSFER: manualOutflowByMethod.TRANSFER.total,
        CARD: manualOutflowByMethod.CARD.total,
      },

      // Balance
      netBalance: (bookingIncome + manualInflow) - manualOutflow,

      // Listas de datos
      categories,
      transactions,
      fixedExpenses: fixedExpensesWithStatus,
    };
  } catch (error) {
    console.error("Error al obtener datos de caja:", error);
    return { error: "No se pudieron obtener los datos de flujo de caja." };
  }
}

// ----------------------------------------------------
// TRANSACTION ACTIONS
// ----------------------------------------------------
export async function createCashflowTransaction(data: TransactionInput) {
  const user = await getUserForSettings();
  if (!user || user.role !== Role.OWNER) {
    return { error: "No autorizado." };
  }

  const barbershopId = user.ownedBarbershop?.id;
  if (!barbershopId) {
    return { error: "No asociado a una barbería." };
  }

  const validated = CashflowTransactionSchema.safeParse(data);
  if (!validated.success) {
    return { error: getFirstValidationMessage(validated.error) };
  }

  const { amount, type, paymentMethod, categoryId, description, date, fixedExpenseId } = validated.data;

  try {
    // Verificar que la categoría pertenece a esta barbería
    const categoryExists = await prisma.cashflowCategory.findFirst({
      where: { id: categoryId, barbershopId },
    });

    if (!categoryExists) {
      return { error: "Categoría de transacción inválida." };
    }

    // Si hay un fixedExpenseId, verificarlo también
    if (fixedExpenseId) {
      const fixedExpenseExists = await prisma.fixedExpense.findFirst({
        where: { id: fixedExpenseId, barbershopId },
      });
      if (!fixedExpenseExists) {
        return { error: "Compromiso de gasto fijo inválido." };
      }
    }

    await prisma.cashflowTransaction.create({
      data: {
        amount,
        type: type as CashflowType,
        paymentMethod: paymentMethod as PaymentMethod,
        categoryId,
        description: description || null,
        date: new Date(date),
        fixedExpenseId: fixedExpenseId || null,
        barbershopId,
        createdById: user.id,
      },
    });

    revalidatePath("/dashboard/cashflow");
    return { success: "Movimiento de caja registrado con éxito." };
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    return { error: "No se pudo registrar el movimiento de caja." };
  }
}

export async function updateCashflowTransaction(id: string, data: TransactionInput) {
  const user = await getUserForSettings();
  if (!user || user.role !== Role.OWNER) {
    return { error: "No autorizado." };
  }

  const barbershopId = user.ownedBarbershop?.id;
  if (!barbershopId) {
    return { error: "No asociado a una barbería." };
  }

  const validated = CashflowTransactionSchema.safeParse(data);
  if (!validated.success) {
    return { error: getFirstValidationMessage(validated.error) };
  }

  const { amount, type, paymentMethod, categoryId, description, date, fixedExpenseId } = validated.data;

  try {
    const existing = await prisma.cashflowTransaction.findFirst({
      where: { id, barbershopId },
    });

    if (!existing) {
      return { error: "Movimiento no encontrado." };
    }

    // Verificar categoría
    const categoryExists = await prisma.cashflowCategory.findFirst({
      where: { id: categoryId, barbershopId },
    });

    if (!categoryExists) {
      return { error: "Categoría inválida." };
    }

    await prisma.cashflowTransaction.update({
      where: { id },
      data: {
        amount,
        type: type as CashflowType,
        paymentMethod: paymentMethod as PaymentMethod,
        categoryId,
        description: description || null,
        date: new Date(date),
        fixedExpenseId: fixedExpenseId || null,
      },
    });

    revalidatePath("/dashboard/cashflow");
    return { success: "Movimiento de caja actualizado con éxito." };
  } catch (error) {
    console.error("Error al actualizar movimiento:", error);
    return { error: "No se pudo actualizar el movimiento de caja." };
  }
}

export async function deleteCashflowTransaction(id: string) {
  const user = await getUserForSettings();
  if (!user || user.role !== Role.OWNER) {
    return { error: "No autorizado." };
  }

  const barbershopId = user.ownedBarbershop?.id;
  if (!barbershopId) {
    return { error: "No asociado a una barbería." };
  }

  try {
    const existing = await prisma.cashflowTransaction.findFirst({
      where: { id, barbershopId },
    });

    if (!existing) {
      return { error: "Movimiento no encontrado." };
    }

    await prisma.cashflowTransaction.delete({
      where: { id },
    });

    revalidatePath("/dashboard/cashflow");
    return { success: "Movimiento de caja eliminado con éxito." };
  } catch (error) {
    console.error("Error al eliminar movimiento:", error);
    return { error: "No se pudo eliminar el movimiento de caja." };
  }
}

// ----------------------------------------------------
// CATEGORY ACTIONS
// ----------------------------------------------------
export async function createCashflowCategory(data: CategoryInput) {
  const user = await getUserForSettings();
  if (!user || user.role !== Role.OWNER) {
    return { error: "No autorizado." };
  }

  const barbershopId = user.ownedBarbershop?.id;
  if (!barbershopId) {
    return { error: "No asociado a una barbería." };
  }

  const validated = CashflowCategorySchema.safeParse(data);
  if (!validated.success) {
    return { error: getFirstValidationMessage(validated.error) };
  }

  const name = validated.data.name.trim();

  try {
    // Evitar duplicados insensibles a mayúsculas/minúsculas para la misma barbería
    const existing = await prisma.cashflowCategory.findFirst({
      where: {
        barbershopId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return { error: "Ya existe una categoría con ese nombre." };
    }

    const category = await prisma.cashflowCategory.create({
      data: {
        name,
        barbershopId,
      },
    });

    revalidatePath("/dashboard/cashflow");
    return { success: "Categoría creada con éxito.", category };
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return { error: "No se pudo crear la categoría." };
  }
}

export async function deleteCashflowCategory(id: string) {
  const user = await getUserForSettings();
  if (!user || user.role !== Role.OWNER) {
    return { error: "No autorizado." };
  }

  const barbershopId = user.ownedBarbershop?.id;
  if (!barbershopId) {
    return { error: "No asociado a una barbería." };
  }

  try {
    const existing = await prisma.cashflowCategory.findFirst({
      where: { id, barbershopId },
    });

    if (!existing) {
      return { error: "Categoría no encontrada." };
    }

    // Verificar si hay transacciones vinculadas
    const connectedTx = await prisma.cashflowTransaction.count({
      where: { categoryId: id },
    });

    if (connectedTx > 0) {
      return {
        error:
          "No se puede eliminar la categoría porque tiene movimientos asociados. Mové o eliminá esos movimientos primero.",
      };
    }

    await prisma.cashflowCategory.delete({
      where: { id },
    });

    revalidatePath("/dashboard/cashflow");
    return { success: "Categoría eliminada con éxito." };
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    return { error: "No se pudo eliminar la categoría." };
  }
}

// ----------------------------------------------------
// FIXED EXPENSE ACTIONS
// ----------------------------------------------------
export async function createFixedExpense(data: FixedExpenseInput) {
  const user = await getUserForSettings();
  if (!user || user.role !== Role.OWNER) {
    return { error: "No autorizado." };
  }

  const barbershopId = user.ownedBarbershop?.id;
  if (!barbershopId) {
    return { error: "No asociado a una barbería." };
  }

  const validated = FixedExpenseSchema.safeParse(data);
  if (!validated.success) {
    return { error: getFirstValidationMessage(validated.error) };
  }

  const { name, amount, startDate, active } = validated.data;

  try {
    const fixedExpense = await prisma.fixedExpense.create({
      data: {
        name,
        amount,
        startDate: new Date(startDate),
        active,
        barbershopId,
      },
    });

    revalidatePath("/dashboard/cashflow");
    return { success: "Compromiso de gasto fijo configurado con éxito.", fixedExpense };
  } catch (error) {
    console.error("Error al crear gasto fijo:", error);
    return { error: "No se pudo crear el gasto fijo." };
  }
}

export async function updateFixedExpense(id: string, data: FixedExpenseInput) {
  const user = await getUserForSettings();
  if (!user || user.role !== Role.OWNER) {
    return { error: "No autorizado." };
  }

  const barbershopId = user.ownedBarbershop?.id;
  if (!barbershopId) {
    return { error: "No asociado a una barbería." };
  }

  const validated = FixedExpenseSchema.safeParse(data);
  if (!validated.success) {
    return { error: getFirstValidationMessage(validated.error) };
  }

  const { name, amount, startDate, active } = validated.data;

  try {
    const existing = await prisma.fixedExpense.findFirst({
      where: { id, barbershopId },
    });

    if (!existing) {
      return { error: "Gasto fijo no encontrado." };
    }

    await prisma.fixedExpense.update({
      where: { id },
      data: {
        name,
        amount,
        startDate: new Date(startDate),
        active,
      },
    });

    revalidatePath("/dashboard/cashflow");
    return { success: "Gasto fijo actualizado con éxito." };
  } catch (error) {
    console.error("Error al actualizar gasto fijo:", error);
    return { error: "No se pudo actualizar el gasto fijo." };
  }
}

export async function deleteFixedExpense(id: string) {
  const user = await getUserForSettings();
  if (!user || user.role !== Role.OWNER) {
    return { error: "No autorizado." };
  }

  const barbershopId = user.ownedBarbershop?.id;
  if (!barbershopId) {
    return { error: "No asociado a una barbería." };
  }

  try {
    const existing = await prisma.fixedExpense.findFirst({
      where: { id, barbershopId },
    });

    if (!existing) {
      return { error: "Gasto fijo no encontrado." };
    }

    await prisma.fixedExpense.delete({
      where: { id },
    });

    revalidatePath("/dashboard/cashflow");
    return { success: "Gasto fijo eliminado con éxito." };
  } catch (error) {
    console.error("Error al eliminar gasto fijo:", error);
    return { error: "No se pudo eliminar el gasto fijo." };
  }
}
