"use client";

import { usePhotoSalesStats } from "@/hooks/stats/use-photo-sales-stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useAuthStore } from "@/lib/store";

export function PhotoSalesStatsTable() {
  const photographerId = useAuthStore((state) => state.user?.photographer_id);
  const { data: stats, loading, error } = usePhotoSalesStats(photographerId || null);

  return (
    <Card className="rounded-2xl border-gray-200">
      <CardHeader>
        <CardTitle>Mis Fotos Más Vendidas</CardTitle>
        <CardDescription>
          Un resumen de tus fotos ordenadas por popularidad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="py-8 text-center text-muted-foreground">
            Cargando estadísticas...
          </div>
        )}
        {error && (
          <div className="py-8 text-center text-red-500">{error}</div>
        )}
        {!loading && !error && (
          <>
            {stats.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Aún no has vendido ninguna foto.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Álbum</TableHead>
                    <TableHead className="text-center">Veces Vendida</TableHead>
                    <TableHead className="text-right">Ingresos Generados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((stat) => (
                    <TableRow key={stat.photo_id}>
                      <TableCell className="font-medium">{stat.photo_filename}</TableCell>
                      <TableCell>{stat.album_name}</TableCell>
                      <TableCell className="text-center">{stat.times_sold}</TableCell>
                      <TableCell className="text-right">${stat.total_revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
