"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

const INITIAL_COUNT = 5;

interface TopServicesCardProps {
  services: { name: string | null; count: number }[];
}

export function TopServicesCard({ services }: TopServicesCardProps) {
  const [expanded, setExpanded] = useState(false);

  const displayedServices = expanded ? services : services.slice(0, INITIAL_COUNT);
  const hasMore = services.length > INITIAL_COUNT;

  if (services.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Servicios más Populares</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">
            Aún no hay servicios con turnos en este período.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Servicios más Populares</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead className="text-right">Veces</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedServices.map((service, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-muted/50"
                >
                  <TableCell className="font-medium text-muted-foreground tabular-nums">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium truncate block max-w-[150px] sm:max-w-[250px]">
                      {service.name || "Servicio eliminado"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {service.count}
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
                  Ver más ({services.length - INITIAL_COUNT})
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