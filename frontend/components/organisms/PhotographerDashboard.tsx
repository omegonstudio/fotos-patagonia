"use client";

import { usePhotographerEarnings } from "@/hooks/earnings/usePhotographerEarnings";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { formatDateTime } from "@/lib/datetime";
import { Terminal } from "lucide-react";
import { PhotoEarningsSummaryTable } from "./PhotoEarningsSummaryTable";
import { PaginationControls } from "../molecules/PaginationControls";

interface PhotographerDashboardProps {
  photographerId: number;
}

export function PhotographerDashboard({ photographerId }: PhotographerDashboardProps) {
  const { earnings, loading, error, page, setPage, total, limit } = usePhotographerEarnings(photographerId);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Resumen Agrupado por Foto */}
      <PhotoEarningsSummaryTable photographerId={photographerId} />

      {/* Detalle de Ganancias Individuales */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Ganancias Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && page === 1 && <div>Cargando detalle de ganancias...</div>}
          {error && (
            <div className="text-red-500 p-4 rounded-lg border border-red-400 bg-red-50 text-sm flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              <span>Error al cargar el detalle: {error}</span>
            </div>
          )}
          {!loading && !error && earnings.length === 0 && (
            <p>Aún no tienes ganancias registradas.</p>
          )}
          {!loading && !error && earnings.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>ID de Orden</TableHead>
                  <TableHead>Foto</TableHead>
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
                    <TableCell>{earning.photo_filename || "N/A"}</TableCell>
                    <TableCell className="text-right font-medium">${earning.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter>
            <PaginationControls
                currentPage={page}
                totalItems={total}
                itemsPerPage={limit}
                onPageChange={setPage}
            />
        </CardFooter>
      </Card>
    </div>
  );
}
