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
        (client.phone && client.phone.includes(query)),
    );
  }, [clients, searchQuery]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedClients = filteredClients.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
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
        <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
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
        <div className="py-8 text-center rounded-md border text-muted-foreground bg-muted/20">
          <p className="text-sm">
            No se encontraron clientes para «{searchQuery}»
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border divide-y">
          {paginatedClients.map((client) => {
            return (
              <div
                key={client.id}
                className="flex flex-col gap-4 justify-between p-4 transition-colors group sm:flex-row sm:items-center hover:bg-accent/50 sm:gap-0"
              >
                {/* Clickable Area for Profile */}
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="flex flex-1 gap-4 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex justify-center items-center w-12 h-12 text-lg font-bold rounded-full shrink-0 bg-primary/10 text-primary">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium transition-colors text-foreground group-hover:text-primary">
                      {client.name}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {client.phone ? client.phone : "Sin teléfono"}
                    </p>
                  </div>
                </Link>

                {/* Quick Actions */}
                <div className="flex gap-2 items-center sm:pl-4">
                  {client.phone ? (
                    <Link
                      href={`https://wa.me/${formatPhoneNumberForWhatsApp(client.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={-1}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-9 h-9 text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Contactar por WhatsApp"
                      >
                        <WhatsAppIcon className="w-5 h-5" />
                        <span className="sr-only">WhatsApp</span>
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} -{" "}
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredClients.length)} de{" "}
            {filteredClients.length}
          </p>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="mr-1 w-4 h-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
