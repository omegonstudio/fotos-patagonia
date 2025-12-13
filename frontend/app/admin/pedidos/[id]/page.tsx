"use client"

import { useEffect, useState, useMemo } from "react"
import type { ReactElement } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download, Send, Printer } from "lucide-react"
import { useQRCode } from "next-qrcode"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Order, Photo, PrintFormat } from "@/lib/types"
import { usePhotos } from "@/hooks/photos/usePhotos"
import { PRINT_FORMATS } from "@/lib/print-formats"
import { useToast } from "@/hooks/use-toast"
import WatermarkedImage from "@/components/organisms/WatermarkedImage"
import { mapBackendPhotoToPhoto } from "@/lib/mappers/photos"

const QR_CANVAS_ID = "order-download-qr-canvas"
type OrderWithSnakeUrl = Order & { download_url?: string }
type QRCanvasProps = Parameters<ReturnType<typeof useQRCode>["Canvas"]>[0] & { id?: string }

const getPhotoDownloadUrl = (photo?: Photo | null) => {
  if (!photo) return ""
  return photo.urls.original || photo.urls.local || photo.urls.web || photo.urls.thumb || ""
}

const buildPhotoFilename = (photo: Photo) => {
  const sanitizedPlace = photo.place?.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  const baseName = sanitizedPlace && sanitizedPlace.length > 0 ? sanitizedPlace : `foto-${photo.id}`
  return `${baseName}.jpg`
}

