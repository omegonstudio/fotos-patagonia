"use client";

import { useEffect, useState, useMemo } from "react";
import type { ReactElement } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Send, Printer } from "lucide-react";
import { useQRCode } from "next-qrcode";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Order, Photo, PrintFormat, OrderItem as OrderItemType } from "@/lib/types";
import { usePhotos } from "@/hooks/photos/usePhotos";
import { PRINT_FORMATS } from "@/lib/print-formats";
import { useToast } from "@/hooks/use-toast";
import WatermarkedImage from "@/components/organisms/WatermarkedImage";
import { mapBackendPhotoToPhoto } from "@/lib/mappers/photos";
import { useOrders } from "@/hooks/orders/useOrders";

const QR_CANVAS_ID = "order-download-qr-canvas";

// Helper functions (assuming they are defined elsewhere or here)
const getPhotoDownloadUrl = (photo?: Photo | null) => {
  if (!photo) return "";
  return photo.urls.original || photo.urls.web || photo.urls.thumb || "";
};

const buildPhotoFilename = (photo: Photo) => {
  const sanitizedPlace = photo.place?.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || `foto-${photo.id}`;
  return `${sanitizedPlace}.jpg`;
};

const triggerFileDownload = (url: string, filename: string) => {
    if (!url || typeof document === "undefined") return;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer"; // Security best practice
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
};


export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { data: orderData, loading, error } = useOrders(orderId);
  const order = useMemo(() => (Array.isArray(orderData) ? null : orderData), [orderData]);

  const { toast } = useToast();
  const { photos } = usePhotos();
  const [email, setEmail] = useState("");
  const { Canvas } = useQRCode();
  const QRCanvas = Canvas as (props: any) => ReactElement;

  useEffect(() => {
    if (order?.user?.email) {
      setEmail(order.user.email);
    }
  }, [order]);

  const photosMap = useMemo(() => {
    const map = new Map<string, Photo>();
    if (photos) {
      photos.forEach((photo) => {
        map.set(photo.id.toString(), mapBackendPhotoToPhoto(photo));
      });
    }
    return map;
  }, [photos]);

  const orderDownloadUrl = useMemo(() => {
    if (!order) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/descargar/${order.id}`;
  }, [order]);

  const getStatusBadge = (status: Order["order_status"] | undefined) => {
    const statusConfig = {
      pending: { label: "Pendiente", className: "bg-yellow-500/10 text-yellow-600" },
      paid: { label: "Pagado", className: "bg-green-500/10 text-green-600" },
      completed: { label: "Completado", className: "bg-blue-500/10 text-blue-600" },
      rejected: { label: "Rechazado", className: "bg-red-500/10 text-red-600" },
    } as const;

    if (!status || !(status in statusConfig)) {
      return {
        label: "Desconocido",
        className: "bg-gray-500/10 text-gray-600",
      };
    }
    return statusConfig[status as keyof typeof statusConfig];
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        Cargando datos del pedido...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-red-500">
        Error al cargar el pedido: {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-heading">Pedido no encontrado</h1>
          <Link href="/admin/pedidos">
            <Button className="rounded-xl bg-primary text-foreground">Volver a pedidos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusBadge(order.order_status);
  const allOrderPhotos = (order.items ?? [])
  .flatMap((item) => {
    const id = item.photo_id
    if (id == null) return [] // item sin foto: lo ignoramos
    const photo = photosMap.get(String(id))
    return photo ? [photo] : []
  })


  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/admin/pedidos"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a pedidos
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-heading">Pedido #{order.id}</h1>
          {statusInfo && <Badge className={statusInfo.className}>{statusInfo.label}</Badge>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-gray-200">
            <CardHeader>
              <CardTitle>Información del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm text-muted-foreground">Método de Pago</Label>
                <p className="font-medium capitalize">{order.payment_method?.replace("_", " ") || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Fecha de Creación</Label>
                <p className="font-medium">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString("es-AR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Fecha no disponible"}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Total</Label>
                <p className="text-2xl font-bold text-primary">${order.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200">
            <CardHeader>
              <CardTitle>Email del Cliente</CardTitle>
              <CardDescription>Edita el email y reenvía el link de descarga</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
                </div>
                <Button onClick={() => toast({ title: "Función no implementada" })} className="gap-2 rounded-xl bg-primary text-foreground">
                  <Send className="h-4 w-4" />
                  Reenviar
                </Button>
              </div>
            </CardContent>
          </Card>

          {allOrderPhotos.length > 0 && (
            <Card className="rounded-2xl border-gray-200">
              <CardHeader>
                <CardTitle>Fotos del Pedido ({allOrderPhotos.length})</CardTitle>
                <CardDescription>Miniaturas para descargar en alta resolución</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {allOrderPhotos.map((photo) => (
                    <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
                      <WatermarkedImage
                        src={photo.urls.thumb || "/placeholder.svg"}
                        alt={photo.place || "Foto"}
                        fill
                        opacity={0.5}
                        objectFit="cover"
                        className="transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="sm"
                          onClick={() => triggerFileDownload(getPhotoDownloadUrl(photo), buildPhotoFilename(photo))}
                          className="gap-2 rounded-lg bg-primary text-foreground"
                        >
                          <Download className="h-4 w-4" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        <div className="lg:col-span-1">
          <Card className="rounded-2xl border-gray-200">
            <CardHeader>
              <CardTitle>QR de Descarga</CardTitle>
              <CardDescription>Código QR para acceso rápido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-88 w-88  items-center justify-center rounded-xl bg-muted">
                  <QRCanvas
                    id={QR_CANVAS_ID}
                    text={orderDownloadUrl}
                    options={{
                      margin: 2,
                      scale: 8,
                      width: 300,
                      color: { dark: "#000000", light: "#ffffff" },
                    }}
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Escanea este código para acceder al link de descarga
                </p>
                <Button onClick={() => toast({ title: "Función no implementada" })} variant="outline" className="w-full gap-2 rounded-xl bg-transparent">
                  <Download className="h-4 w-4" />
                  Descargar QR
                </Button>
                <Button onClick={() => toast({ title: "Función no implementada" })} variant="outline" className="w-full gap-2 rounded-xl bg-transparent">
                  <Printer className="h-4 w-4" />
                  Imprimir QR
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
