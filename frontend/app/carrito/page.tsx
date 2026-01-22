"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ShoppingCart, Heart, Tag, ArrowRight, Save, Upload, Trash2, Printer } from "lucide-react"
import { Header } from "@/components/organisms/header"
import { CartItem } from "@/components/molecules/cart-item"
import { PrintFormatModal } from "@/components/molecules/print-format-modal"
import { PhotoViewerModal } from "@/components/organisms/photo-viewer-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { useCartStore, useAuthStore } from "@/lib/store"
import { usePhotos } from "@/hooks/photos/usePhotos"
import { useCombos } from "@/hooks/combos/useCombos"
import { useToast } from "@/hooks/use-toast"
import { isAdmin } from "@/lib/types"
import type { Photo, PrintFormat } from "@/lib/types"
import { mapBackendPhotoToPhoto } from "@/lib/mappers/photos"
import { getPackSize } from "@/lib/print-formats"
import Loading from "./loading"
import { apiFetch } from "@/lib/api"

export default function CarritoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { photos, refetch: fetchPhotos, fetchPhotosByIds, loading: isLoadingPhotos } = usePhotos()
  const [isStoreHydrated, setIsStoreHydrated] = useState(false)

  const {
    items,
    printSelections,
    email,
    discountCode,
    discountInfo,
    subtotal,
    total,
    savedSessionId,
    printsSubtotalEffective,
    printsManualEnabled,
    digitalSubtotalEffective,
    digitalManualEnabled,
    totalEffective,
    removeItem,
    toggleFavorite,
    togglePrinter,
    addPrintSelection,
    removePhotosFromSelection,
    clearPrintSelections,
    clearNonFavorites,
    setEmail,
    applyDiscount,
    saveSession,
    loadSession,
    clearCart,
    updateTotals,
    selectedCombo,
    setSelectedCombo,
    setManualPrintsSubtotal,
    setManualDigitalSubtotal,
    resetManualPrintsSubtotal,
    resetManualDigitalSubtotal,
  } = useCartStore()
  
  useEffect(() => {
    // El store de zustand persistido se hidrata después del montaje inicial.
    // Este efecto se asegura de que sepamos cuándo está listo.
    setIsStoreHydrated(true)
  }, [])
  
  useEffect(() => {
    if (isStoreHydrated) {
      const photoIds = items.map((item) => parseInt(item.photoId, 10));
      fetchPhotosByIds(photoIds);
    }
  }, [isStoreHydrated, items, fetchPhotosByIds]);

  const photoCache = useRef(new Map<string, Photo>())

  const mappedPhotos = useMemo(() => {
    return photos.map((backendPhoto) => {
      const id = String(backendPhoto.id)

const cached = photoCache.current.get(id)
if (cached) return cached

const mapped = mapBackendPhotoToPhoto(backendPhoto)
photoCache.current.set(id, mapped)
return mapped
    })
  }, [photos])
  
  const photosMap = useMemo(() => {
    const map = new Map<string, Photo>()
    mappedPhotos.forEach((photo) => {
      map.set(photo.id, photo)
    })
    return map
  }, [mappedPhotos])

  const { user, isAuthenticated } = useAuthStore()

  // Determinar si es usuario staff
  // Staff users (admin o usuarios con photographer_id) tienen privilegios especiales
  const isStaffUser = !!(isAuthenticated && user && (isAdmin(user) || user.photographer_id))

  const [localEmail, setLocalEmail] = useState(email || "")
  const [localDiscountCode, setLocalDiscountCode] = useState("")
  const [discountError, setDiscountError] = useState("")
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [sessionIdInput, setSessionIdInput] = useState("")
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const { combos, loading: combosLoading } = useCombos()
  const [albumComboIds, setAlbumComboIds] = useState<number[] | null>(null)
  const [isLoadingAlbumCombos, setIsLoadingAlbumCombos] = useState(false)
  const [comboError, setComboError] = useState<string | null>(null)
  
   // Estados para el modal de formato de impresión
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false)
  const [photosForFormatSelection, setPhotosForFormatSelection] = useState<string[]>([])
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const activeAlbumId = useMemo(() => {
    const albumIds = new Set<string>()
    items.forEach((item) => {
      const albumId = photosMap.get(item.photoId)?.albumId
      if (albumId) albumIds.add(albumId)
    })
    if (albumIds.size === 1) {
      return Array.from(albumIds)[0]
    }
    return undefined
  }, [items, photosMap])

  useEffect(() => {
    const debug = items.map((i) => ({
      photoId: i.photoId,
      albumId: photosMap.get(i.photoId)?.albumId,
    }))
  
      }, [items, photosMap, activeAlbumId])
  

  useEffect(() => {
    const sessionParam = searchParams.get("session")
    if (sessionParam && items.length === 0) {
      handleLoadSession(sessionParam)
    }
  }, [searchParams])

  useEffect(() => {
    let isCancelled = false

    const fetchAlbumCombos = async () => {
      if (!activeAlbumId) {
        setAlbumComboIds(null)
        setComboError(null)
        return
      }

      try {
        setIsLoadingAlbumCombos(true)
        const album = await apiFetch<any>(`/albums/${activeAlbumId}`)


        if (isCancelled) return

        const idsFromAlbum =
          album?.combo_ids ??
          album?.comboIds ??
          (Array.isArray(album?.combos)
            ? album.combos
                .map((combo: any) => combo?.id)
                .filter((id: number | undefined) => id !== undefined)
            : null)

            setAlbumComboIds(
              Array.isArray(idsFromAlbum) && idsFromAlbum.length > 0
                ? idsFromAlbum
                : null
            )
            
        setComboError(null)
      } catch (error) {
        if (isCancelled) return
        setAlbumComboIds(null)
        setComboError("No pudimos cargar los combos del álbum.")
        console.error("Error obteniendo combos del álbum", error)
      } finally {
        if (!isCancelled) {
          setIsLoadingAlbumCombos(false)
        }
      }
    }

    fetchAlbumCombos()

    return () => {
      isCancelled = true
    }
  }, [activeAlbumId])

  useEffect(() => {
    setSelectedCombo(null)
  }, [activeAlbumId, setSelectedCombo])

  const applicableCombos = useMemo(() => {
    const activeCombos = combos.filter((combo) => combo.active)
    if (Array.isArray(albumComboIds)) {
      return activeCombos.filter((combo) => albumComboIds.includes(combo.id))
    }

    // Fallback consistente cuando el álbum no tiene combo_ids: mostrar combos activos.
    return activeCombos
  }, [albumComboIds, combos])



  useEffect(() => {
    if (selectedCombo && !applicableCombos.some((combo) => combo.id === selectedCombo.id)) {
      setSelectedCombo(null)
    }
  }, [applicableCombos, selectedCombo, setSelectedCombo])

  useEffect(() => {
    updateTotals(mappedPhotos, { isStaff: isStaffUser })
  }, [printSelections, discountInfo, updateTotals, mappedPhotos, isStaffUser, selectedCombo])

  const cartPhotos = useMemo(() => {
    // No calcular hasta que las fotos y el carrito estén listos
    if (isLoadingPhotos || !isStoreHydrated) return []
    return items
      .map((item) => {
        const photo = photosMap.get(item.photoId)
        return photo ? { photo, cartItem: item } : null
      })
      .filter((item): item is { photo: Photo; cartItem: typeof items[0] } => item !== null)
  }, [items, photosMap, isLoadingPhotos, isStoreHydrated])

  const favoritePhotos = useMemo(() => {
    return cartPhotos.filter((item) => item.cartItem.favorite)
  }, [cartPhotos])

  const printSelectionMap = useMemo(() => {
    const map = new Map<string, { selectionId: string; format: PrintFormat }>()
    printSelections.forEach((selection) => {
      selection.photoIds.forEach((photoId) => {
        map.set(photoId, { selectionId: selection.id, format: selection.format })
      })
    })
    return map
  }, [printSelections])

  const printerPhotos = useMemo(() => {
    return cartPhotos.filter((item) => item.cartItem.printer)
  }, [cartPhotos])

  const printerPhotosForModal = useMemo(
    () =>
      printerPhotos.map((item) => ({
        photo: item.photo,
        assignedFormat: printSelectionMap.get(item.photo.id)?.format,
      })),
    [printerPhotos, printSelectionMap],
  )

  const printSelectionSummary = useMemo(() => {
    return printSelections.map((selection) => {
      const packSize = getPackSize(selection.format)
      const packs = Math.ceil(selection.photoIds.length / packSize)
      return {
        ...selection,
        packs,
        totalPrice: packs * selection.format.price,
      }
    })
  }, [printSelections])

  // Calcular subtotales para usuarios staff
  const subtotalImpresas = useMemo(
    () => printSelectionSummary.reduce((sum, selection) => sum + selection.totalPrice, 0),
    [printSelectionSummary],
  )

  const subtotalFotosDigitales = useMemo(() => {
    return items.reduce((sum, item) => {
      const photo = photosMap.get(item.photoId)
      return sum + (photo?.price || 0)
    }, 0)
  }, [items, photosMap])

  const selectedComboDetails = useMemo(
    () => (selectedCombo ? applicableCombos.find((combo) => combo.id === selectedCombo.id) ?? null : null),
    [applicableCombos, selectedCombo],
  )

  const comboPhotoCount = items.length
  const comboPhotosNeeded = selectedComboDetails
    ? Math.max(0, selectedComboDetails.totalPhotos - comboPhotoCount)
    : 0
  const comboUnitPrice = useMemo(() => {
    const prices = items.map((item) => photosMap.get(item.photoId)?.price ?? 0)
    const firstPositive = prices.find((price) => price > 0)
    if (firstPositive !== undefined) return firstPositive
    if (prices.length === 0) return 0
    return prices.reduce((sum, price) => sum + price, 0) / prices.length
  }, [items, photosMap])
  const comboCanApply = !!selectedComboDetails && comboPhotosNeeded === 0
  const comboDigitalPreview =
    selectedComboDetails && comboCanApply
      ? selectedComboDetails.price +
        Math.max(0, comboPhotoCount - selectedComboDetails.totalPhotos) * comboUnitPrice
      : subtotalFotosDigitales

          

  const unassignedPrinterPhotos = useMemo(
    () => printerPhotos.filter((item) => !printSelectionMap.has(item.photo.id)),
    [printerPhotos, printSelectionMap],
  )

  const favoriteCount = favoritePhotos.length
  const printerCount = printerPhotos.length
  const totalCount = items.length

  const handleEmailChange = (value: string) => {
    setLocalEmail(value)
    setEmail(value)
  }

  const handleApplyDiscount = async () => {
    const code = localDiscountCode.trim()
    if (!code) return

    setIsApplyingDiscount(true)
    try {
      const discount = await apiFetch<{
        id: number
        code: string
        percentage: number
        expires_at: string
        is_active: boolean
      }>(`/discounts/validate?code=${encodeURIComponent(code)}`)

      if (!discount) {
        throw new Error("Código de descuento inválido")
      }

      if (!discount.is_active) {
        throw new Error("El descuento no está activo")
      }

      if (discount.expires_at) {
        const expiresAt = new Date(discount.expires_at)
        if (Number.isNaN(expiresAt.getTime())) {
          throw new Error("La fecha de expiración del descuento es inválida")
        }
        if (expiresAt.getTime() < Date.now()) {
          throw new Error("El descuento ya venció")
        }
      }

      applyDiscount({
        id: discount.id,
        code: discount.code,
        type: "percent",
        value: discount.percentage,
      })
      setDiscountError("")
      toast({
        title: "Descuento aplicado",
        description: `Se aplicó el código ${discount.code.toUpperCase()}`,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No pudimos validar el descuento. Intenta nuevamente."
      setDiscountError(message)
      toast({
        title: "No pudimos aplicar el descuento",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsApplyingDiscount(false)
    }
  }

  const handleSelectCombo = (comboId: string) => {
    if (!comboId) {
      setSelectedCombo(null)
      return
    }

    const combo = applicableCombos.find((item) => item.id === Number(comboId))
    if (combo) {
      setSelectedCombo({
        id: combo.id,
        name: combo.name,
        price: combo.price,
        totalPhotos: combo.totalPhotos,
      })
    }
  }

  const handleSaveSession = async () => {
    try {
      const sessionId = await saveSession()
      toast({
        title: "Sesión guardada",
        description: `ID de sesión: ${sessionId}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la sesión",
        variant: "destructive",
      })
    }
  }

  const handleLoadSession = async (sessionId?: string) => {
    const idToLoad = sessionId || sessionIdInput
    if (!idToLoad) return

    setIsLoadingSession(true)
    try {
      await loadSession(idToLoad)
      setSessionIdInput("")
      toast({
        title: "Sesión cargada",
        description: "Se restauró tu carrito guardado",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la sesión",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSession(false)
    }
  }

  const handleClearNonFavorites = () => {
    clearNonFavorites()
    toast({
      title: "Carrito actualizado",
      description: "Se eliminaron las fotos no marcadas como favoritas",
    })
  }

  const handleOpenFormatModal = () => {
    const unassigned = printerPhotosForModal
      .filter((item) => !item.assignedFormat)
      .map((item) => item.photo.id)
    setPhotosForFormatSelection(unassigned)
    setIsFormatModalOpen(true)
  }

    const handleEditFormatForPhoto = (photoId: string) => {
        setPhotosForFormatSelection([photoId])
        setIsFormatModalOpen(true)
      }

  const handleSelectFormat = (format: PrintFormat, photoIds: string[]) => {
    addPrintSelection(format, photoIds)
    toast({
      title: "Formato aplicado",
      description: `Se aplicó ${format.name} a ${photoIds.length} ${
        photoIds.length === 1 ? "foto" : "fotos"
      }`,
    })

    setIsFormatModalOpen(false)
    setPhotosForFormatSelection([])
  }

  const isEmailValid = localEmail.includes("@") && localEmail.includes(".")

  const hasPrinterWithoutSelection = unassignedPrinterPhotos.length > 0

  const effectiveSubtotalImpresas = printsSubtotalEffective
  const effectiveSubtotalFotos = digitalSubtotalEffective
  const effectiveTotal = totalEffective

      const cartPhotoList = useMemo(
        () => cartPhotos.map((item) => item.photo),
        [cartPhotos]
      )
     
//use efect unic

useEffect(() => {
  if (!isStaffUser) {
    if (printsManualEnabled) resetManualPrintsSubtotal()
    if (digitalManualEnabled) resetManualDigitalSubtotal()
  }
}, [isStaffUser, printsManualEnabled, digitalManualEnabled, resetManualPrintsSubtotal, resetManualDigitalSubtotal])

      // movimiento de fotos en el modal de preview
      
      const [activeTab, setActiveTab] = useState<"all" | "favorites" | "printer">("all")

      const navigablePhotoIds = useMemo(() => {
        switch (activeTab) {
          case "favorites":
            return favoritePhotos.map((i) => i.photo.id)
          case "printer":
            return printerPhotos.map((i) => i.photo.id)
          default:
            return cartPhotos.map((i) => i.photo.id)
        }
      }, [activeTab, cartPhotos, favoritePhotos, printerPhotos])
      
      
      const viewerPhotoId =
        viewerIndex !== null ? navigablePhotoIds
[viewerIndex] : null
      
      const viewerPhoto = useMemo(() => {
        if (!viewerPhotoId) return null
        return photosMap.get(viewerPhotoId) ?? null
      }, [viewerPhotoId, photosMap])
      
    

      const handleNext = () => {
        setViewerIndex((prev) =>
          prev === null
            ? null
            : (prev + 1) % navigablePhotoIds
.length
        )
      }
      
      const handlePrev = () => {
        setViewerIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + navigablePhotoIds
.length) % navigablePhotoIds
.length
        )
      }
      
      
      // movimiento de fotos segun el tab activo en el modal de preview
    
  if (isLoadingPhotos || !isStoreHydrated) {
    return <Loading />
  }
  
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="mb-6 rounded-full bg-muted p-6">
              <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            </div>
            <h1 className="mb-2 text-3xl font-heading">Tu carrito está vacío</h1>
            <p className="mb-8 text-muted-foreground">Explora nuestra galería y agrega las fotos que más te gusten</p>

            <div className="mb-8 w-full space-y-3 rounded-xl border-2 border-dashed border-gray-200 p-6">
              <Label className="text-sm font-medium">¿Tienes una sesión guardada?</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="ID de sesión"
                  value={sessionIdInput}
                  onChange={(e) => setSessionIdInput(e.target.value)}
                  className="rounded-xl"
                />
                <Button
                  onClick={() => handleLoadSession()}
                  disabled={!sessionIdInput || isLoadingSession}
                  className="rounded-xl bg-primary text-foreground"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Cargar
                </Button>
              </div>
            </div>

            <Link href="/albumes">
              <Button className="rounded-xl bg-primary px-8 font-semibold text-foreground hover:bg-primary-hover">
                Ir a Álbumes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-heading text-balance">Revisá tus fotos antes de descargar</h1>
            {/* <p className="text-muted-foreground">
              {favoriteCount} / {totalCount} {totalCount === 1 ? "foto" : "fotos"} marcadas como favoritas
              {printerCount > 0 && ` • ${printerCount} para imprimir`}
            </p> */}
          </div>
          <div className="flex gap-3">
            {printerCount > 0 && (
              <Button
                onClick={handleOpenFormatModal}
                className="gap-2 rounded-xl bg-primary text-foreground"
              >
                <Printer className="h-4 w-4" />
                Elegir Formato ({printerCount})
              </Button>
            )}
            {printSelections.length > 0 && (
              <Button
                variant="outline"
                onClick={clearPrintSelections}
                className="rounded-xl bg-transparent"
              >
                Limpiar formatos
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSaveSession}
              className="rounded-xl bg-transparent hover:bg-[#ffecce]"
            >
              <Save className="mr-2 h-4 w-4" />
              Guardar carrito
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="all" className="w-full" onValueChange={(value) =>
                    setActiveTab(value as "all" | "favorites" | "printer")
                  }>
              <TabsList className="mb-6 grid w-full grid-cols-3 rounded-xl">
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-[#ffecce]">
                  Todas ({totalCount})
                </TabsTrigger>
                <TabsTrigger value="favorites" className="rounded-lg data-[state=active]:bg-[#ffecce]">
                  <Heart className="mr-2 h-4 w-4" />
                  Favoritas ({favoriteCount}/{totalCount})
                </TabsTrigger>
                <TabsTrigger value="printer" className="rounded-lg data-[state=active]:bg-[#ffecce]">
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir ({printerCount}/{totalCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {cartPhotos.map((item) => (
                  <CartItem
                    key={item.photo.id}
                    photo={item.photo}
                    isFavorite={item.cartItem.favorite}
                    isPrinter={item.cartItem.printer}
                      printFormat={printSelectionMap.get(item.photo.id)?.format}
                    onToggleFavorite={() => toggleFavorite(item.photo.id)}
                    onTogglePrinter={() => togglePrinter(item.photo.id)}
                    onRemove={() => removeItem(item.photo.id)}
                    onPreview={() =>
                      setViewerIndex(
                        navigablePhotoIds.indexOf(item.photo.id)
                      )
                    }
                    
                    
                    
                    onEditPrintFormat={item.cartItem.printer ? () => handleEditFormatForPhoto(item.photo.id) : undefined}
                  />
                ))}
                </div>
              </TabsContent>

              <TabsContent value="favorites" className="space-y-4">
                {favoritePhotos.length === 0 ? (
                  <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-muted">
                    <div className="text-center">
                      <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-lg font-semibold text-muted-foreground">No hay favoritas</p>
                      <p className="text-sm text-muted-foreground">Marca tus fotos favoritas con el ícono de corazón</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoritePhotos.map((item) => (
                    <CartItem
                      key={item.photo.id}
                      photo={item.photo}
                      isFavorite={item.cartItem.favorite}
                      isPrinter={item.cartItem.printer}
                      printFormat={printSelectionMap.get(item.photo.id)?.format}
                      onToggleFavorite={() => toggleFavorite(item.photo.id)}
                      onTogglePrinter={() => togglePrinter(item.photo.id)}
                      onRemove={() => removeItem(item.photo.id)}
                      onPreview={() =>
                        setViewerIndex(
                          navigablePhotoIds.indexOf(item.photo.id)
                        )
                      }
                      
                      
                    />
                  ))}
                </div>  
              )}
              </TabsContent>

              <TabsContent value="printer" className="space-y-4">
                {printerPhotos.length === 0 ? (
                  <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-muted">
                    <div className="text-center">
                      <Printer className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-lg font-semibold text-muted-foreground">No hay fotos para imprimir</p>
                      <p className="text-sm text-muted-foreground">Marca tus fotos para imprimir con el ícono de impresora</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {printerPhotos.map((item) => (
                        <CartItem
                          key={item.photo.id}
                          photo={item.photo}
                          isFavorite={item.cartItem.favorite}
                          isPrinter={item.cartItem.printer}
                          printFormat={printSelectionMap.get(item.photo.id)?.format}
                          onToggleFavorite={() => toggleFavorite(item.photo.id)}
                          onTogglePrinter={() => togglePrinter(item.photo.id)}
                          onRemove={() => removeItem(item.photo.id)}
                          onPreview={() =>
                            setViewerIndex(
                              navigablePhotoIds.indexOf(item.photo.id)
                            )
                          }
                          
                          
                        />
                      ))}
                    </div>
                  )}
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex gap-3">
             
              {favoriteCount > 0 && favoriteCount < totalCount && (
            <Button variant="outline" onClick={handleClearNonFavorites}  
            className="flex-1 rounded-xl border-destructive text-destructive hover:bg-[#ffecce] bg-transparent"
>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpiar no favoritas
            </Button>
          )}
              <Button
                variant="outline"
                onClick={clearCart}
                className="flex-1 rounded-xl border-destructive text-destructive hover:bg-[#ffecce] bg-transparent"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Vaciar carrito
              </Button>
            </div>

            {savedSessionId && (
              <div className="mt-4 rounded-xl bg-secondary/50 p-4 text-sm">
                <p className="font-medium">Sesión guardada</p>
                <p className="text-muted-foreground">ID: {savedSessionId}</p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6 rounded-2xl bg-card p-6 shadow-lg">
              <h2 className="text-2xl font-heading">Resumen</h2>

              <div className="space-y-3 border-t border-gray-200 pt-6">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={localEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="rounded-xl"
                />
                {localEmail && !isEmailValid && <p className="text-xs text-destructive">Ingresa un email válido</p>}
              </div>

              {/* Discount Code - Solo para visitantes */}
              {false && (
                <div className="space-y-3 border-t border-gray-200 pt-6">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4" />
                    Código de descuento
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Ej: PATAGONIA10"
                      value={localDiscountCode}
                      onChange={(e) => {
                        setLocalDiscountCode(e.target.value)
                        setDiscountError("")
                      }}
                      className="rounded-xl"
                      disabled={!!discountInfo}
                    />
                    {discountInfo ? (
                      <Button
                        onClick={() => {
                          useCartStore.setState({ discountCode: undefined, discountInfo: undefined })
                          setLocalDiscountCode("")
                        }}
                        variant="outline"
                        className="rounded-xl bg-transparent"
                      >
                        Quitar
                      </Button>
                    ) : (
                      <Button
                        onClick={handleApplyDiscount}
                        disabled={!localDiscountCode || isApplyingDiscount}
                        className="rounded-xl bg-primary text-foreground"
                      >
                        {isApplyingDiscount ? "Validando..." : "Aplicar"}
                      </Button>
                    )}
                  </div>
                  {discountError && <p className="text-sm text-destructive">{discountError}</p>}
                {/*   {discountInfo && (
                    <Badge className="bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                      {discountInfo.type === "percent" ? `${discountInfo.value}%` : `$${discountInfo.value}`} de descuento
                      aplicado
                    </Badge>
                  )} */}
                </div>
              )}

              {/* Discount Code - Solo para visitantes */}
              {true && (
                <div className="space-y-3 border-t border-gray-200 pt-6">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4" />
                    Combos
                  </Label>
                  {!activeAlbumId ? (
                    <p className="text-sm text-muted-foreground">
                      No pudimos determinar el álbum del carrito para sugerir combos.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <select
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                        value={selectedCombo?.id ?? ""}
                        onChange={(event) => handleSelectCombo(event.target.value)}
                        disabled={applicableCombos.length === 0 || combosLoading || isLoadingAlbumCombos}
                      >
                        <option value="">Sin combo</option>
                        {applicableCombos.map((combo) => (
                          <option key={combo.id} value={combo.id}>
                            {combo.name} • {combo.totalPhotos} fotos • ${combo.price}
                          </option>
                        ))}
                      </select>

                      {(combosLoading || isLoadingAlbumCombos) && (
                        <p className="text-xs text-muted-foreground">Cargando combos…</p>
                      )}
                      {comboError && <p className="text-xs text-destructive">{comboError}</p>}
                      {applicableCombos.length === 0 && !combosLoading && !isLoadingAlbumCombos && (
                        <p className="text-xs text-muted-foreground">
                          No hay combos disponibles para este álbum. Te mostraremos nuevos combos apenas estén listos.
                        </p>
                      )}

                      {selectedComboDetails && (
                        <div className="space-y-1 rounded-lg bg-muted p-3 text-xs">
                          <p className="font-medium">{selectedComboDetails.name}</p>
                          <p className="text-muted-foreground">
                            Incluye {selectedComboDetails.totalPhotos} foto
                            {selectedComboDetails.totalPhotos === 1 ? "" : "s"} por ${selectedComboDetails.price}.
                          </p>
                          {comboCanApply ? (
                            <p className="text-green-600 dark:text-green-400">
                              Combo aplicado. Total digital estimado: ${Math.round(comboDigitalPreview)}
                            </p>
                          ) : (
                            <p className="text-orange-600 dark:text-orange-400">
                              Te faltan {comboPhotosNeeded} foto{comboPhotosNeeded === 1 ? "" : "s"} para aplicar este
                              combo.
                            </p>
                          )}
                          {comboCanApply && comboPhotoCount > selectedComboDetails.totalPhotos && (
                            <p className="text-muted-foreground">
                              {comboPhotoCount - selectedComboDetails.totalPhotos} foto
                              {comboPhotoCount - selectedComboDetails.totalPhotos === 1 ? "" : "s"} extra a $
                              {comboUnitPrice} c/u.
                            </p>
                          )}
                          <p className="text-muted-foreground">
                            El combo ajusta solo el total digital; las impresiones mantienen su cálculo actual.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 border-t border-gray-200 pt-6">
                {isStaffUser ? (
                  // Vista para usuarios staff con montos editables
                  <>
                    {/* Fotos Impresas */}
                    {printerCount > 0 && (
                      <div className="space-y-2 pb-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-muted-foreground">IMPRESAS</span>
                          <span className="text-xs text-muted-foreground">
                            {printerCount} {printerCount === 1 ? "foto" : "fotos"}
                          </span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-2">
                          {printSelectionSummary.length === 0 ? (
                            <p className="text-destructive">Asigná un formato a cada foto para imprimir.</p>
                          ) : (
                            printSelectionSummary.map((selection) => (
                              <div key={selection.id} className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <span className="block font-semibold">
                                    • {selection.format.name} ({selection.format.size})
                                  </span>
                                  <span className="block text-[11px] text-muted-foreground">
                                    {selection.photoIds.length} fotos • {selection.packs} pack(s) de{" "}
                                    {getPackSize(selection.format)} foto{getPackSize(selection.format) > 1 ? "s" : ""}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">${selection.totalPrice}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-destructive"
                                    onClick={() => removePhotosFromSelection(selection.id, selection.photoIds)}
                                  >
                                    Quitar
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-muted-foreground whitespace-nowrap">Subtotal:</Label>
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-sm">$</span>
                            <Input
                              type="number"
                              value={effectiveSubtotalImpresas}
                              onChange={(e) => {
                                const newImpresas = Number(e.target.value)
                                setManualPrintsSubtotal(newImpresas)
                              }}
                              className="rounded-lg h-8 text-sm font-medium"
                            />

                          </div>
                        </div>
                        {printsManualEnabled && (
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="link"
                              className="px-0 h-auto text-xs text-muted-foreground"
                              onClick={resetManualPrintsSubtotal}
                            >
                              Volver al cálculo automático
                            </Button>
                          </div>
                        )}
                        
                        </div>
                    )}

                    {/* Fotos Digitales */}
                    <div className="space-y-2 pb-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">FOTOS</span>
                        <span className="text-xs text-muted-foreground">
                          {totalCount} {totalCount  === 1 ? "foto" : "fotos"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground whitespace-nowrap">Subtotal:</Label>
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-sm">$</span>
                          <Input
                            type="number"
                            value={effectiveSubtotalFotos}
                            onChange={(e) => {
                              const newFotos = Number(e.target.value)
                              setManualDigitalSubtotal(newFotos)
                            }}
                            className="rounded-lg h-8 text-sm font-medium"
                          />

                        </div>
                      </div>
                      {digitalManualEnabled && (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="link"
                            className="px-0 h-auto text-xs text-muted-foreground"
                            onClick={resetManualDigitalSubtotal}
                          >
                            Volver al cálculo automático
                          </Button>
                        </div>
                      )}
                    </div>

                   {/* Total calculado automáticamente */}
                    <div className="space-y-2 pt-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-lg font-bold whitespace-nowrap">Total:</Label>
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-lg font-bold text-primary">$</span>
                          <Input
                            type="number"
                            value={effectiveTotal}
                            readOnly
                            className="
                              rounded-lg h-10 text-lg font-bold text-primary
                              bg-muted cursor-not-allowed
                            "
                          />

                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Vista para visitantes (sin cambios)
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${subtotal}</span>
                    </div>
                    {discountInfo && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Descuento</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          -$
                          {discountInfo.type === "percent"
                            ? Math.round((subtotal * discountInfo.value) / 100)
                            : discountInfo.value}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">${total}</span>
                    </div>
                  </>
                )}
              </div>

                <Button
                onClick={() => router.push("/checkout")}
                disabled={
                  !isEmailValid ||
                  items.length === 0 ||
                  hasPrinterWithoutSelection
                }
                className="w-full rounded-xl bg-primary py-6 text-lg font-semibold text-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                Proceder al pago
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {hasPrinterWithoutSelection && (
                <p className="mt-2 text-sm text-destructive">
                  Debes seleccionar un formato para todas las fotos a imprimir
                </p>
              )}

              <div className="space-y-2 border-t border-gray-200 pt-6 text-xs text-muted-foreground">
                <p>✓ Te enviamos tus fotos al instante a tu email</p>
                <p>✓ Sin marcas de agua, en máxima calidad.</p>
                <p>✓ Asesoramiento ante cualquier consulta</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de selección de formato */}
      <PrintFormatModal
        isOpen={isFormatModalOpen}
        onClose={() => setIsFormatModalOpen(false)}
        onConfirm={handleSelectFormat}
        printerPhotos={printerPhotosForModal}
        defaultSelectedPhotoIds={photosForFormatSelection}
      />
      {viewerPhoto && (
      <PhotoViewerModal
        photo={viewerPhoto}
        onClose={() => setViewerIndex(null)}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    )}


    </div>
  )
}
