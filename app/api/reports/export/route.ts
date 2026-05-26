import { NextResponse } from "next/server";
import { getUserForSettings } from "@/lib/data";
import { Role } from "@prisma/client";
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
  period: z.enum(["day", "week", "month", "quarter", "year", "all"]),
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
    });

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: "Parámetros de consulta inválidos." },
        { status: 400 }
      );
    }

    const { format, period } = validatedParams.data;

    // 3. Obtener fechas y bookings
    const { startDate, endDate } = getDateRangeForPeriod(period);
    const bookings = await getDetailedBookingsForReport(
      barbershop.id,
      startDate,
      endDate
    );

    const periodLabel = formatPeriodLabel(period, startDate, endDate);

    // Calcular resúmenes por forma de pago
    const summary = {
      CASH: { count: 0, total: 0 },
      TRANSFER: { count: 0, total: 0 },
      CARD: { count: 0, total: 0 },
      UNCLASSIFIED: { count: 0, total: 0 },
    };

    bookings.forEach((b) => {
      const method = b.paymentMethod;
      const amount = b.amount;
      if (method === "CASH") {
        summary.CASH.count++;
        summary.CASH.total += amount;
      } else if (method === "TRANSFER") {
        summary.TRANSFER.count++;
        summary.TRANSFER.total += amount;
      } else if (method === "CARD") {
        summary.CARD.count++;
        summary.CARD.total += amount;
      } else {
        summary.UNCLASSIFIED.count++;
        summary.UNCLASSIFIED.total += amount;
      }
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + b.amount, 0);
    const totalCount = bookings.length;

    const formattedDate = formatToDateInput(new Date());
    const filename = `reporte-${barbershop.slug}-${period}-${formattedDate}.${format}`;

    // 4. Generar archivos
    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Turnix";
      workbook.lastModifiedBy = "Turnix";
      workbook.created = new Date();
      workbook.modified = new Date();

      // --- Hoja 1: Detalle de turnos ---
      const sheet1 = workbook.addWorksheet("Detalle de turnos");
      
      // Título
      sheet1.mergeCells("A1:H1");
      sheet1.getCell("A1").value = `REPORTE DE INGRESOS - ${barbershop.name.toUpperCase()}`;
      sheet1.getCell("A1").font = { name: "Arial", size: 14, bold: true, color: { argb: "1E293B" } };
      sheet1.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

      // Subtítulo
      sheet1.mergeCells("A2:H2");
      sheet1.getCell("A2").value = `Período: ${periodLabel} | Generado el ${formatDate(new Date())}`;
      sheet1.getCell("A2").font = { name: "Arial", size: 10, italic: true, color: { argb: "475569" } };
      sheet1.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

      // Espaciador en fila 3
      sheet1.getRow(3).height = 15;

      // Cabecera de Tabla
      const headers = [
        "Fecha",
        "Hora",
        "Cliente",
        "Teléfono",
        "Servicio",
        "Barbero",
        "Monto",
        "Forma de Pago",
      ];
      sheet1.getRow(4).values = headers;
      sheet1.getRow(4).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFF" } };
      sheet1.getRow(4).height = 24;
      sheet1.getRow(4).eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "1E293B" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      // Anchos de columna
      sheet1.columns = [
        { key: "date", width: 14 },
        { key: "time", width: 8 },
        { key: "client", width: 22 },
        { key: "phone", width: 16 },
        { key: "service", width: 22 },
        { key: "barber", width: 18 },
        { key: "amount", width: 14 },
        { key: "paymentMethod", width: 16 },
      ];

      // Filas de datos
      bookings.forEach((booking, idx) => {
        const rowNum = 5 + idx;
        const row = sheet1.getRow(rowNum);
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

        // Alinear hora y forma de pago al centro
        row.getCell(2).alignment = { horizontal: "center" };
        row.getCell(8).alignment = { horizontal: "center" };

        // Formatear monto como moneda
        const amountCell = row.getCell(7);
        amountCell.numFmt = '"$"#,##0';
        amountCell.alignment = { horizontal: "right" };

        row.eachCell((cell) => {
          cell.font = { name: "Arial", size: 10 };
          cell.border = {
            bottom: { style: "thin", color: { argb: "E2E8F0" } },
          };
        });
      });

      // Fila de Total general
      const totalRowNum = 5 + bookings.length;
      const totalRow = sheet1.getRow(totalRowNum);
      sheet1.mergeCells(`A${totalRowNum}:F${totalRowNum}`);
      sheet1.getCell(`A${totalRowNum}`).value = "TOTAL GENERAL";
      sheet1.getCell(`A${totalRowNum}`).font = { name: "Arial", size: 10, bold: true, color: { argb: "1E293B" } };
      sheet1.getCell(`A${totalRowNum}`).alignment = { horizontal: "right", vertical: "middle" };

      const totalAmountCell = totalRow.getCell(7);
      if (bookings.length === 0) {
        totalAmountCell.value = 0;
      } else {
        totalAmountCell.value = { formula: `SUM(G5:G${totalRowNum - 1})` };
      }
      totalAmountCell.font = { name: "Arial", size: 10, bold: true };
      totalAmountCell.numFmt = '"$"#,##0';
      totalAmountCell.alignment = { horizontal: "right" };

      totalRow.eachCell((cell) => {
        cell.border = {
          top: { style: "medium", color: { argb: "94A3B8" } },
          bottom: { style: "double", color: { argb: "1E293B" } },
        };
      });

      // --- Hoja 2: Resumen por forma de pago ---
      const sheet2 = workbook.addWorksheet("Resumen de Ventas");

      // Título
      sheet2.mergeCells("A1:C1");
      sheet2.getCell("A1").value = "RESUMEN DE INGRESOS POR FORMA DE PAGO";
      sheet2.getCell("A1").font = { name: "Arial", size: 12, bold: true, color: { argb: "1E293B" } };
      sheet2.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

      // Subtítulo
      sheet2.mergeCells("A2:C2");
      sheet2.getCell("A2").value = `Período: ${periodLabel}`;
      sheet2.getCell("A2").font = { name: "Arial", size: 9, italic: true, color: { argb: "475569" } };
      sheet2.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

      sheet2.getRow(3).height = 15;

      // Cabeceras
      sheet2.getRow(4).values = ["Forma de Pago", "Cantidad de Turnos", "Total Recaudado"];
      sheet2.getRow(4).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFF" } };
      sheet2.getRow(4).height = 24;
      sheet2.getRow(4).eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "1E293B" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      sheet2.columns = [
        { key: "method", width: 22 },
        { key: "count", width: 20 },
        { key: "total", width: 20 },
      ];

      // Datos
      const paymentSummaryRows = [
        ["Efectivo", summary.CASH.count, summary.CASH.total],
        ["Transferencia", summary.TRANSFER.count, summary.TRANSFER.total],
        ["Tarjeta", summary.CARD.count, summary.CARD.total],
        ["Sin clasificar", summary.UNCLASSIFIED.count, summary.UNCLASSIFIED.total],
      ];

      paymentSummaryRows.forEach((rowVal, idx) => {
        const rowNum = 5 + idx;
        const row = sheet2.getRow(rowNum);
        row.values = rowVal;

        row.getCell(2).alignment = { horizontal: "center" };
        const totalCell = row.getCell(3);
        totalCell.numFmt = '"$"#,##0';
        totalCell.alignment = { horizontal: "right" };

        row.eachCell((cell) => {
          cell.font = { name: "Arial", size: 10 };
          cell.border = {
            bottom: { style: "thin", color: { argb: "E2E8F0" } },
          };
        });
      });

      // Total general de resumen
      const summaryTotalRow = sheet2.getRow(9);
      summaryTotalRow.getCell(1).value = "TOTAL";
      summaryTotalRow.getCell(1).font = { name: "Arial", size: 10, bold: true };

      summaryTotalRow.getCell(2).value = { formula: "SUM(B5:B8)" };
      summaryTotalRow.getCell(2).font = { name: "Arial", size: 10, bold: true };
      summaryTotalRow.getCell(2).alignment = { horizontal: "center" };

      summaryTotalRow.getCell(3).value = { formula: "SUM(C5:C8)" };
      summaryTotalRow.getCell(3).font = { name: "Arial", size: 10, bold: true };
      summaryTotalRow.getCell(3).numFmt = '"$"#,##0';
      summaryTotalRow.getCell(3).alignment = { horizontal: "right" };

      summaryTotalRow.eachCell((cell) => {
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

      // Generar PDF en Buffer
      const pdfBufferPromise = new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (err) => reject(err));
      });

      // Logo/Brand en el header
      doc.fillColor("#94a3b8").fontSize(8).font("Helvetica-Bold").text("Turnix", 40, 40, { align: "right" });
      
      // Título y barbershop
      doc.fillColor("#1e293b").fontSize(18).font("Helvetica-Bold").text("REPORTE DE INGRESOS", 40, 40);
      doc.fillColor("#475569").fontSize(12).font("Helvetica-Bold").text(barbershop.name.toUpperCase(), 40, 60);
      
      doc.fillColor("#64748b").fontSize(9).font("Helvetica").text(`Período: ${periodLabel}`, 40, 80);
      const nowFormatted = new Intl.DateTimeFormat("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(new Date());
      doc.text(`Generado: ${nowFormatted} hs`, 40, 93);

      // Línea divisoria
      doc.moveTo(40, 110).lineTo(555, 110).strokeColor("#e2e8f0").lineWidth(1).stroke();

      // Sección 1: Resumen por forma de pago
      doc.fillColor("#1e293b").fontSize(11).font("Helvetica-Bold").text("RESUMEN POR FORMA DE PAGO", 40, 130);

      let y = 150;
      doc.rect(40, y, 515, 18).fill("#1e293b");
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
      doc.text("Forma de pago", 48, y + 5);
      doc.text("Cantidad de turnos", 220, y + 5, { width: 100, align: "center" });
      doc.text("Total recaudado", 400, y + 5, { width: 140, align: "right" });

      y += 18;

      const summaryRows = [
        { label: "Efectivo", count: summary.CASH.count, total: summary.CASH.total },
        { label: "Transferencia", count: summary.TRANSFER.count, total: summary.TRANSFER.total },
        { label: "Tarjeta", count: summary.CARD.count, total: summary.CARD.total },
        { label: "Sin clasificar", count: summary.UNCLASSIFIED.count, total: summary.UNCLASSIFIED.total },
      ];

      summaryRows.forEach((row, idx) => {
        if (idx % 2 === 1) {
          doc.rect(40, y, 515, 18).fill("#f8fafc");
        }
        doc.fillColor("#334155").fontSize(8).font("Helvetica");
        doc.text(row.label, 48, y + 5);
        doc.text(row.count.toString(), 220, y + 5, { width: 100, align: "center" });
        doc.text(formatPrice(row.total), 400, y + 5, { width: 140, align: "right" });
        y += 18;
      });

      // Fila de Total de resumen
      doc.rect(40, y, 515, 18).fill("#f1f5f9");
      doc.fillColor("#0f172a").fontSize(8).font("Helvetica-Bold");
      doc.text("TOTAL GENERAL", 48, y + 5);
      doc.text(totalCount.toString(), 220, y + 5, { width: 100, align: "center" });
      doc.text(formatPrice(totalRevenue), 400, y + 5, { width: 140, align: "right" });

      y += 35;

      // Sección 2: Detalle de turnos
      doc.fillColor("#1e293b").fontSize(11).font("Helvetica-Bold").text("DETALLE DE TURNOS COMPLETADOS", 40, y);
      y += 18;

      const drawDetailTableHeader = (d: typeof doc, headerY: number) => {
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

      y = drawDetailTableHeader(doc, y);

      bookings.forEach((booking, idx) => {
        // Paginación si supera límite (730 para evitar desborde con el footer a 785)
        if (y > 720) {
          doc.addPage();
          y = 50;
          y = drawDetailTableHeader(doc, y);
        }

        if (idx % 2 === 1) {
          doc.rect(40, y, 515, 18).fill("#f8fafc");
        }

        doc.fillColor("#334155").fontSize(7).font("Helvetica");
        doc.text(formatDate(booking.date), 46, y + 5);
        doc.text(formatTime(booking.date), 96, y + 5);
        doc.text(booking.clientName, 136, y + 5, { width: 105, height: 10, lineBreak: false });
        doc.text(booking.serviceName, 246, y + 5, { width: 105, height: 10, lineBreak: false });
        doc.text(booking.barberName, 356, y + 5, { width: 75, height: 10, lineBreak: false });
        doc.text(formatPrice(booking.amount), 436, y + 5, { width: 50, align: "right" });
        doc.text(formatPaymentMethod(booking.paymentMethod), 496, y + 5, { width: 54, align: "right" });

        y += 18;
      });

      // Fila de Total de detalle
      if (y > 720) {
        doc.addPage();
        y = 50;
        y = drawDetailTableHeader(doc, y);
      }

      doc.rect(40, y, 515, 18).fill("#f1f5f9");
      doc.fillColor("#0f172a").fontSize(7).font("Helvetica-Bold");
      doc.text("TOTAL FACTURADO", 46, y + 5);
      doc.text(formatPrice(totalRevenue), 436, y + 5, { width: 50, align: "right" });

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
