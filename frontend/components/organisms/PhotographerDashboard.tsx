"use client";

import { usePhotographerEarnings } from "@/hooks/earnings/usePhotographerEarnings";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/datetime";
import { Terminal } from "lucide-react";

interface PhotographerDashboardProps {
  photographerId: number;
}

export function PhotographerDashboard({ photographerId }: PhotographerDashboardProps) {
  const { earnings, loading, error } = usePhotographerEarnings(photographerId);

  if (loading) {
    return <div>Cargando resumen de ganancias...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-lg border border-red-400 bg-red-50 text-sm flex items-center gap-2">
        <Terminal className="h-4 w-4" />
        <span>Error al cargar el resumen de ganancias: {error}</span>
      </div>
    );
  }

  if (earnings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Ganancias</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Aún no tienes ganancias registradas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de Ganancias Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>ID de Orden</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {earnings.map((earning) => (
              <TableRow key={earning.id}>
                <TableCell>
                  {formatDateTime(earning.created_at, { month: "short", includeYear: false })}
                </TableCell>
                <TableCell>{earning.order_id}</TableCell>
                <TableCell className="text-right font-medium">${earning.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
