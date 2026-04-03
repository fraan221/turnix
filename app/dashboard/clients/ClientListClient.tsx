"use client";

import { useState, useMemo } from "react";
import { Client } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { formatPhoneNumberForWhatsApp } from "@/lib/utils";

interface ClientListClientProps {
  clients: Client[];
}

const ITEMS_PER_PAGE = 20;

export function ClientListClient({ clients }: ClientListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    
    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        (client.phone && client.phone.includes(query))
    );
  }, [clients, searchQuery]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedClients = filteredClients.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Reset to page 1 when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o teléfono…"
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-9 w-full bg-background"
          autoComplete="off"
        />
      </div>

      {/* Lista de Clientes */}
      {filteredClients.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground border rounded-md bg-muted/20">
          <p className="text-sm">No se encontraron clientes para «{searchQuery}»</p>
        </div>
      ) : (
        <div className="rounded-md border divide-y overflow-hidden">
          {paginatedClients.map((client) => {
            const whatsappUrl = `https://wa.me/${formatPhoneNumberForWhatsApp(client.phone)}`;
            
            return (
              <div
                key={client.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 transition-colors hover:bg-accent/50 gap-4 sm:gap-0"
              >
                {/* Clickable Area for Profile */}
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="flex items-center gap-4 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                >
                  <div className="flex items-center justify-center shrink-0 w-12 h-12 text-lg font-bold rounded-full bg-primary/10 text-primary">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {client.name}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {client.phone}
                    </p>
                  </div>
                </Link>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 sm:pl-4">
                  <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50" title="Contactar por WhatsApp">
                      <WhatsAppIcon className="w-5 h-5" />
                      <span className="sr-only">WhatsApp</span>
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredClients.length)} de {filteredClients.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
