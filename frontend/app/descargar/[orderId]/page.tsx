"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Download, AlertCircle, Calendar } from "lucide-react"
import { Header } from "@/components/organisms/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Order, OrderItem } from "@/lib/types"
import { apiFetch } from "@/lib/api"
import WatermarkedImage from "@/components/organisms/WatermarkedImage"

// Define a type for the fetched order that includes photo details in items
type OrderWithPhotoItems = Omit<Order, "items"> & {
  items: OrderItem[]
}

export default function DescargarPage() {
  const params = useParams()
  const publicId = params.orderId as string // The param is the public_id (UUID)
  const [order, setOrder] = useState<OrderWithPhotoItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (publicId) {
      const fetchOrder = async () => {
        try {
          setLoading(true)
          const fetchedOrder = await apiFetch<OrderWithPhotoItems>(`/orders/public/${publicId}`)
          setOrder(fetchedOrder)
        } catch (err) {
          setError("No pudimos encontrar un pedido con este código. Verifica el link o contacta con soporte.")
          console.error("Failed to fetch order:", err)
        } finally {
          setLoading(false)
        }
      }
      fetchOrder()
    }
  }, [publicId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-md text-center">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="mb-4 text-3xl font-bold">Pedido no encontrado</h1>
            <p className="mb-8 text-muted-foreground">{error}</p>
            <Link href="/galeria">
              <Button className="rounded-xl bg-primary font-semibold text-foreground hover:bg-primary-hover">
                Volver a la galería
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const orderPhotos = order.items.map((item) => item.photo).filter(Boolean)
  const canDownload = order.order_status === "PAID" || order.order_status === "COMPLETED"

  const handleDownload = (photoUrl: string) => {
    window.open(photoUrl, "_blank")
  }

  const handleDownloadAll = () => {
    alert("En una aplicación real, esto descargaría todas las fotos en un archivo ZIP")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Download className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mb-2 text-4xl font-bold text-balance">Descarga tus Fotos</h1>
            <p className="text-lg text-muted-foreground">Pedido #{order.id}</p>
          </div>

          {/* Order Status */}
          <Card className="mb-6 rounded-2xl border-gray-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Estado del Pedido</CardTitle>
                  <CardDescription className="mt-1">
                    {new Date(order.created_at).toLocaleDateString("es-AR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardDescription>
                </div>
                <Badge
                  className={
                    canDownload
                      ? "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                      : "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400"
                  }
                >
                  {canDownload ? "Listo para descargar" : "Pendiente de pago"}
                </Badge>
              </div>
            </CardHeader>
            {!canDownload && (
              <CardContent>
                <div className="rounded-xl bg-yellow-500/10 p-4">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Tu pedido está pendiente de confirmación de pago. Una vez confirmado, podrás descargar tus fotos.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Download All Button */}
          {canDownload && (
            <div className="mb-6">
              <Button
                onClick={handleDownloadAll}
                className="w-full rounded-xl bg-primary py-6 text-lg font-semibold text-foreground hover:bg-primary-hover"
              >
                <Download className="mr-2 h-5 w-5" />
                Descargar Todas las Fotos ({orderPhotos.length})
              </Button>
            </div>
          )}

          {/* Photos Grid */}
          <Card className="rounded-2xl border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle>Tus Fotos ({orderPhotos.length})</CardTitle>
              <CardDescription>
                {canDownload
                  ? "Haz clic en cada foto para descargarla individualmente"
                  : "Las fotos estarán disponibles una vez confirmado el pago"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {orderPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative overflow-hidden rounded-xl border border-gray-200 bg-muted"
                  >
                    <div className="aspect-square relative">
                      <WatermarkedImage
                        src={photo.watermark_url || "/placeholder.svg"}
                        alt={photo.description || "Foto"}
                        fill
                        objectFit="cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-semibold">{photo.description || "Foto"}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                      {canDownload && (
                        <Button
                          onClick={() => handleDownload(photo.url)}
                          size="sm"
                          className="mt-3 w-full rounded-lg bg-primary text-foreground hover:bg-primary-hover"
                        >
                          <Download className="mr-2 h-3 w-3" />
                          Descargar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="mt-6 rounded-2xl border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle>¿Necesitas ayuda?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Las fotos están disponibles en alta resolución</p>
              <p>• Puedes descargarlas cuantas veces necesites</p>
              <p>• Si tienes problemas, contacta a soporte@fotospatagonia.com</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
