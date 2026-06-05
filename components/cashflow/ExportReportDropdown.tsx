"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportReportDropdownProps {
  currentPeriod: string;
  customDate?: string;
}

export function ExportReportDropdown({ currentPeriod, customDate }: ExportReportDropdownProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async (format: "xlsx" | "pdf") => {
    if (isExporting) return;
    setIsExporting(true);

    const formatLabel = format === "xlsx" ? "Excel" : "PDF";
    
    toast.promise(
      new Promise<void>((resolve, reject) => {
        try {
          const link = document.createElement("a");
          let href = `/api/reports/export?format=${format}&period=${currentPeriod}`;
          if (customDate) {
            href += `&date=${customDate}`;
          }
          link.href = href;
          link.setAttribute("download", "");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setTimeout(() => {
            setIsExporting(false);
            resolve();
          }, 1500);
        } catch (err) {
          setIsExporting(false);
          reject(err);
        }
      }),
      {
        loading: `Preparando reporte ${formatLabel}...`,
        success: `Reporte ${formatLabel} descargado con éxito.`,
        error: `No se pudo descargar el reporte ${formatLabel}.`,
      }
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isExporting}>
          <Download className="w-4 h-4" />
          <span>Exportar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem onClick={() => handleExport("xlsx")} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Excel (.xlsx)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4 text-red-600" />
          <span>PDF (.pdf)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
