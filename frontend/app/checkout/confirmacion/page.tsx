"use client"

import { useEffect, useState, Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Download, Mail, ArrowRight, Calendar, MapPin, QrCode, ImageIcon } from "lucide-react"
import QRCodeLib from "qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Order, Photo } from "@/lib/types"
import { usePhotos } from "@/hooks/photos/usePhotos"
import { mapBackendPhotoToPhoto } from "@/lib/mappers/photos"
import { usePresignedUrl } from "@/hooks/photos/usePresignedUrl"
import { buildThumbObjectName } from "@/lib/photo-thumbnails"
import { formatDateTime, formatPhotoDate } from "@/lib/datetime"

// Sub-componente para cargar la imagen de la foto en la confirmación
function ConfirmationPhotoThumbnail({ photo }: { photo: Photo }) {
  const previewObjectName =
    photo.previewObjectName ?? buildThumbObjectName(photo.objectName);
  const { url, loading, error } = usePresignedUrl(previewObjectName);

  if (loading) {
    return (
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        <ImageIcon className="h-8 w-8 text-gray-400 animate-pulse" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-red-100 flex items-center justify-center text-red-500 text-xs text-center p-1">
        Error
      </div>
    );
  }

  return (
    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
      <img
        src={url}
        alt={photo.place || "Foto"}
        className="h-full w-full object-cover"
      />
    </div>
  );
}


function ConfirmacionContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const { photos } = usePhotos()
  const [order, setOrder] = useState<Order | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")

  const mappedPhotos = useMemo(() => photos.map((photo) => mapBackendPhotoToPhoto(photo)), [photos])

  const photosMap = useMemo(() => {
    const map = new Map<string, Photo>()
    mappedPhotos.forEach((photo) => {
      map.set(photo.id, photo)
    })
    return map
  }, [mappedPhotos])

  useEffect(() => {
    console.log("[v0] Order ID from URL:", orderId)

    if (orderId) {
      const existingOrders = localStorage.getItem("orders")
      console.log("[v0] Existing orders from localStorage:", existingOrders)

      if (existingOrders) {
        const orders: Order[] = JSON.parse(existingOrders)
        const foundOrder = orders.find((o) => o.id === orderId)
        console.log("[v0] Found order:", foundOrder)
        setOrder(foundOrder || null)

        if (foundOrder) {
          const downloadUrl = `${window.location.origin}/descargar/${foundOrder.id}`
          console.log("[v0] Generating QR code for URL:", downloadUrl)

          QRCodeLib.toDataURL(downloadUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          })
            .then((url) => {
              console.log("[v0] QR code generated successfully")
              setQrCodeUrl(url)
            })
            .catch((err) => console.error("[v0] Error generating QR code:", err))
        }
      }
    }
  }, [orderId])

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-4 text-3xl font-bold">Pedido no encontrado</h1>
          <p className="mb-8 text-muted-foreground">No pudimos encontrar la información de tu pedido.</p>
          <Link href="/galeria">
            <Button className="rounded-xl bg-primary font-semibold text-foreground hover:bg-primary-hover">
              Volver a la galería
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const orderPhotos = (order.photos ?? [])
    .map((photoId) => photosMap.get(photoId))
    .filter((photo): photo is Photo => photo !== undefined)

  const formatOrderDate = () => {
    const dateValue = order.created_at ?? order.createdAt;
    if (!dateValue) return "Sin fecha";

    const formatted = formatDateTime(dateValue);
    return formatted || "Fecha inválida";
  };

  const getStatusBadge = (status: Order["status"]) => {
    const statusConfig = {
      enviado: { label: "Enviado", className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" },
      rechazado: { label: "Rechazado", className: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400" },
      en_espera: {
        label: "En Espera",
        className: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
      },
      pagado: {
        label: "Pagado",
        className: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
      },
      entregado: {
        label: "Entregado",
        className: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
      },
    } as const

    if (!status || !(status in statusConfig)) {
      return { label: "Desconocido", className: "bg-gray-500/10 text-gray-600" }
    }

    return statusConfig[status]
  }

  const statusInfo = getStatusBadge(order.status)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="mb-2 text-4xl font-bold text-balance">¡Pedido Confirmado!</h1>
          <p className="text-lg text-muted-foreground">
            {order.channel === "web"
              ? "Hemos recibido tu pedido y te enviaremos las fotos por email"
              : "Tu pedido está reservado. Pasa por nuestro local para completar el pago"}
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6 rounded-2xl border-gray-200 shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Pedido #{order.id}</CardTitle>
                <CardDescription className="mt-1">
                  {formatOrderDate()}
                </CardDescription>
              </div>
              <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{order.email}</p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">Canal de Pago</p>
                <p className="font-medium capitalize">{order.channel === "web" ? "Internet" : "Local"}</p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">Método de Pago</p>
                <p className="font-medium capitalize">{order.paymentMethod?.replace("_", " ")}</p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-primary">${order.total}</p>
              </div>
            </div>

            {order.localOrderNumber && (
              <div className="rounded-xl bg-muted p-4">
                <p className="mb-1 text-sm font-medium">Número de Orden Local</p>
                <p className="text-lg font-bold">{order.localOrderNumber}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Presenta este número al realizar el pago en nuestro local
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Section */}
        <Card className="mb-6 rounded-2xl border-gray-200 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <CardTitle>Código QR de Descarga</CardTitle>
            </div>
            <CardDescription>Escanea este código para acceder al link de descarga de tus fotos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              {qrCodeUrl ? (
                <div className="rounded-xl border-4 border-primary/20 bg-white p-4">
                  <img
                    src={qrCodeUrl || "/placeholder.svg"}
                    alt="QR Code para descargar fotos"
                    className="h-auto w-64"
                  />
                </div>
              ) : (
                <div className="flex h-64 w-64 items-center justify-center rounded-xl border-4 border-primary/20 bg-white p-4">
                  <p className="text-sm text-muted-foreground">Generando código QR...</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">También puedes usar este link directamente:</p>
                <Link
                  href={`/descargar/${order.id}`}
                  className="mt-2 inline-block rounded-lg bg-muted px-4 py-2 text-sm font-mono hover:bg-muted/80"
                >
                  {typeof window !== "undefined" ? window.location.origin : ""}/descargar/{order.id}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="mb-6 rounded-2xl border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle>Fotos Incluidas ({orderPhotos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderPhotos.map((photo) => (
                <div key={photo.id} className="flex items-center gap-4 rounded-xl border border-gray-200 p-3">
                  <ConfirmationPhotoThumbnail photo={photo} />
                  <div className="flex-1">
                    <p className="font-semibold">{photo.place}</p>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {photo.takenAt && formatPhotoDate(photo.takenAt)}
                      </span>
                      {photo.timeSlot && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {photo.timeSlot}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-semibold">${photo.price}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6 rounded-2xl border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle>Próximos Pasos</CardTitle>
          </CardHeader>
          <CardContent>
            {order.channel === "web" ? (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Procesaremos tu pago</p>
                    <p className="text-sm text-muted-foreground">
                      Recibirás un email con las instrucciones de pago en los próximos minutos
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Confirma el pago</p>
                    <p className="text-sm text-muted-foreground">Una vez confirmado, prepararemos tus fotos</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Descarga tus fotos</p>
                    <p className="text-sm text-muted-foreground">
                      Te enviaremos un link de descarga a tu email en máximo 24 horas
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Visita nuestro local</p>
                    <p className="text-sm text-muted-foreground">
                      Dirección: Av. San Martín 123, Bariloche - Horario: Lun-Vie 9-18hs
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Presenta tu número de orden</p>
                    <p className="text-sm text-muted-foreground">Muestra el número {order.localOrderNumber}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Completa el pago y descarga</p>
                    <p className="text-sm text-muted-foreground">
                      Paga en efectivo o tarjeta y descarga tus fotos inmediatamente
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/galeria" className="flex-1">
            <Button variant="outline" className="w-full rounded-xl bg-transparent">
              Seguir Explorando
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/descargar/${order.id}`} className="flex-1">
            <Button className="w-full rounded-xl bg-primary font-semibold text-foreground hover:bg-primary-hover">
              <Download className="mr-2 h-4 w-4" />
              Descargar Fotos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-md text-center">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  )
}
