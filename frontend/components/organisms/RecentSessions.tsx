"use client";

import { useRecentSessions } from "@/hooks/sessions/use-recent-sessions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/datetime";


export function RecentSessions() {
  const { data: recentSessions, loading, error } = useRecentSessions();

  const getStatusProps = (status: string) => {
    switch (status) {
      case "Completado":
        return { text: "Completado", color: "bg-green-500", icon: <CheckCircle2 className="mr-1 h-3 w-3" /> };
      case "Pendiente":
        return { text: "Pendiente", color: "bg-gray-400", icon: <Clock className="mr-1 h-3 w-3" /> };
      default:
        return { text: "Error", color: "bg-red-500", icon: <AlertTriangle className="mr-1 h-3 w-3" /> };
    }
  };

  return (
    <Card className="rounded-2xl border-gray-200">
      <CardHeader>
        <CardTitle>Últimas Sesiones Subidas</CardTitle>
        <CardDescription>
          Un resumen de los lotes de fotos más recientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="py-8 text-center text-muted-foreground">
            Cargando sesiones...
          </div>
        )}
        {error && (
          <div className="py-8 text-center text-red-500">
            Error al cargar las sesiones.
          </div>
        )}
        {!loading && !error && (
          <>
            {recentSessions?.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No se han subido sesiones recientemente.
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions?.map((session) => {
                  const status = getStatusProps(session.status);
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{session.photographer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(session.start_time, {
                            month: "short",
                            includeYear: false,
                          })}
                        </p>

                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {session.total_photos} fotos
                        </p>
                        <Badge
                          className={`mt-1 text-xs capitalize text-white ${status.color}`}
                        >
                          {status.icon}
                          {status.text}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
