"use client";

import { useEffect, useState, useMemo } from "react";
import type { ReactElement } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Send, Printer, ImageIcon } from "lucide-react";
import { useQRCode } from "next-qrcode";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Order, OrderItem, Photo } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { usePhotos } from "@/hooks/photos/usePhotos";
import { useToast } from "@/hooks/use-toast";
import WatermarkedImage from "@/components/organisms/WatermarkedImage";
import { mapBackendPhotoToPhoto } from "@/lib/mappers/photos";
import { useOrders } from "@/hooks/orders/useOrders";
import { usePresignedUrl } from "@/hooks/photos/usePresignedUrl";
import { formatDateTime } from "@/lib/datetime";

const QR_CANVAS_ID = "order-download-qr-canvas";

const buildPhotoFilename = (photo: Photo) => {
  const sanitizedPlace = photo.place?.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || `foto-${photo.id}`;
  return `${sanitizedPlace}.jpg`;
};

const triggerFileDownload = async (url: string, filename: string) => {
  try {
    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) throw new Error("Error al descargar archivo");

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();

    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Download failed", error);
  }
};


interface PresignedUrlResponse {
  url: string;
}

// Sub-componente para manejar la lógica de la URL presignada
function PhotoGridItem({ photo }: { photo: Photo }) {
  const { url, loading, error } = usePresignedUrl(photo.objectName);

  if (loading) {
    return (
      <div className="group relative aspect-square overflow-hidden rounded-xl bg-muted flex items-center justify-center">
        <ImageIcon className="h-10 w-10 text-gray-400 animate-pulse" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className="group relative aspect-square overflow-hidden rounded-xl bg-red-100 flex items-center justify-center text-red-500 text-xs text-center p-2">
        Error al cargar imagen
      </div>
    );
  }

  return (
    <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
      <WatermarkedImage
        src={url}
        alt={photo.place || "Foto"}
        fill
        opacity={0.5}
        objectFit="cover"
        className="transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          size="sm"
          onClick={() => triggerFileDownload(url, buildPhotoFilename(photo))}
          className="gap-2 rounded-lg bg-primary text-foreground"
        >
          <Download className="h-4 w-4" />
          Descargar
        </Button>
      </div>
    </div>
  );
}


export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { data: orderData, loading, error, sendOrderEmail } = useOrders(orderId);
  const order = useMemo(() => (Array.isArray(orderData) ? null : orderData), [orderData]);

  const { toast } = useToast();
  const { photos } = usePhotos();
  const [email, setEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { Canvas } = useQRCode();
  const QRCanvas = Canvas as (props: any) => ReactElement;

  useEffect(() => {
    if (order?.customer_email) {
      setEmail(order.customer_email);
    }
  }, [order]);

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Email no válido",
        description: "Por favor, introduce una dirección de correo.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      await sendOrderEmail(orderId, email);
      toast({
        title: "Correo reenviado",
        description: `El correo de la orden se ha reenviado a ${email}.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo reenviar el correo. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

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
    return `${origin}/pedidos/${order.public_id}`;
  }, [order]);

  const orderPhotoItems = useMemo(() => {
    if (!order?.items || order.items.length === 0) return [];

    return order.items.flatMap((item: OrderItem) => {
      const id = item.photo_id;
      if (id == null) return [];
      const photo = photosMap.get(String(id));
      if (!photo) return [];
      return [{ item, photo }];
    });
  }, [order?.items, photosMap]);

  const allOrderPhotos = useMemo(() => {
    const seen = new Set<string>();
    return orderPhotoItems
      .filter(({ photo }) => {
        if (seen.has(photo.id)) return false;
        seen.add(photo.id);
        return true;
      })
      .map(({ photo }) => photo);
  }, [orderPhotoItems]);

  const digitalOrderPhotos = useMemo(() => {
    const seen = new Set<string>();
    return orderPhotoItems
      .filter(({ item }) => !item.format)
      .filter(({ photo }) => {
        if (seen.has(photo.id)) return false;
        seen.add(photo.id);
        return true;
      })
      .map(({ photo }) => photo);
  }, [orderPhotoItems]);

  const printOrderPhotos = useMemo(() => {
    const seen = new Set<string>();
    return orderPhotoItems
      .filter(({ item }) => !!item.format)
      .filter(({ photo }) => {
        if (seen.has(photo.id)) return false;
        seen.add(photo.id);
        return true;
      })
      .map(({ photo }) => photo);
  }, [orderPhotoItems]);

  const handleDownloadMultiple = async (photosToDownload: Photo[], emptyMessage: string) => {
    if (!photosToDownload.length) {
      toast({ title: emptyMessage });
      return;
    }
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const downloadPromises = photosToDownload.map(async (photo) => {
        const response = await apiFetch<PresignedUrlResponse>(
          `/photos/presigned-url/?object_name=${encodeURIComponent(photo.objectName)}`
        );
        if (!response?.url) {
          throw new Error(`URL presignada no disponible para ${photo.objectName}`);
        }
        await triggerFileDownload(response.url, buildPhotoFilename(photo));
      });

      await Promise.all(downloadPromises);

      toast({
        title: "Descargas iniciadas",
        description: `${photosToDownload.length} foto${photosToDownload.length === 1 ? "" : "s"} en proceso`,
      });
    } catch (downloadError) {
      console.error(downloadError);
      toast({
        title: "Error al descargar fotos",
        description: "Reintenta en unos instantes",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAllPhotos = async () => {
    await handleDownloadMultiple(allOrderPhotos, "No hay fotos en este pedido");
  };


  const handleDownloadDigitalPhotos = async () => {
    await handleDownloadMultiple(digitalOrderPhotos, "No hay fotos digitales para descargar");
  };

  const handleDownloadPrintPhotos = async () => {
    await handleDownloadMultiple(printOrderPhotos, "No hay fotos para imprimir");
  };

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
  const createdAtLabel = order.created_at ? formatDateTime(order.created_at) : "";


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
                  {createdAtLabel || "Fecha no disponible"}
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
                <Button onClick={handleResendEmail} disabled={isSendingEmail} className="gap-2 rounded-xl bg-primary text-foreground">
                  <Send className="h-4 w-4" />
                  {isSendingEmail ? "Enviando..." : "Reenviar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {allOrderPhotos.length > 0 && (
            <Card className="rounded-2xl border-gray-200">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Fotos del Pedido ({allOrderPhotos.length})</CardTitle>
                  <CardDescription>Miniaturas separadas por digital e impresión</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" className="rounded-xl" onClick={handleDownloadAllPhotos} disabled={isDownloading}>
                    {isDownloading ? "Descargando..." : "Descargar todas"}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={handleDownloadDigitalPhotos} disabled={isDownloading}>
                    {isDownloading ? "Descargando..." : "Descargar fotos"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={handleDownloadPrintPhotos}
                    disabled={isDownloading}
                  >
                    {isDownloading ? "Descargando..." : "Descargar imprimir"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {digitalOrderPhotos.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Fotos digitales</h3>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {digitalOrderPhotos.map((photo) => (
                          <PhotoGridItem key={photo.id} photo={photo} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay fotos digitales en este pedido.</p>
                  )}

                  {printOrderPhotos.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <Printer className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-lg font-semibold">Fotos para imprimir</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Se descargarán en alta resolución listas para impresión.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {printOrderPhotos.map((photo) => (
                          <PhotoGridItem key={photo.id} photo={photo} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay fotos para imprimir en este pedido.</p>
                  )}
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
