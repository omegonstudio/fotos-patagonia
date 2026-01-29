"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Printer,
  Save,
  ShoppingCart,
  Tag,
  Trash2,
  Upload,
} from "lucide-react"

import { CartItem } from "@/components/molecules/cart-item"
import { DeleteConfirmationModal } from "@/components/molecules/delete-confirmation-modal"
import { PrintFormatModal } from "@/components/molecules/print-format-modal"
import { PhotoViewerModal } from "@/components/organisms/photo-viewer-modal"
import { Header } from "@/components/organisms/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCombos } from "@/hooks/combos/useCombos"
import { usePhotos } from "@/hooks/photos/usePhotos"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"
import { resolveAutoCombosWithFullAlbum } from "@/lib/combos/resolveAutoCombosWithFullAlbum"
import { mapBackendPhotoToPhoto } from "@/lib/mappers/photos"
import { getPackSize } from "@/lib/print-formats"
import { useAuthStore, useCartStore } from "@/lib/store"
import { isAdmin } from "@/lib/types"
import type { Photo, PrintFormat } from "@/lib/types"
import Loading from "./loading"

type DeleteAction =
  | { type: "clear-cart" }
  | { type: "clear-non-favorites" }
  | { type: "remove-item"; photoId: string }
  | null

export default function CarritoPage() {
  // --- Hooks de contexto y stores
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { photos, refetch: fetchPhotos, fetchPhotosByIds, loading: isLoadingPhotos } = usePhotos()
  const { combos, loading: combosLoading } = useCombos()
  const { user, isAuthenticated } = useAuthStore()
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
    toggleFavorite,
    togglePrinter,
    removeFromCartExplicit,
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

  // --- Estado local (useState)
  const [isStoreHydrated, setIsStoreHydrated] = useState(false)
  const [deleteAction, setDeleteAction] = useState<DeleteAction>(null)
  const [localEmail, setLocalEmail] = useState(email || "")
  const [localDiscountCode, setLocalDiscountCode] = useState("")
  const [discountError, setDiscountError] = useState("")
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [sessionIdInput, setSessionIdInput] = useState("")
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [albumComboIds, setAlbumComboIds] = useState<number[] | null>(null)
  const [isLoadingAlbumCombos, setIsLoadingAlbumCombos] = useState(false)
  const [comboError, setComboError] = useState<string | null>(null)
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false)
  const [photosForFormatSelection, setPhotosForFormatSelection] = useState<string[]>([])
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "printer">("all")

  // --- Referencias
  const photoCache = useRef(new Map<string, Photo>())

  // --- Estado derivado (useMemo)
  const itemPhotoIdsKey = useMemo(() => {
    if (items.length === 0) return ""
    return items
      .map((item) => item.photoId)
      .sort()
      .join(",")
  }, [items])

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

  const isStaffUser = useMemo(
    () => !!(isAuthenticated && user && (isAdmin(user) || user.photographer_id)),
    [isAuthenticated, user],
  )

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

  const applicableCombos = useMemo(() => {
    const activeCombos = combos.filter((combo) => combo.active)
    if (Array.isArray(albumComboIds)) {
      return activeCombos.filter((combo) => albumComboIds.includes(combo.id))
    }

    return activeCombos
  }, [albumComboIds, combos])

  const mappedPhotosKey = useMemo(
    () => mappedPhotos.map((photo) => `${photo.id}:${photo.price}`).join("|"),
    [mappedPhotos],
  )

  const digitalUnitPrice = useMemo(() => {
    const prices = items.map((item) => photosMap.get(item.photoId)?.price ?? 0)
    const firstPositive = prices.find((price) => price > 0)
    if (firstPositive !== undefined) return firstPositive
    if (prices.length === 0) return 0
    return prices.reduce((sum, price) => sum + price, 0) / prices.length
  }, [items, photosMap])

  const comboResolution = useMemo(() => {
    return resolveAutoCombosWithFullAlbum(
      items.length,
      applicableCombos ?? [],
      { fullAlbumMinPhotos: 11 },
    )
  }, [items.length, applicableCombos])
  

  const autoSelectedCombo = useMemo(() => {
    if (digitalManualEnabled) return null
    if (!activeAlbumId) return null
    const coveredPhotos = items.length - comboResolution.remainingPhotos
    if (comboResolution.applied.length === 0 || coveredPhotos <= 0) return null

    if (comboResolution.isFullAlbum) {
      const full = comboResolution.applied[0]?.combo
      if (!full) return null
      return {
        id: full.id,
        name: "Pack completo del álbum",
        price: comboResolution.totalComboPrice,
        totalPhotos: coveredPhotos,
      }
    }

    return {
      id: -1,
      name: "Combos automáticos",
      price: comboResolution.totalComboPrice,
      totalPhotos: coveredPhotos,
    }
  }, [activeAlbumId, comboResolution, digitalManualEnabled, items.length])

  const autoDigitalSubtotal = useMemo(() => {
    if (digitalManualEnabled) return null
    if (comboResolution.applied.length === 0) return null
    return (
      comboResolution.totalComboPrice + comboResolution.remainingPhotos * digitalUnitPrice
    )
  }, [comboResolution, digitalManualEnabled, digitalUnitPrice])

  const originalPhotosSubtotal = useMemo(() => {
    const sum = items.reduce((acc, item) => {
      const price = photosMap.get(item.photoId)?.price ?? 0
      return acc + price
    }, 0)
    // fallback si faltan precios pero hay items
    if (sum === 0 && items.length > 0) {
      return items.length * digitalUnitPrice
    }
    return sum
  }, [items, photosMap, digitalUnitPrice])

  const cartPhotos = useMemo(() => {
    if (isLoadingPhotos || !isStoreHydrated) return []
    return items
      .map((item) => {
        const photo = photosMap.get(item.photoId)
        return photo ? { photo, cartItem: item } : null
      })
      .filter((item): item is { photo: Photo; cartItem: (typeof items)[0] } => item !== null)
  }, [isLoadingPhotos, isStoreHydrated, items, photosMap])

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

  const unassignedPrinterPhotos = useMemo(
    () => printerPhotos.filter((item) => !printSelectionMap.has(item.photo.id)),
    [printerPhotos, printSelectionMap],
  )

  const navigablePhotoIds = useMemo(() => {
    switch (activeTab) {
      case "favorites":
        return favoritePhotos.map((item) => item.photo.id)
      case "printer":
        return printerPhotos.map((item) => item.photo.id)
      default:
        return cartPhotos.map((item) => item.photo.id)
    }
  }, [activeTab, cartPhotos, favoritePhotos, printerPhotos])

  const viewerPhotoId = useMemo(
    () => (viewerIndex !== null ? navigablePhotoIds[viewerIndex] : null),
    [navigablePhotoIds, viewerIndex],
  )

  const viewerPhoto = useMemo(() => {
    if (!viewerPhotoId) return null
    return photosMap.get(viewerPhotoId) ?? null
  }, [photosMap, viewerPhotoId])

  // --- Efectos
  useEffect(() => {
    setIsStoreHydrated(true)
  }, [])

  useEffect(() => {
    if (!isStoreHydrated) return

    if (items.length === 0) {
      photoCache.current.clear()
      return
    }

    const photoIds = items.map((item) => parseInt(item.photoId, 10))
    fetchPhotosByIds(photoIds)
  }, [fetchPhotosByIds, isStoreHydrated, itemPhotoIdsKey])

  useEffect(() => {
    if (!isStaffUser) {
      items.forEach((item) => {
        if (item.printer) {
          togglePrinter(item.photoId)
        }
      })

      if (printSelections.length > 0) {
        clearPrintSelections()
      }
    }
  }, [clearPrintSelections, isStaffUser, items, printSelections.length, togglePrinter])

  useEffect(() => {
    const sessionParam = searchParams.get("session")
    if (!sessionParam || items.length > 0) return
  
    loadSession(sessionParam)
  }, [searchParams, items.length, loadSession])
  

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
          Array.isArray(idsFromAlbum) && idsFromAlbum.length > 0 ? idsFromAlbum : null,
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

  useEffect(() => {
    if (!digitalManualEnabled) {
      const nextCombo = autoSelectedCombo
      const sameCombo =
        (!selectedCombo && !nextCombo) ||
        (selectedCombo &&
          nextCombo &&
          selectedCombo.id === nextCombo.id &&
          selectedCombo.price === nextCombo.price &&
          selectedCombo.totalPhotos === nextCombo.totalPhotos)

      if (!sameCombo) {
        setSelectedCombo(nextCombo)
        return
      }
    }

    updateTotals(mappedPhotos, { isStaff: isStaffUser })
  }, [
    printSelections,
    discountInfo,
    mappedPhotosKey,
    isStaffUser,
    selectedCombo,
    autoSelectedCombo,
    digitalManualEnabled,
  ])

  useEffect(() => {
    if (!isStaffUser) {
      if (printsManualEnabled) resetManualPrintsSubtotal()
      if (digitalManualEnabled) resetManualDigitalSubtotal()
    }
  }, [
    isStaffUser,
    printsManualEnabled,
    digitalManualEnabled,
    resetManualPrintsSubtotal,
    resetManualDigitalSubtotal,
  ])

  // --- Derivados simples
  const favoriteCount = favoritePhotos.length
  const printerCount = printerPhotos.length
  const totalCount = items.length
  const isDeleteModalOpen = deleteAction !== null
  const isEmailValid = localEmail.includes("@") && localEmail.includes(".")
  const hasPrinterWithoutSelection = unassignedPrinterPhotos.length > 0
  const effectiveSubtotalImpresas = printsSubtotalEffective
  const effectiveSubtotalFotos = digitalSubtotalEffective
  const effectiveTotal = totalEffective

  // --- Handlers
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
        error instanceof Error
          ? error.message
          : "No pudimos validar el descuento. Intenta nuevamente."
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

 /*  const handleClearNonFavorites = () => {
    clearNonFavorites()
    toast({
      title: "Carrito actualizado",
      description: "Se eliminaron las fotos no marcadas como favoritas",
    })
  } */

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

  const handleConfirmDelete = () => {
    if (!deleteAction) return

    switch (deleteAction.type) {
      case "clear-cart":
        clearCart()
        break
      case "clear-non-favorites":
        clearNonFavorites()
        break
      case "remove-item":
        removeFromCartExplicit(deleteAction.photoId)
        break
    }

    setDeleteAction(null)
  }

  const handleBackToAlbum = () => {
    if (!activeAlbumId) {
      router.push("/albumes")
      return
    }

    router.push(`/albumes/${activeAlbumId}`)
  }

  const handleNext = () => {
    setViewerIndex((prev) => {
      if (prev === null || navigablePhotoIds.length === 0) return null
      return (prev + 1) % navigablePhotoIds.length
    })
  }

  const handlePrev = () => {
    setViewerIndex((prev) => {
      if (prev === null || navigablePhotoIds.length === 0) return null
      return (prev - 1 + navigablePhotoIds.length) % navigablePhotoIds.length
    })
  }

  // --- Returns condicionales
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
            <p className="mb-8 text-muted-foreground">
              Explora nuestra galería y agrega las fotos que más te gusten
            </p>

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

  // --- JSX principal
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBackToAlbum}
            className="rounded-xl text-muted-foreground hover:bg-[#ffecce]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al álbum
          </Button>

          <div>
            <h1 className="mb-2 text-4xl font-heading text-balance">
              Revisá tus fotos antes de descargar
            </h1>
          </div>
          <div className="flex gap-3">
            {isStaffUser && printerCount > 0 && (
              <Button
                onClick={handleOpenFormatModal}
                className="gap-2 rounded-xl bg-primary text-foreground"
              >
                <Printer className="h-4 w-4" />
                Elegir Formato ({printerCount})
              </Button>
            )}
            {isStaffUser && printSelections.length > 0 && (
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
          <div className="lg:col-span-2">
            <Tabs
              defaultValue="all"
              className="w-full"
              onValueChange={(value) => setActiveTab(value as "all" | "favorites" | "printer")}
            >
              <TabsList className="mb-6 grid w-full grid-cols-3 rounded-xl">
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-[#ffecce]">
                  Todas ({totalCount})
                </TabsTrigger>
                <TabsTrigger
                  value="favorites"
                  className="rounded-lg data-[state=active]:bg-[#ffecce]"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Favoritas ({favoriteCount}/{totalCount})
                </TabsTrigger>
                {isStaffUser && (
                  <TabsTrigger
                    value="printer"
                    className="rounded-lg data-[state=active]:bg-[#ffecce]"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir ({printerCount}/{totalCount})
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {cartPhotos.map((item) => (
                    <CartItem
                      key={item.photo.id}
                      photo={item.photo}
                      isFavorite={item.cartItem.favorite}
                      isPrinter={item.cartItem.printer}
                      printFormat={printSelectionMap.get(item.photo.id)?.format}
                      onToggleFavorite={() => toggleFavorite(item.photo.id)}
                      onTogglePrinter={() => togglePrinter(item.photo.id)}
                      onRemove={() =>
                        setDeleteAction({ type: "remove-item", photoId: item.photo.id })
                      }
                      onPreview={() => setViewerIndex(navigablePhotoIds.indexOf(item.photo.id))}
                      onEditPrintFormat={
                        item.cartItem.printer
                          ? () => handleEditFormatForPhoto(item.photo.id)
                          : undefined
                      }
                      isStaffUser={isStaffUser}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="favorites" className="space-y-4">
                {favoritePhotos.length === 0 ? (
                  <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-muted">
                    <div className="text-center">
                      <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-lg font-semibold text-muted-foreground">
                        No hay favoritas
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Marca tus fotos favoritas con el ícono de corazón
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {favoritePhotos.map((item) => (
                      <CartItem
                        isStaffUser={isStaffUser}
                        key={item.photo.id}
                        photo={item.photo}
                        isFavorite={item.cartItem.favorite}
                        isPrinter={item.cartItem.printer}
                        printFormat={printSelectionMap.get(item.photo.id)?.format}
                        onToggleFavorite={() => toggleFavorite(item.photo.id)}
                        onTogglePrinter={() => togglePrinter(item.photo.id)}
                        onRemove={() =>
                          setDeleteAction({ type: "remove-item", photoId: item.photo.id })
                        }
                        onPreview={() => setViewerIndex(navigablePhotoIds.indexOf(item.photo.id))}
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
                      <p className="text-lg font-semibold text-muted-foreground">
                        No hay fotos para imprimir
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Marca tus fotos para imprimir con el ícono de impresora
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {printerPhotos.map((item) => (
                      <CartItem
                        isStaffUser={isStaffUser}
                        key={item.photo.id}
                        photo={item.photo}
                        isFavorite={item.cartItem.favorite}
                        isPrinter={item.cartItem.printer}
                        printFormat={printSelectionMap.get(item.photo.id)?.format}
                        onToggleFavorite={() => toggleFavorite(item.photo.id)}
                        onTogglePrinter={() => togglePrinter(item.photo.id)}
                        onRemove={() =>
                          setDeleteAction({ type: "remove-item", photoId: item.photo.id })
                        }
                        onPreview={() => setViewerIndex(navigablePhotoIds.indexOf(item.photo.id))}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-26 flex gap-3">
              {favoriteCount > 0 && favoriteCount < totalCount && (
                <Button
                  variant="outline"
                  onClick={() => setDeleteAction({ type: "clear-non-favorites" })}
                  className="flex-1 rounded-xl border-destructive bg-transparent text-destructive hover:bg-[#ffecce]"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpiar no favoritas
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setDeleteAction({ type: "clear-cart" })}
                className="flex-1 rounded-xl border-destructive bg-transparent text-destructive hover:bg-[#ffecce]"
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
                {localEmail && !isEmailValid && (
                  <p className="text-xs text-destructive">Ingresa un email válido</p>
                )}
              </div>

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
                          useCartStore.setState({
                            discountCode: undefined,
                            discountInfo: undefined,
                          })
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
                </div>
              )}

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
                    {(combosLoading || isLoadingAlbumCombos) && (
                      <p className="text-xs text-muted-foreground">Calculando combos…</p>
                    )}
                    {comboError && <p className="text-xs text-destructive">{comboError}</p>}
                    {!combosLoading && !isLoadingAlbumCombos && (
                      <div className="space-y-2 rounded-lg bg-muted p-3 text-xs">
                        <p className="font-medium">Combos aplicados automáticamente</p>
                        {applicableCombos.length === 0 ? (
                          <p className="text-muted-foreground">
                            No hay combos disponibles para este álbum por el momento.
                          </p>
                        ) : comboResolution.applied.length === 0 ? (
                          <p className="text-muted-foreground">
                            Aún no aplican combos para {items.length} foto
                            {items.length === 1 ? "" : "s"}.
                          </p>
                        ) : (
                          <>
                            <div className="space-y-1">
                              {comboResolution.isFullAlbum ? (
                                <div className="flex items-center justify-between gap-2">
                                  <span>• Pack completo del álbum</span>
                                  <span>
                                    ${comboResolution.applied[0]?.combo.price ?? 0}
                                  </span>
                                </div>
                              ) : (
                                comboResolution.applied.map(({ combo, count }) => (
                                  <div
                                    key={combo.id}
                                    className="flex items-center justify-between gap-2"
                                  >
                                    <span>
                                      • {count} x {combo.totalPhotos} foto
                                      {combo.totalPhotos === 1 ? "" : "s"}
                                    </span>
                                    <span>${combo.price}</span>
                                  </div>
                                ))
                              )}
                            </div>
                            {!comboResolution.isFullAlbum && comboResolution.remainingPhotos > 0 && (
                              <p className="text-muted-foreground">
                                {comboResolution.remainingPhotos} foto
                                {comboResolution.remainingPhotos === 1 ? "" : "s"} fuera de
                                combo a ${digitalUnitPrice} c/u.
                              </p>
                            )}
                            {digitalManualEnabled && (
                              <p className="text-orange-600 dark:text-orange-400">
                                Subtotal digital editado manualmente; se respeta tu override.
                              </p>
                            )}
                            {!digitalManualEnabled && autoDigitalSubtotal !== null && (
                              <div className="space-y-1 text-muted-foreground">
                                <p className="text-foreground">
                                  Precio original (sin combo): ${Math.round(originalPhotosSubtotal)}
                                </p>
                                <p className="text-foreground">
                                  Precio con combo: ${Math.round(autoDigitalSubtotal)}
                                </p>
                                {originalPhotosSubtotal > autoDigitalSubtotal && (
                                  <p className="text-green-600 dark:text-green-400">
                                    Ahorro: ${Math.round(originalPhotosSubtotal - autoDigitalSubtotal)}
                                  </p>
                                )}
                              </div>
                            )}
                            {!digitalManualEnabled && autoDigitalSubtotal !== null && (
                              <p className="text-green-600 dark:text-green-400">
                                Subtotal digital estimado: ${Math.round(autoDigitalSubtotal)}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-6">
                {isStaffUser ? (
                  <>
                    {printerCount > 0 && (
                      <div className="space-y-2 border-b border-gray-200 pb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-muted-foreground">
                            IMPRESAS
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {printerCount} {printerCount === 1 ? "foto" : "fotos"}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs text-muted-foreground">
                          {printSelectionSummary.length === 0 ? (
                            <p className="text-destructive">
                              Asigná un formato a cada foto para imprimir.
                            </p>
                          ) : (
                            printSelectionSummary.map((selection) => (
                              <div
                                key={selection.id}
                                className="flex items-start justify-between gap-3"
                              >
                                <div className="space-y-1">
                                  <span className="block font-semibold">
                                    • {selection.format.name} ({selection.format.size})
                                  </span>
                                  <span className="block text-[11px] text-muted-foreground">
                                    {selection.photoIds.length} fotos • {selection.packs} pack(s) de{" "}
                                    {getPackSize(selection.format)} foto
                                    {getPackSize(selection.format) > 1 ? "s" : ""}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">${selection.totalPrice}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-destructive"
                                    onClick={() =>
                                      removePhotosFromSelection(selection.id, selection.photoIds)
                                    }
                                  >
                                    Quitar
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Label className="whitespace-nowrap text-sm text-muted-foreground">
                            Subtotal:
                          </Label>
                          <div className="flex flex-1 items-center gap-1">
                            <span className="text-sm">$</span>
                            <Input
                              type="number"
                              value={effectiveSubtotalImpresas}
                              onChange={(e) => {
                                const newImpresas = Number(e.target.value)
                                setManualPrintsSubtotal(newImpresas)
                              }}
                              className="h-8 rounded-lg text-sm font-medium"
                            />
                          </div>
                        </div>
                        {printsManualEnabled && (
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="link"
                              className="h-auto px-0 text-xs text-muted-foreground"
                              onClick={resetManualPrintsSubtotal}
                            >
                              Volver al cálculo automático
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 border-b border-gray-200 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">FOTOS</span>
                        <span className="text-xs text-muted-foreground">
                          {totalCount} {totalCount === 1 ? "foto" : "fotos"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="whitespace-nowrap text-sm text-muted-foreground">
                          Subtotal:
                        </Label>
                        <div className="flex flex-1 items-center gap-1">
                          <span className="text-sm">$</span>
                          <Input
                            type="number"
                            value={effectiveSubtotalFotos}
                            onChange={(e) => {
                              const newFotos = Number(e.target.value)
                              setManualDigitalSubtotal(newFotos)
                            }}
                            className="h-8 rounded-lg text-sm font-medium"
                          />
                        </div>
                      </div>
                      {digitalManualEnabled && (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="link"
                            className="h-auto px-0 text-xs text-muted-foreground"
                            onClick={resetManualDigitalSubtotal}
                          >
                            Volver al cálculo automático
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-3">
                      <div className="flex items-center gap-2">
                        <Label className="whitespace-nowrap text-lg font-bold">Total:</Label>
                        <div className="flex flex-1 items-center gap-1">
                          <span className="text-lg font-bold text-primary">$</span>
                          <Input
                            type="number"
                            value={effectiveTotal}
                            readOnly
                            className="h-10 cursor-not-allowed rounded-lg bg-muted text-lg font-bold text-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
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
                disabled={!isEmailValid || items.length === 0 || hasPrinterWithoutSelection}
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

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Confirmar eliminación"
        entityName={
          deleteAction?.type === "clear-cart"
            ? "el carrito completo"
            : deleteAction?.type === "clear-non-favorites"
              ? "las fotos no favoritas"
              : "esta foto"
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteAction(null)}
      />
    </div>
  )
}
