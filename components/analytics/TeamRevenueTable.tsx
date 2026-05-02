import { FinanceData } from "@/actions/analytics.actions";
import { formatPrice } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamRevenueTableProps {
  data: NonNullable<FinanceData["teamBreakdown"]>;
}

export function TeamRevenueTable({ data }: TeamRevenueTableProps) {
  const sortedData = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Producción del Equipo</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barbero</TableHead>
              <TableHead className="text-right">Turnos Completados</TableHead>
              <TableHead className="text-right">Total Facturado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((barber) => (
              <TableRow key={barber.barberId}>
                <TableCell className="font-medium">
                  {barber.barberName}
                </TableCell>
                <TableCell className="text-right">
                  {barber.completedCount}
                </TableCell>
                <TableCell className="font-semibold text-right">
                  {formatPrice(barber.totalRevenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