const triggerFileDownload = (url: string, filename: string) => {
  if (!url || typeof document === "undefined") return
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.target = "_blank"
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { photos } = usePhotos()
  const [order, setOrder] = useState<Order | null>(null)
  const [email, setEmail] = useState("")
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [isPhotoSelectorOpen, setIsPhotoSelectorOpen] = useState(false)
  const [selectedPrintFormat, setSelectedPrintFormat] = useState<PrintFormat>()
  const [photosForPrint, setPhotosForPrint] = useState<Photo[]>([])
  const [selectedPhotosForFormat, setSelectedPhotosForFormat] = useState<string[]>([])
  const [availablePhotos, setAvailablePhotos] = useState<Photo[]>([])
  const { Canvas } = useQRCode()
  const QRCanvas = Canvas as (props: QRCanvasProps) => ReactElement

  const orderDownloadUrl = useMemo(() => {
    if (!order) return ""
    const directValue = typeof order.downloadUrl === "string" ? order.downloadUrl.trim() : ""
    if (directValue) return directValue
    const snakeCaseValue = typeof (order as OrderWithSnakeUrl).download_url === "string"
      ? ((order as OrderWithSnakeUrl).download_url ?? "").trim()
      : ""
    if (snakeCaseValue) return snakeCaseValue
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return order.id ? `${origin}/descargar/${order.id}` : origin
  }, [order])

  const handleDownloadQR = () => {
    if (!orderDownloadUrl) {
      toast({
        title: "QR no disponible",
        description: "El enlace real del pedido aún no está listo.",
      })
      return
    }

    const canvas = document.getElementById(QR_CANVAS_ID) as HTMLCanvasElement | null
    if (!canvas) {
      toast({
        title: "QR en proceso",
        description: "Aguarda un segundo e inténtalo nuevamente.",
      })
      return
    }

    const link = document.createElement("a")
    link.download = `qr-pedido-${order?.id ?? "sin-id"}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const handlePrintQR = () => {
    if (!orderDownloadUrl) {
      toast({
        title: "QR no disponible",
        description: "No hay enlace para imprimir en este momento.",
      })
      return
    }

    const canvas = document.getElementById(QR_CANVAS_ID) as HTMLCanvasElement | null
    if (!canvas) {
      toast({
        title: "QR en proceso",
        description: "Generando código. Intenta imprimir en unos segundos.",
      })
      return
    }

    const dataUrl = canvas.toDataURL("image/png")
    const printWindow = window.open("", "_blank", "width=600,height=600")
    if (!printWindow) {
      toast({
        title: "Impresión bloqueada",
        description: "Permite ventanas emergentes para imprimir el QR.",
      })
      return
    }

    const finalizePrint = () => {
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Pedido ${order?.id ?? ""}</title>
          <style>
            body {
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              background: #ffffff;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="QR Pedido ${order?.id ?? ""}" />
        </body>
      </html>
    `)
    printWindow.document.close()

    if (printWindow.document.readyState === "complete") {
      finalizePrint()
    } else {
      printWindow.onload = finalizePrint
    }
  }

  // Create photos map
  const mappedPhotos = useMemo(() => photos.map((photo) => mapBackendPhotoToPhoto(photo)), [photos])

  const photosMap = useMemo(() => {
    const map = new Map<string, Photo>()
    mappedPhotos.forEach((photo) => {
      map.set(photo.id, photo)
    })
    return map
  }, [mappedPhotos])

  useEffect(() => {
    const orderId = params.id as string
    // Get order from localStorage
    const existingOrders = localStorage.getItem("orders")
    if (existingOrders) {
      const orders: Order[] = JSON.parse(existingOrders)
      const foundOrder = orders.find((o) => o.id === orderId)
      if (foundOrder) {
        setOrder(foundOrder)
        setEmail(foundOrder.email)
      }
    }
  }, [params.id])

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
    )
  }

  // Separar fotos por tipo (descarga vs impresión)
  const orderItems = order.items || order.photos.map(id => ({ photoId: id, forPrint: false }))
  const downloadPhotos = orderItems
    .filter(item => !item.forPrint)
    .map(item => photosMap.get(item.photoId))
    .filter((p): p is Photo => p !== undefined)
  
  const printPhotos = orderItems
    .filter(item => item.forPrint)
    .map(item => photosMap.get(item.photoId))
    .filter((p): p is Photo => p !== undefined)

  const handleResendEmail = () => {
    toast({
      title: "Email reenviado",
      description: `Se envió el link de descarga a ${email}`,
    })
  }

  const handleDownloadPhoto = (photoId: string) => {
    const photo = photosMap.get(photoId)
    if (!photo) {
      toast({
        title: "Foto no encontrada",
        description: "No pudimos encontrar la imagen seleccionada.",
      })
      return
    }

    const downloadUrl = getPhotoDownloadUrl(photo)
    if (!downloadUrl) {
      toast({
        title: "Descarga no disponible",
        description: "La foto no tiene una URL válida para descargar.",
      })
      return
    }

    triggerFileDownload(downloadUrl, buildPhotoFilename(photo))
    toast({
      title: "Descarga iniciada",
      description: "La foto se está descargando en alta resolución",
    })
  }

  const handleDownloadAllPrint = () => {
    if (!printPhotos.length) return

    toast({
      title: "Descarga iniciada",
      description: `Descargando ${printPhotos.length} fotos para impresión`,
    })

    printPhotos.forEach((photo, index) => {
      const downloadUrl = getPhotoDownloadUrl(photo)
      if (!downloadUrl) return

      setTimeout(() => {
        triggerFileDownload(downloadUrl, buildPhotoFilename(photo))
      }, index * 200)
    })
  }

  const handlePrintPhotos = () => {
    setPhotosForPrint(printPhotos)
    setSelectedPhotosForFormat(printPhotos.map(p => p.id))
    setIsPrintDialogOpen(true)
  }

  const handleFormatChange = (format: PrintFormat) => {
    setSelectedPrintFormat(format)
    const formatConfig = PRINT_FORMATS.find(f => f.id === format.id)
    
    // Si el formato requiere una cantidad específica
    if (formatConfig?.requiredPhotos) {
      const currentSelected = selectedPhotosForFormat.length
      
      // Si tenemos más fotos de las requeridas, recortar
      if (currentSelected > formatConfig.requiredPhotos) {
        setSelectedPhotosForFormat(prev => prev.slice(0, formatConfig.requiredPhotos))
      }
      // Si tenemos menos, mantener las que tenemos (se pedirán más al confirmar)
    } else {
      // Para formatos sin requerimiento específico, usar todas las fotos para impresión
      setSelectedPhotosForFormat(printPhotos.map(p => p.id))
    }
  }

  const confirmPrint = () => {
    const formatConfig = PRINT_FORMATS.find(f => f.id === selectedPrintFormat?.id)
    
    // Verificar si necesitamos seleccionar fotos específicas
    if (formatConfig?.requiredPhotos) {
      const currentSelected = selectedPhotosForFormat.length
      
      if (currentSelected < (formatConfig?.requiredPhotos || 0)) {
        // Abrir selector de fotos
        // Obtener todas las fotos del pedido para seleccionar las faltantes
        const allOrderPhotos = orderItems
          .map(item => photosMap.get(item.photoId))
          .filter((p): p is Photo => p !== undefined)
        
        setAvailablePhotos(allOrderPhotos)
        setIsPhotoSelectorOpen(true)
        return
      } else if (currentSelected > formatConfig.requiredPhotos) {
        toast({
          title: "Error",
          description: `Debes seleccionar exactamente ${formatConfig.requiredPhotos} fotos para este formato`,
        })
        return
      }
    }
    
    const formatLabel = formatConfig?.name || selectedPrintFormat?.name
    toast({
      title: "Impresión solicitada",
      description: `Se enviarán ${selectedPhotosForFormat.length} fotos a imprimir en formato ${formatLabel}`,
    })
    setIsPrintDialogOpen(false)
    setSelectedPhotosForFormat([])
  }

  const togglePhotoSelection = (photoId: string) => {
    const formatConfig = PRINT_FORMATS.find(f => f.id === selectedPrintFormat?.id)
    const maxPhotos = formatConfig?.requiredPhotos
    
    if (selectedPhotosForFormat.includes(photoId)) {
      setSelectedPhotosForFormat(prev => prev.filter(id => id !== photoId))
    } else {
      if (maxPhotos && selectedPhotosForFormat.length >= maxPhotos) {
        toast({
          title: "Límite alcanzado",
          description: `Solo puedes seleccionar ${maxPhotos} fotos para este formato`,
        })
        return
      }
      setSelectedPhotosForFormat(prev => [...prev, photoId])
    }
  }

  const confirmPhotoSelection = () => {
    const formatConfig = PRINT_FORMATS.find(f => f.id === selectedPrintFormat?.id)
    
    if (formatConfig?.requiredPhotos && selectedPhotosForFormat.length !== formatConfig.requiredPhotos) {
      toast({
        title: "Selección incompleta",
        description: `Debes seleccionar exactamente ${formatConfig.requiredPhotos} fotos`,
      })
      return
    }
    
    setIsPhotoSelectorOpen(false)
    
    // Ahora confirmar la impresión
    const formatLabel = formatConfig?.name || selectedPrintFormat?.name
    toast({
      title: "Impresión solicitada",
      description: `Se enviarán ${selectedPhotosForFormat.length} fotos a imprimir en formato ${formatLabel}`,
    })
    setIsPrintDialogOpen(false)
    setSelectedPhotosForFormat([])
  }

  const getStatusBadge = (status: Order["status"]) => {
    const statusConfig = {
      enviado: { label: "Enviado", className: "bg-blue-500/10 text-blue-600" },
      rechazado: { label: "Rechazado", className: "bg-red-500/10 text-red-600" },
      en_espera: { label: "En Espera", className: "bg-yellow-500/10 text-yellow-600" },
      pagado: { label: "Pagado", className: "bg-green-500/10 text-green-600" },
      entregado: { label: "Entregado", className: "bg-green-600/10 text-green-700" },
    }
    return statusConfig[status]
  }

  const statusInfo = getStatusBadge(order.status)

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
          <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
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
                <Label className="text-sm text-muted-foreground">Canal</Label>
                <p className="font-medium capitalize">{order.channel}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Método de Pago</Label>
                <p className="font-medium capitalize">{order.paymentMethod}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Fecha de Creación</Label>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString("es-AR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
                <Button onClick={handleResendEmail} className="gap-2 rounded-xl bg-primary text-foreground">
                  <Send className="h-4 w-4" />
                  Reenviar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fotos para Descarga Digital */}
          {downloadPhotos.length > 0 && (
            <Card className="rounded-2xl border-gray-200">
              <CardHeader>
                <CardTitle>Fotos para Descarga Digital ({downloadPhotos.length})</CardTitle>
                <CardDescription>Miniaturas para descargar en alta resolución</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {downloadPhotos.map((photo) => (
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
                          onClick={() => handleDownloadPhoto(photo.id)}
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

          {/* Fotos para Impresión */}
          {printPhotos.length > 0 && (
            <Card className="rounded-2xl border-gray-200 border-primary/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Printer className="h-5 w-5 text-primary" />
                      Fotos para Impresión ({printPhotos.length})
                    </CardTitle>
                    <CardDescription>Fotos seleccionadas para imprimir físicamente</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadAllPrint}
                      className="gap-2 rounded-xl"
                    >
                      <Download className="h-4 w-4" />
                      Descargar Todas
                    </Button>
                    <Button
                      onClick={handlePrintPhotos}
                      className="gap-2 rounded-xl bg-primary text-foreground"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {printPhotos.map((photo) => (
                    <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-muted border-2 border-primary/20">
                      <WatermarkedImage
                        src={photo.urls.thumb || "/placeholder.svg"}
                        alt={photo.place || "Foto"}
                        fill
                        objectFit="cover"
                        className="transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="sm"
                          onClick={() => handleDownloadPhoto(photo.id)}
                          className="gap-2 rounded-lg bg-primary text-foreground"
                        >
                          <Download className="h-4 w-4" />
                          Descargar
                        </Button>
                      </div>
                      {/* Badge indicando que es para impresión */}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary text-foreground">
                          <Printer className="h-3 w-3 mr-1" />
                          Imprimir
                        </Badge>
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
                      color: {
                        dark: "#000000",
                        light: "#ffffff",
                      },
                    }}
                  />

                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Escanea este código para acceder al link de descarga
                </p>
                <Button onClick={handleDownloadQR} variant="outline" className="w-full gap-2 rounded-xl bg-transparent">
                  <Download className="h-4 w-4" />
                  Descargar QR
                </Button>
                <Button onClick={handlePrintQR} variant="outline" className="w-full gap-2 rounded-xl bg-transparent">
                  <Printer className="h-4 w-4" />
                  Imprimir QR
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>



      {/* Modal de Selección de Fotos */}
      <Dialog open={isPhotoSelectorOpen} onOpenChange={setIsPhotoSelectorOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Seleccionar Fotos para Impresión</DialogTitle>
            <DialogDescription>
              Selecciona {PRINT_FORMATS.find(f => f.id === selectedPrintFormat?.id)?.requiredPhotos} fotos para el formato {PRINT_FORMATS.find(f => f.id === selectedPrintFormat?.id)?.name}
            </DialogDescription>
          </DialogHeader>
          
            <div className="py-4 overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Fotos seleccionadas: {selectedPhotosForFormat.length} / {PRINT_FORMATS.find(f => f.id === selectedPrintFormat?.id)?.requiredPhotos}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 md:grid-cols-4">
              {availablePhotos.map((photo) => {
                const isSelected = selectedPhotosForFormat.includes(photo.id)
                return (
                  <div
                    key={photo.id}
                    onClick={() => togglePhotoSelection(photo.id)}
                    className={`relative aspect-square overflow-hidden rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'ring-4 ring-primary shadow-lg' 
                        : 'hover:ring-2 hover:ring-primary/50'
                    }`}
                  >
                    <WatermarkedImage
                      src={photo.urls.thumb || "/placeholder.svg"}
                      alt={photo.place || "Foto"}
                      fill
                      objectFit="cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold">
                          {selectedPhotosForFormat.indexOf(photo.id) + 1}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsPhotoSelectorOpen(false)
                setSelectedPhotosForFormat(printPhotos.map(p => p.id))
              }} 
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmPhotoSelection} 
              className="gap-2 rounded-xl bg-primary text-foreground"
              disabled={
                PRINT_FORMATS.find(f => f.id === selectedPrintFormat?.id)?.requiredPhotos !== selectedPhotosForFormat.length
              }
            >
              Confirmar Selección
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
