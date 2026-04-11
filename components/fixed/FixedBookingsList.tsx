"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateFixedBookingModal } from "./CreateFixedBookingModal";
import { FixedBookingRow } from "./FixedBookingRow";

type FixedBookingWithRelations = any; // Tipamos como any por ahora hasta importar el tipo exacto de Prisma

interface FixedBookingsListProps {
  initialBookings: FixedBookingWithRelations[];
  role: string | null;
  clients: any[];
  services: any[];
  barbers: any[];
}

export function FixedBookingsList({ 
  initialBookings, 
  role,
  clients,
  services,
  barbers
}: FixedBookingsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredBookings = initialBookings.filter(
    (booking) =>
      booking.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client.phone.includes(searchTerm) ||
      booking.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role === "OWNER" && booking.barber.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por cliente, servicio..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Turno Fijo
        </Button>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20 border-dashed">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No hay turnos fijos</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            {searchTerm 
              ? "No se encontraron resultados para tu búsqueda." 
              : "Todavía no configuraste ningún turno recurrente."}
          </p>
          {!searchTerm && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Crear el primero
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-[1fr_auto] md:grid-cols-6 lg:grid-cols-7 gap-4 p-4 bg-muted/50 text-sm font-medium text-muted-foreground">
            <div className="col-span-1 md:col-span-2">Cliente & Servicio</div>
            <div className="hidden md:block">Día y Hora</div>
            <div className="hidden md:block">Frecuencia</div>
            <div className="hidden lg:block">Barbero</div>
            <div className="hidden md:block">Estado</div>
            <div className="text-right">Acciones</div>
          </div>
          <div className="divide-y">
            {filteredBookings.map((booking) => (
              <FixedBookingRow 
                key={booking.id} 
                booking={booking} 
                role={role} 
              />
            ))}
          </div>
        </div>
      )}

      <CreateFixedBookingModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        role={role}
        clients={clients}
        services={services}
        barbers={barbers}
      />
    </div>
  );
}
