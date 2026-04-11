"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Play, Pause, Trash2, CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { resumeRecurringBooking, suspendRecurringBooking, deleteRecurringBooking } from "@/actions/fixed.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Utility maps
const DAYS_ES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
};

interface FixedBookingRowProps {
  booking: any;
  role: string | null;
}

export function FixedBookingRow({ booking, role }: FixedBookingRowProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSuspended = booking.suspendedUntil && new Date(booking.suspendedUntil) > new Date();

  // Reset confirmation state if user doesn't click again
  useEffect(() => {
    if (deleteConfirming) {
      timeoutRef.current = setTimeout(() => {
        setDeleteConfirming(false);
      }, 3000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [deleteConfirming]);

  const getFrequencyText = () => {
    if (booking.frequency === "MONTHLY") {
      const ordinal = booking.weekOfMonth === 1 ? "Primer" : 
                      booking.weekOfMonth === 2 ? "Segundo" : 
                      booking.weekOfMonth === 3 ? "Tercer" : 
                      booking.weekOfMonth === 4 ? "Cuarto" : "Último";
      return `${ordinal} ${DAYS_ES[booking.dayOfWeek]}`;
    }
    return FREQUENCY_LABELS[booking.frequency] || booking.frequency;
  };

  const handleToggleSuspend = async () => {
    setIsProcessing(true);
    if (isSuspended) {
      const result = await resumeRecurringBooking(booking.id);
      if (result.error) toast.error(result.error);
      else toast.success(result.success);
    } else {
      const result = await suspendRecurringBooking({ recurringBookingId: booking.id });
      if (result.error) toast.error(result.error);
      else toast.success(result.success);
    }
    setIsProcessing(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteConfirming) {
      setDeleteConfirming(true);
      return;
    }
    
    setIsProcessing(true);
    setDeleteConfirming(false);
    const result = await deleteRecurringBooking(booking.id);
    if (result.error) {
      toast.error(result.error);
      setIsProcessing(false);
    } else {
      toast.success(result.success);
      router.refresh();
    }
  };

  return (
    <div className="grid grid-cols-[1fr_auto] md:grid-cols-6 lg:grid-cols-7 gap-4 p-4 items-center hover:bg-muted/50 transition-colors">
      <div className="col-span-1 md:col-span-2">
        <div className="font-medium text-sm sm:text-base truncate">
          {booking.client.name}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
          <span>{booking.service.name}</span>
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-sm tabular-nums">
            {formatPrice(booking.service.price)}
          </span>
        </div>
      </div>
      
      <div className="hidden md:block">
        <div className="font-medium text-sm">{DAYS_ES[booking.dayOfWeek]}</div>
        <div className="text-xs text-muted-foreground tabular-nums flex items-center gap-1">
          <CalendarClock className="h-3 w-3" />
          {booking.startTime}
        </div>
      </div>

      <div className="hidden md:block">
        <Badge variant="outline" className="font-normal text-xs bg-muted/20">
          {getFrequencyText()}
        </Badge>
      </div>

      <div className="hidden lg:block truncate text-sm">
        {booking.barber.name}
      </div>

      <div className="hidden md:block">
        {!booking.isActive ? (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Cancelado</Badge>
        ) : isSuspended ? (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pausado</Badge>
        ) : (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Activo</Badge>
        )}
      </div>

      <div className="flex justify-end gap-1 sm:gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleToggleSuspend}
          disabled={!booking.isActive || isProcessing}
          className={isSuspended ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"}
          title={isSuspended ? "Reactivar turno fijo" : "Pausar turno fijo"}
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : isSuspended ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        
        <Button 
          variant={deleteConfirming ? "destructive" : "ghost"}
          size={deleteConfirming ? "sm" : "icon"}
          onClick={handleDelete}
          disabled={!booking.isActive || isProcessing}
          className={deleteConfirming ? "animate-in slide-in-from-right-2" : "text-red-600 hover:text-red-700 hover:bg-red-50"}
          title="Cancelar turno fijo"
        >
          {deleteConfirming ? (
            <span className="px-1 text-xs font-semibold uppercase tracking-wider">Confirmar</span>
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
