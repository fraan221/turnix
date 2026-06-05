import { NextResponse } from "next/server";
import { getUserForSettings } from "@/lib/data";
import prisma from "@/lib/prisma";
import { Role, CashflowType, PaymentMethod } from "@prisma/client";
import { z } from "zod";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import {
  getDetailedBookingsForReport,
  getDateRangeForPeriod,
  formatPeriodLabel,
  formatPaymentMethod,
  Period,
} from "@/lib/reports";
import { formatPrice } from "@/lib/utils";
import { formatDate, formatTime, formatToDateInput } from "@/lib/date-helpers";

// Validaciones con Zod
const exportQuerySchema = z.object({
  format: z.enum(["xlsx", "pdf"]),
  period: z.enum(["day", "yesterday", "week", "month", "lastMonth", "custom", "all"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET(request: Request) {
  try {
    // 1. Auth check
    const user = await getUserForSettings();
    if (!user || user.role !== Role.OWNER || !user.ownedBarbershop) {
      return NextResponse.json(
        { error: "No autorizado. Se requiere perfil de dueño (OWNER)." },
        { status: 403 }
      );
    }

    const barbershop = user.ownedBarbershop;

    // 2. Validate query params
    const { searchParams } = new URL(request.url);
    const validatedParams = exportQuerySchema.safeParse({
      format: searchParams.get("format"),
      period: searchParams.get("period"),
      date: searchParams.get("date") || undefined,
    });

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: "Parámetros de consulta inválidos." },
        { status: 400 }
      );
    }

    const { format, period, date } = validatedParams.data;

    // 3. Obtener fechas, bookings y transacciones manuales
    const { startDate, endDate } = getDateRangeForPeriod(period, date);
    const bookings = await getDetailedBookingsForReport(
      barbershop.id,
      startDate,
      endDate
    );

    const transactions = await prisma.cashflowTransaction.findMany({
      where: {
        barbershopId: barbershop.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    const periodLabel = formatPeriodLabel(period, startDate, endDate);

    // Calcular resúmenes por forma de pago (Ingresos por Turnos)
    const bookingSummary = {
      CASH: { count: 0, total: 0 },
      TRANSFER: { count: 0, total: 0 },
      CARD: { count: 0, total: 0 },
    };

    bookings.forEach((b) => {
      const method = b.paymentMethod;
      const amount = b.amount;
      if (method === "CASH" || method === "TRANSFER" || method === "CARD") {
        bookingSummary[method].count++;
        bookingSummary[method].total += amount;
      }
    });

    // Calcular resúmenes por forma de pago (Movimientos Manuales)
    const manualInflowSummary = {
      CASH: { count: 0, total: 0 },
      TRANSFER: { count: 0, total: 0 },
      CARD: { count: 0, total: 0 },
    };

    const manualOutflowSummary = {
      CASH: { count: 0, total: 0 },
      TRANSFER: { count: 0, total: 0 },
      CARD: { count: 0, total: 0 },
    };

    transactions.forEach((t) => {
      const method = t.paymentMethod;
      const amount = t.amount;
      if (method === "CASH" || method === "TRANSFER" || method === "CARD") {
        if (t.type === CashflowType.INFLOW) {
          manualInflowSummary[method].count++;
          manualInflowSummary[method].total += amount;
        } else {
          manualOutflowSummary[method].count++;
          manualOutflowSummary[method].total += amount;
        }
      }
    });

    const totalBookingIncome = bookings.reduce((sum, b) => sum + b.amount, 0);
    const totalManualInflow = transactions
      .filter((t) => t.type === CashflowType.INFLOW)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalIncome = totalBookingIncome + totalManualInflow;
    const totalExpenses = transactions
      .filter((t) => t.type === CashflowType.OUTFLOW)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netBalance = totalIncome - totalExpenses;

    const formattedDate = formatToDateInput(new Date());
    const filename = `reporte-${barbershop.slug}-${period}-${formattedDate}.${format}`;

    // 4. Generar archivos
    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Turnix";
      workbook.lastModifiedBy = "Turnix";
      workbook.created = new Date();
      workbook.modified = new Date();

      // --- HOJA 1: RESUMEN FINANCIERO ---
      const sheetSummary = workbook.addWorksheet("Resumen Financiero");
      sheetSummary.mergeCells("A1:D1");
      sheetSummary.getCell("A1").value = `RESUMEN FINANCIERO - ${barbershop.name.toUpperCase()}`;
      sheetSummary.getCell("A1").font = { name: "Arial", size: 14, bold: true, color: { argb: "1E293B" } };
      sheetSummary.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

      sheetSummary.mergeCells("A2:D2");
      sheetSummary.getCell("A2").value = `Período: ${periodLabel} | Generado el ${formatDate(new Date())}`;
      sheetSummary.getCell("A2").font = { name: "Arial", size: 10, italic: true, color: { argb: "475569" } };
      sheetSummary.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

      sheetSummary.getRow(3).height = 15;

      // Tabla de Balance General
      sheetSummary.getRow(4).values = ["Concepto", "", "", "Monto"];
      sheetSummary.mergeCells("A4:C4");
      sheetSummary.getRow(4).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFF" } };
      sheetSummary.getRow(4).eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E293B" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });
      sheetSummary.columns = [
        { key: "concept", width: 35 },
        { key: "dummy1", width: 10 },
        { key: "dummy2", width: 10 },
        { key: "amount", width: 20 },
      ];

      const balanceData = [
        ["(+) Ingresos por Turnos Completados", totalBookingIncome],
        ["(+) Entradas Manuales de Caja", totalManualInflow],
        ["(=) TOTAL INGRESOS", totalIncome],
        ["(-) Egresos y Gastos de Caja", totalExpenses],
        ["(=) BALANCE NETO", netBalance],
      ];

      balanceData.forEach((rowVal, idx) => {
        const rowNum = 5 + idx;
        sheetSummary.mergeCells(`A${rowNum}:C${rowNum}`);
        const label = rowVal[0];
        sheetSummary.getCell(`A${rowNum}`).value = label;
        const isBold = typeof label === "string" && label.startsWith("(=)");
        sheetSummary.getCell(`A${rowNum}`).font = { name: "Arial", size: 10, bold: isBold };
        
        const amtCell = sheetSummary.getCell(`D${rowNum}`);
        amtCell.value = rowVal[1];
        amtCell.numFmt = '"$"#,##0';
        amtCell.alignment = { horizontal: "right" };
        amtCell.font = { name: "Arial", size: 10, bold: isBold };

        sheetSummary.getRow(rowNum).eachCell((cell) => {
          cell.border = {
            bottom: { style: isBold ? "medium" : "thin", color: { argb: "E2E8F0" } },
          };
          if (isBold) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
          }
        });
      });

      // Espaciador
      let nextRow = 11;
      sheetSummary.getRow(nextRow++).height = 15;

      // Desglose por Método de Pago
      sheetSummary.mergeCells(`A${nextRow}:D${nextRow}`);
      sheetSummary.getCell(`A${nextRow}`).value = "DESGLOSE POR MEDIO DE COBRO / CAJA";
      sheetSummary.getCell(`A${nextRow}`).font = { name: "Arial", size: 11, bold: true, color: { argb: "1E293B" } };
      nextRow++;

      sheetSummary.getRow(nextRow).values = ["Caja / Medio", "Ingresos", "Egresos", "Neto"];
      sheetSummary.getRow(nextRow).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFF" } };
      sheetSummary.getRow(nextRow).eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "475569" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });
      const headerRowIndex = nextRow;
      nextRow++;

      const methodRows = [
        [
          "Efectivo", 
          bookingSummary.CASH.total + manualInflowSummary.CASH.total, 
          manualOutflowSummary.CASH.total
        ],
        [
          "Transferencia", 
          bookingSummary.TRANSFER.total + manualInflowSummary.TRANSFER.total, 
          manualOutflowSummary.TRANSFER.total
        ],
        [
          "Tarjeta", 
          bookingSummary.CARD.total + manualInflowSummary.CARD.total, 
          manualOutflowSummary.CARD.total
        ],
      ];

      methodRows.forEach((rowVal, idx) => {
        const rowNum = nextRow + idx;
        const row = sheetSummary.getRow(rowNum);
        const inc = rowVal[1] as number;
        const exp = rowVal[2] as number;
        row.values = [
          rowVal[0],
          inc,
          exp,
          inc - exp,
        ];

        row.getCell(2).numFmt = '"$"#,##0';
        row.getCell(3).numFmt = '"$"#,##0';
        row.getCell(4).numFmt = '"$"#,##0';

        row.eachCell((cell) => {
          cell.font = { name: "Arial", size: 10 };
          cell.border = { bottom: { style: "thin", color: { argb: "E2E8F0" } } };
        });
      });

      // Total general del desglose
      const totalDesgloseRow = sheetSummary.getRow(nextRow + 3);
      totalDesgloseRow.getCell(1).value = "TOTAL CONSOLIDADO";
      totalDesgloseRow.getCell(1).font = { name: "Arial", size: 10, bold: true };
      
      totalDesgloseRow.getCell(2).value = { formula: `SUM(B${headerRowIndex + 1}:B${headerRowIndex + 3})` };
      totalDesgloseRow.getCell(2).font = { name: "Arial", size: 10, bold: true };
      totalDesgloseRow.getCell(2).numFmt = '"$"#,##0';
      
      totalDesgloseRow.getCell(3).value = { formula: `SUM(C${headerRowIndex + 1}:C${headerRowIndex + 3})` };
      totalDesgloseRow.getCell(3).font = { name: "Arial", size: 10, bold: true };
      totalDesgloseRow.getCell(3).numFmt = '"$"#,##0';

      totalDesgloseRow.getCell(4).value = { formula: `B${headerRowIndex + 4}-C${headerRowIndex + 4}` };
      totalDesgloseRow.getCell(4).font = { name: "Arial", size: 10, bold: true };
      totalDesgloseRow.getCell(4).numFmt = '"$"#,##0';

      totalDesgloseRow.eachCell((cell) => {
        cell.border = {
          top: { style: "medium", color: { argb: "94A3B8" } },
          bottom: { style: "double", color: { argb: "1E293B" } },
        };
      });

      // --- HOJA 2: DETALLE DE TURNOS COMPLETADOS ---
      const sheetBookings = workbook.addWorksheet("Ingresos por Turnos");
      sheetBookings.mergeCells("A1:H1");
      sheetBookings.getCell("A1").value = `INGRESOS POR TURNOS COMPLETADOS - ${barbershop.name.toUpperCase()}`;
      sheetBookings.getCell("A1").font = { name: "Arial", size: 12, bold: true, color: { argb: "1E293B" } };
      sheetBookings.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

      sheetBookings.mergeCells("A2:H2");
      sheetBookings.getCell("A2").value = `Período: ${periodLabel}`;
      sheetBookings.getCell("A2").font = { name: "Arial", size: 9, italic: true, color: { argb: "475569" } };
      sheetBookings.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

      sheetBookings.getRow(3).height = 15;
      
      const bookingHeaders = ["Fecha", "Hora", "Cliente", "Teléfono", "Servicio", "Barbero", "Monto", "Forma de Pago"];
      sheetBookings.getRow(4).values = bookingHeaders;
      sheetBookings.getRow(4).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFF" } };
      sheetBookings.getRow(4).height = 24;
      sheetBookings.getRow(4).eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E293B" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      sheetBookings.columns = [
        { key: "date", width: 14 },
        { key: "time", width: 8 },
        { key: "client", width: 22 },
        { key: "phone", width: 16 },
        { key: "service", width: 22 },
        { key: "barber", width: 18 },
        { key: "amount", width: 14 },
        { key: "paymentMethod", width: 16 },
      ];

      bookings.forEach((booking, idx) => {
        const rowNum = 5 + idx;
        const row = sheetBookings.getRow(rowNum);
        row.values = [
          formatDate(booking.date),
          formatTime(booking.date),
          booking.clientName,
          booking.clientPhone || "-",
          booking.serviceName,
          booking.barberName,
          booking.amount,
          formatPaymentMethod(booking.paymentMethod),
        ];

        row.getCell(2).alignment = { horizontal: "center" };
        row.getCell(8).alignment = { horizontal: "center" };
        row.getCell(7).numFmt = '"$"#,##0';
        row.getCell(7).alignment = { horizontal: "right" };

        row.eachCell((cell) => {
          cell.font = { name: "Arial", size: 10 };
          cell.border = { bottom: { style: "thin", color: { argb: "E2E8F0" } } };
        });
      });

      // Total bookings
      const bTotalRowIndex = 5 + bookings.length;
      const bTotalRow = sheetBookings.getRow(bTotalRowIndex);
      sheetBookings.mergeCells(`A${bTotalRowIndex}:F${bTotalRowIndex}`);
      sheetBookings.getCell(`A${bTotalRowIndex}`).value = "TOTAL TURNOS";
      sheetBookings.getCell(`A${bTotalRowIndex}`).font = { name: "Arial", size: 10, bold: true };
      sheetBookings.getCell(`A${bTotalRowIndex}`).alignment = { horizontal: "right" };

      bTotalRow.getCell(7).value = { formula: `SUM(G5:G${bTotalRowIndex - 1})` };
      bTotalRow.getCell(7).font = { name: "Arial", size: 10, bold: true };
      bTotalRow.getCell(7).numFmt = '"$"#,##0';
      bTotalRow.getCell(7).alignment = { horizontal: "right" };

      bTotalRow.eachCell((cell) => {
        cell.border = {
          top: { style: "medium", color: { argb: "94A3B8" } },
          bottom: { style: "double", color: { argb: "1E293B" } },
        };
      });

      // --- HOJA 3: MOVIMIENTOS MANUALES DE CAJA ---
      const sheetTransactions = workbook.addWorksheet("Movimientos de Caja");
      sheetTransactions.mergeCells("A1:G1");
      sheetTransactions.getCell("A1").value = `MOVIMIENTOS MANUALES DE CAJA - ${barbershop.name.toUpperCase()}`;
      sheetTransactions.getCell("A1").font = { name: "Arial", size: 12, bold: true, color: { argb: "1E293B" } };
      sheetTransactions.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

      sheetTransactions.mergeCells("A2:G2");
      sheetTransactions.getCell("A2").value = `Período: ${periodLabel}`;
      sheetTransactions.getCell("A2").font = { name: "Arial", size: 9, italic: true, color: { argb: "475569" } };
      sheetTransactions.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

      sheetTransactions.getRow(3).height = 15;

      const txHeaders = ["Fecha", "Tipo", "Categoría", "Descripción", "Medio de Pago", "Monto", "Registrado Por"];
      sheetTransactions.getRow(4).values = txHeaders;
      sheetTransactions.getRow(4).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFF" } };
      sheetTransactions.getRow(4).height = 24;
      sheetTransactions.getRow(4).eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E293B" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      sheetTransactions.columns = [
        { key: "date", width: 14 },
        { key: "type", width: 12 },
        { key: "category", width: 20 },
        { key: "description", width: 35 },
        { key: "method", width: 16 },
        { key: "amount", width: 14 },
        { key: "createdBy", width: 18 },
      ];

      transactions.forEach((tx, idx) => {
        const rowNum = 5 + idx;
        const row = sheetTransactions.getRow(rowNum);
        row.values = [
          formatDate(tx.date),
          tx.type === CashflowType.INFLOW ? "Ingreso" : "Egreso",
          tx.category?.name || "Otros",
          tx.description || "-",
          formatPaymentMethod(tx.paymentMethod),
          tx.amount,
          user.name, // creador
        ];

        row.getCell(2).alignment = { horizontal: "center" };
        row.getCell(5).alignment = { horizontal: "center" };
        
        const sign = tx.type === CashflowType.INFLOW ? "" : "-";
        row.getCell(6).value = tx.amount;
        row.getCell(6).numFmt = sign + '"$"#,##0';
        row.getCell(6).alignment = { horizontal: "right" };

        row.eachCell((cell) => {
          cell.font = { name: "Arial", size: 10 };
          cell.border = { bottom: { style: "thin", color: { argb: "E2E8F0" } } };
        });
      });

      // Totales
      const tTotalRowIndex = 5 + transactions.length;
      const tTotalRow = sheetTransactions.getRow(tTotalRowIndex);
      sheetTransactions.mergeCells(`A${tTotalRowIndex}:E${tTotalRowIndex}`);
      sheetTransactions.getCell(`A${tTotalRowIndex}`).value = "TOTAL MOVIMIENTOS";
      sheetTransactions.getCell(`A${tTotalRowIndex}`).font = { name: "Arial", size: 10, bold: true };
      sheetTransactions.getCell(`A${tTotalRowIndex}`).alignment = { horizontal: "right" };

      // Se calcula sumando ingresos y restando egresos
      let computedTotalManual = 0;
      transactions.forEach((tx) => {
        if (tx.type === CashflowType.INFLOW) {
          computedTotalManual += tx.amount;
        } else {
          computedTotalManual -= tx.amount;
        }
      });

      const manualTotalCell = tTotalRow.getCell(6);
      manualTotalCell.value = computedTotalManual;
      manualTotalCell.font = { name: "Arial", size: 10, bold: true };
      manualTotalCell.numFmt = computedTotalManual >= 0 ? '"$"#,##0' : '-"$"#,##0';
      manualTotalCell.alignment = { horizontal: "right" };

      tTotalRow.eachCell((cell) => {
        cell.border = {
          top: { style: "medium", color: { argb: "94A3B8" } },
          bottom: { style: "double", color: { argb: "1E293B" } },
        };
      });

      // Generar buffer de descarga
      const buffer = await workbook.xlsx.writeBuffer();

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-cache",
        },
      });
    }

    if (format === "pdf") {
      const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });

      const pdfBufferPromise = new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (err) => reject(err));
      });

      // Logo/Brand en el header
      doc.fillColor("#94a3b8").fontSize(8).font("Helvetica-Bold").text("Turnix", 40, 40, { align: "right" });
      
      // Título y barbershop
      doc.fillColor("#1e293b").fontSize(18).font("Helvetica-Bold").text("REPORTE FINANCIERO DE CAJA", 40, 40);
      doc.fillColor("#475569").fontSize(12).font("Helvetica-Bold").text(barbershop.name.toUpperCase(), 40, 60);
      
      doc.fillColor("#64748b").fontSize(9).font("Helvetica").text(`Período: ${periodLabel}`, 40, 80);
      const nowFormatted = new Intl.DateTimeFormat("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(new Date());
      doc.text(`Generado: ${nowFormatted} hs`, 40, 93);

      doc.moveTo(40, 110).lineTo(555, 110).strokeColor("#e2e8f0").lineWidth(1).stroke();

      // Sección 1: Balance General
      doc.fillColor("#1e293b").fontSize(11).font("Helvetica-Bold").text("BALANCE CONSOLIDADO", 40, 130);

      let y = 150;
      doc.rect(40, y, 515, 18).fill("#1e293b");
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
      doc.text("Concepto", 48, y + 5);
      doc.text("Monto", 400, y + 5, { width: 140, align: "right" });

      y += 18;

      const balanceRows = [
        { label: "(+) Ingresos por Turnos Completados", amount: totalBookingIncome, isBold: false },
        { label: "(+) Entradas Manuales de Caja", amount: totalManualInflow, isBold: false },
        { label: "(=) TOTAL INGRESOS", amount: totalIncome, isBold: true },
        { label: "(-) Egresos y Gastos de Caja", amount: totalExpenses, isBold: false },
        { label: "(=) BALANCE NETO DE CAJA", amount: netBalance, isBold: true },
      ];

      balanceRows.forEach((row) => {
        if (row.isBold) {
          doc.rect(40, y, 515, 18).fill("#f1f5f9");
          doc.fillColor("#0f172a").fontSize(8).font("Helvetica-Bold");
        } else {
          doc.fillColor("#334155").fontSize(8).font("Helvetica");
        }

        doc.text(row.label, 48, y + 5);
        
        const sign = row.label.startsWith("(-)") ? "-" : "";
        doc.text(sign + formatPrice(row.amount), 400, y + 5, { width: 140, align: "right" });
        y += 18;
      });

      y += 20;

      // Sección 2: Resumen consolidado por método de pago
      doc.fillColor("#1e293b").fontSize(11).font("Helvetica-Bold").text("RESUMEN POR FORMA DE PAGO", 40, y);
      y += 18;

      doc.rect(40, y, 515, 18).fill("#475569");
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
      doc.text("Caja / Medio", 48, y + 5);
      doc.text("Ingresos", 220, y + 5, { width: 100, align: "right" });
      doc.text("Egresos", 330, y + 5, { width: 100, align: "right" });
      doc.text("Neto", 440, y + 5, { width: 100, align: "right" });

      y += 18;

      const methodSummaryRows = [
        {
          label: "Efectivo (Caja Física)",
          income: bookingSummary.CASH.total + manualInflowSummary.CASH.total,
          expense: manualOutflowSummary.CASH.total,
        },
        {
          label: "Transferencia / Débito",
          income: bookingSummary.TRANSFER.total + manualInflowSummary.TRANSFER.total,
          expense: manualOutflowSummary.TRANSFER.total,
        },
        {
          label: "Tarjeta de Crédito",
          income: bookingSummary.CARD.total + manualInflowSummary.CARD.total,
          expense: manualOutflowSummary.CARD.total,
        },
      ];

      methodSummaryRows.forEach((row, idx) => {
        if (idx % 2 === 1) {
          doc.rect(40, y, 515, 18).fill("#f8fafc");
        }
        doc.fillColor("#334155").fontSize(8).font("Helvetica");
        doc.text(row.label, 48, y + 5);
        doc.text(formatPrice(row.income), 220, y + 5, { width: 100, align: "right" });
        doc.text(formatPrice(row.expense), 330, y + 5, { width: 100, align: "right" });
        
        const net = row.income - row.expense;
        doc.text(formatPrice(net), 440, y + 5, { width: 100, align: "right" });
        y += 18;
      });

      // Fila total consolidado
      doc.rect(40, y, 515, 18).fill("#f1f5f9");
      doc.fillColor("#0f172a").fontSize(8).font("Helvetica-Bold");
      doc.text("TOTAL CONSOLIDADO", 48, y + 5);
      doc.text(formatPrice(totalIncome), 220, y + 5, { width: 100, align: "right" });
      doc.text(formatPrice(totalExpenses), 330, y + 5, { width: 100, align: "right" });
      doc.text(formatPrice(netBalance), 440, y + 5, { width: 100, align: "right" });

      // --- PAGINA 2: MOVIMIENTOS DE CAJA ---
      doc.addPage();
      let currentY = 50;

      doc.fillColor("#1e293b").fontSize(12).font("Helvetica-Bold").text("MOVIMIENTOS DE CAJA DETALLADOS", 40, currentY);
      currentY += 20;

      const drawTxTableHeader = (d: typeof doc, headerY: number) => {
        d.rect(40, headerY, 515, 18).fill("#1e293b");
        d.fillColor("#ffffff").fontSize(7).font("Helvetica-Bold");
        
        d.text("Fecha", 46, headerY + 5);
        d.text("Tipo", 96, headerY + 5);
        d.text("Categoría", 136, headerY + 5);
        d.text("Descripción", 216, headerY + 5);
        d.text("Caja / Medio", 376, headerY + 5);
        d.text("Monto", 476, headerY + 5, { width: 74, align: "right" });
        
        return headerY + 18;
      };

      currentY = drawTxTableHeader(doc, currentY);

      if (transactions.length === 0) {
        doc.fillColor("#64748b").fontSize(8).font("Helvetica-Oblique").text("No hay movimientos de caja registrados en este período.", 48, currentY + 10);
        currentY += 30;
      } else {
        transactions.forEach((tx, idx: number) => {
          if (currentY > 730) {
            doc.addPage();
            currentY = 50;
            currentY = drawTxTableHeader(doc, currentY);
          }

          if (idx % 2 === 1) {
            doc.rect(40, currentY, 515, 18).fill("#f8fafc");
          }

          doc.fillColor("#334155").fontSize(7).font("Helvetica");
          doc.text(formatDate(tx.date), 46, currentY + 5);
          
          const typeStr = tx.type === CashflowType.INFLOW ? "Ingreso" : "Egreso";
          doc.text(typeStr, 96, currentY + 5);
          doc.text(tx.category?.name || "Otros", 136, currentY + 5, { width: 75, height: 10, lineBreak: false });
          doc.text(tx.description || "-", 216, currentY + 5, { width: 155, height: 10, lineBreak: false });
          doc.text(formatPaymentMethod(tx.paymentMethod), 376, currentY + 5);

          const sign = tx.type === CashflowType.INFLOW ? "+" : "-";
          const color = tx.type === CashflowType.INFLOW ? "#059669" : "#dc2626";
          doc.fillColor(color).font("Helvetica-Bold");
          doc.text(sign + formatPrice(tx.amount), 476, currentY + 5, { width: 74, align: "right" });

          currentY += 18;
        });
      }

      // --- PAGINA 3+: INGRESOS POR TURNOS ---
      doc.addPage();
      currentY = 50;

      doc.fillColor("#1e293b").fontSize(12).font("Helvetica-Bold").text("DETALLE DE INGRESOS POR TURNOS", 40, currentY);
      currentY += 20;

      const drawBookingsTableHeader = (d: typeof doc, headerY: number) => {
        d.rect(40, headerY, 515, 18).fill("#1e293b");
        d.fillColor("#ffffff").fontSize(7).font("Helvetica-Bold");
        
        d.text("Fecha", 46, headerY + 5);
        d.text("Hora", 96, headerY + 5);
        d.text("Cliente", 136, headerY + 5);
        d.text("Servicio", 246, headerY + 5);
        d.text("Barbero", 356, headerY + 5);
        d.text("Monto", 436, headerY + 5, { width: 50, align: "right" });
        d.text("F. Pago", 496, headerY + 5, { width: 54, align: "right" });
        
        return headerY + 18;
      };

      currentY = drawBookingsTableHeader(doc, currentY);

      if (bookings.length === 0) {
        doc.fillColor("#64748b").fontSize(8).font("Helvetica-Oblique").text("No hay turnos completados registrados en este período.", 48, currentY + 10);
        currentY += 30;
      } else {
        bookings.forEach((booking, idx) => {
          if (currentY > 730) {
            doc.addPage();
            currentY = 50;
            currentY = drawBookingsTableHeader(doc, currentY);
          }

          if (idx % 2 === 1) {
            doc.rect(40, currentY, 515, 18).fill("#f8fafc");
          }

          doc.fillColor("#334155").fontSize(7).font("Helvetica");
          doc.text(formatDate(booking.date), 46, currentY + 5);
          doc.text(formatTime(booking.date), 96, currentY + 5);
          doc.text(booking.clientName, 136, currentY + 5, { width: 105, height: 10, lineBreak: false });
          doc.text(booking.serviceName, 246, currentY + 5, { width: 105, height: 10, lineBreak: false });
          doc.text(booking.barberName, 356, currentY + 5, { width: 75, height: 10, lineBreak: false });
          
          doc.font("Helvetica-Bold");
          doc.text(formatPrice(booking.amount), 436, currentY + 5, { width: 50, align: "right" });
          doc.font("Helvetica");
          doc.text(formatPaymentMethod(booking.paymentMethod), 496, currentY + 5, { width: 54, align: "right" });

          currentY += 18;
        });
      }

      // Fila de total de turnos al final
      if (currentY > 730) {
        doc.addPage();
        currentY = 50;
        currentY = drawBookingsTableHeader(doc, currentY);
      }
      doc.rect(40, currentY, 515, 18).fill("#f1f5f9");
      doc.fillColor("#0f172a").fontSize(7).font("Helvetica-Bold");
      doc.text("TOTAL INGRESOS POR TURNOS", 46, currentY + 5);
      doc.text(formatPrice(totalBookingIncome), 436, currentY + 5, { width: 50, align: "right" });

      // Agregar pie de página dinámico (Página X de Y)
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.moveTo(40, 775).lineTo(555, 775).strokeColor("#cbd5e1").lineWidth(0.5).stroke();
        doc.fontSize(7).fillColor("#94a3b8").font("Helvetica").text(
          `Página ${i + 1} de ${range.count} | Generado por Turnix`,
          40,
          782,
          { align: "center", width: 515 }
        );
      }

      doc.end();

      const finalPdfBuffer = await pdfBufferPromise;

      return new Response(new Uint8Array(finalPdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-cache",
        },
      });
    }

    return NextResponse.json({ error: "Formato no soportado." }, { status: 400 });
  } catch (error) {
    console.error("Error al exportar reporte:", error);
    return NextResponse.json(
      { error: "Error interno al generar el reporte." },
      { status: 500 }
    );
  }
}
