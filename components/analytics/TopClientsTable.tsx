"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientMetricsData } from "@/actions/analytics.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Star, ChevronDown, ChevronUp } from "lucide-react";

const INITIAL_COUNT = 5;

interface TopClientsTableProps {
  clients: ClientMetricsData["topClients"];
}

export function TopClientsTable({ clients }: TopClientsTableProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const displayedClients = expanded ? clients : clients.slice(0, INITIAL_COUNT);
  const hasMore = clients.length > INITIAL_COUNT;

  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mejores Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">
            Aún no hay clientes con turnos en este período.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mejores Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-right">Visitas</TableHead>
                <TableHead className="text-right">Gastado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedClients.map((client, index) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                >
                  <TableCell className="font-medium text-muted-foreground tabular-nums">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{client.name}</span>
                      {client.isVip && (
                        <Badge
                          variant="secondary"
                          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-transparent gap-1"
                        >
                          <Star className="w-3 h-3 fill-current" />
                          VIP
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {client.visitsCount}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {formatPrice(client.totalSpent)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {hasMore && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded((prev) => !prev)}
              className="gap-2"
            >
              {expanded ? (
                <>
                  Ver menos
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Ver más ({clients.length - INITIAL_COUNT})
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
