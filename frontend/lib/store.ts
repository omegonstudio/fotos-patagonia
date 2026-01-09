"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { toast } from "@/hooks/use-toast"
import {
  AUTH_STORAGE_KEY,
  LEGACY_TOKEN_KEY,
  getTokenExpiration,
  isTimestampExpired,
  readStoredAuthSnapshot,
  type StoredAuthSnapshot,
  writeStoredAuthSnapshot,
} from "./auth"
import type {
  CartState,
  LightboxState,
  GalleryState,
  Photo,
  Filters,
  User,
  PrintFormat,
  PrintSelection,
} from "./types"
import { getPackSize } from "./print-formats"

const generateSelectionId = () => `sel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const removePhotoFromSelections = (selections: PrintSelection[], photoId: string) =>
  selections
    .map((selection) => ({
      ...selection,
      photoIds: selection.photoIds.filter((id) => id !== photoId),
    }))
    .filter((selection) => selection.photoIds.length > 0)

interface CartStore extends CartState {
  addItem: (photoId: string) => void
  removeItem: (photoId: string) => void
  toggleSelected: (photoId: string) => void
  toggleFavorite: (photoId: string) => void
  togglePrinter: (photoId: string) => void
  addPrintSelection: (format: PrintFormat, photoIds: string[]) => void
  removePhotosFromSelection: (selectionId: string, photoIds: string[]) => void
  clearPrintSelections: () => void
  clearNonFavorites: () => void
  setEmail: (email: string) => void
  applyDiscount: (code: string) => Promise<void>
  saveSession: () => Promise<string>
  loadSession: (sessionId: string) => Promise<void>
  clearCart: () => void
  updateTotals: (photos: Photo[]) => void
  setEditableTotals: (data: {
    subtotalImpresas?: number
    subtotalFotos?: number
    total?: number
  }) => void

  clearEditableTotals: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      printSelections: [],
      email: undefined,
      discountCode: undefined,
      discountInfo: undefined,
      subtotal: 0,
      total: 0,
      savedSessionId: undefined,
      channel: "web",
      subtotalImpresasOverride: undefined,
      subtotalFotosOverride: undefined,
      totalOverride: undefined,

      addItem: (photoId: string) => {
        const { items } = get()
        if (items.some((item) => item.photoId === photoId)) return
        // Agregar con selected: true para que permanezca en el carrito
        set({ items: [...items, { photoId, selected: true, favorite: false, printer: false }] })
      },

      removeItem: (photoId: string) => {
        set({
          items: get().items.filter((item) => item.photoId !== photoId),
          printSelections: removePhotoFromSelections(get().printSelections, photoId),
        })
      },

      // Helper: verifica si un item debe permanecer en carrito
      // Item válido si: selected || favorite || printer

      toggleSelected: (photoId: string) => {
        const { items } = get()
        const existingItem = items.find((item) => item.photoId === photoId)
        
        if (!existingItem) {
          // Al marcar: agregar al carrito con selected: true
          set({ items: [...items, { photoId, selected: true, favorite: false, printer: false }] })
          return
        }
        
        // Toggle selected
        const newSelectedState = !existingItem.selected
        const updatedItems = items
          .map((item) => {
            if (item.photoId !== photoId) return item
            return { ...item, selected: newSelectedState }
          })
          .filter((item) => item.selected || item.favorite || item.printer)
        set({ items: updatedItems })
      },

      toggleFavorite: (photoId: string) => {
        const { items } = get()
        const existingItem = items.find((item) => item.photoId === photoId)
        
        if (!existingItem) {
          // Al marcar: agregar al carrito con favorite: true
          set({ items: [...items, { photoId, selected: false, favorite: true, printer: false }] })
          return
        }
        
        const newFavoriteState = !existingItem.favorite
        const updatedItems = items
          .map((item) => {
            if (item.photoId !== photoId) return item
            if (!newFavoriteState) {
              // Al desmarcar favorite: también apagar printer
              return { ...item, favorite: false, printer: false }
            }
            return { ...item, favorite: true }
          })
          .filter((item) => item.selected || item.favorite || item.printer)
        set({
          items: updatedItems,
          printSelections: newFavoriteState
            ? get().printSelections
            : removePhotoFromSelections(get().printSelections, photoId),
        })
      },

      togglePrinter: (photoId: string) => {
        const { items } = get()
        const existingItem = items.find((item) => item.photoId === photoId)
        
        if (!existingItem) {
          // Al marcar: agregar al carrito con printer: true y favorite: true
          set({ items: [...items, { photoId, selected: false, favorite: true, printer: true }] })
          return
        }
        
        const newPrinterState = !existingItem.printer
        const updatedItems = items
          .map((item) => {
            if (item.photoId !== photoId) return item
            if (newPrinterState) {
              // Al marcar printer: también marcar favorite
              return { ...item, printer: true, favorite: true }
            }
            // Al desmarcar printer: solo desmarcar printer
            return { ...item, printer: false }
          })
          .filter((item) => item.selected || item.favorite || item.printer)
        set({
          items: updatedItems,
          printSelections: newPrinterState
            ? get().printSelections
            : removePhotoFromSelections(get().printSelections, photoId),
        })
      },

      addPrintSelection: (format: PrintFormat, photoIds: string[]) => {
        const { items, printSelections } = get()
        const uniquePhotoIds = Array.from(new Set(photoIds))
        if (uniquePhotoIds.length === 0) return

        const alreadyAssigned = uniquePhotoIds.some((photoId) =>
          printSelections.some((selection) => selection.photoIds.includes(photoId)),
        )
        if (alreadyAssigned) {
          toast({
            title: "Fotos ya asignadas",
            description: "Quitá el formato previo antes de asignar uno nuevo.",
            variant: "destructive",
          })
          return
        }

        const itemsWithPrinter = uniquePhotoIds.reduce((acc, photoId) => {
          const existing = acc.find((item) => item.photoId === photoId)
          if (existing) {
            return acc.map((item) =>
              item.photoId === photoId ? { ...item, printer: true, favorite: true } : item,
            )
          }
          return [...acc, { photoId, selected: false, favorite: true, printer: true }]
        }, [...items])

        const newSelection: PrintSelection = {
          id: generateSelectionId(),
          format,
          photoIds: uniquePhotoIds,
        }

        set({
          items: itemsWithPrinter,
          printSelections: [...printSelections, newSelection],
        })
      },

      removePhotosFromSelection: (selectionId: string, photoIds: string[]) => {
        set((state) => {
          const updatedSelections = state.printSelections
            .map((selection) => {
              if (selection.id !== selectionId) return selection
              const remaining = selection.photoIds.filter((id) => !photoIds.includes(id))
              return { ...selection, photoIds: remaining }
            })
            .filter((selection) => selection.photoIds.length > 0)

          return { items: state.items, printSelections: updatedSelections }
        })
      },

      clearPrintSelections: () => {
        set((state) => ({
          ...state,
          printSelections: [],
        }))
      },

      clearNonFavorites: () => {
        set((state) => {
          const favoriteItems = state.items.filter((item) => item.favorite)
          const favoriteIds = favoriteItems.map((item) => item.photoId)
          return {
            items: favoriteItems,
            printSelections: state.printSelections
              .map((selection) => ({
                ...selection,
                photoIds: selection.photoIds.filter((id) => favoriteIds.includes(id)),
              }))
              .filter((selection) => selection.photoIds.length > 0),
          }
        })
      },

      setEmail: (email: string) => {
        set({ email })
      },

      applyDiscount: async (code: string) => {
        // Mock discount validation
        const validDiscounts: Record<string, { type: "percent" | "fixed"; value: number }> = {
          PATAGONIA10: { type: "percent", value: 10 },
          VERANO2024: { type: "percent", value: 15 },
          DESCUENTO500: { type: "fixed", value: 500 },
        }

        const discount = validDiscounts[code.toUpperCase()]
        if (discount) {
          set({ discountCode: code, discountInfo: discount })
        } else {
          throw new Error("Código de descuento inválido")
        }
      },

      saveSession: async () => {
        const state = get()
        const sessionId = `session-${Date.now()}`
        // In real app, save to backend
        localStorage.setItem(`cart-session-${sessionId}`, JSON.stringify(state))
        set({ savedSessionId: sessionId })
        return sessionId
      },

      loadSession: async (sessionId: string) => {
        // In real app, load from backend
        const saved = localStorage.getItem(`cart-session-${sessionId}`)
        if (saved) {
          const state = JSON.parse(saved)
          set({
            ...state,
            printSelections: state.printSelections ?? [],
            subtotalImpresasOverride: undefined,
            subtotalFotosOverride: undefined,
            totalOverride: undefined,
          })
          
        }
      },

      clearCart: () => {
        set({
          items: [],
          printSelections: [],
          email: undefined,
          discountCode: undefined,
          discountInfo: undefined,
          subtotal: 0,
          total: 0,
      
          // 🔥 limpiar overrides
          subtotalImpresasOverride: undefined,
          subtotalFotosOverride: undefined,
          totalOverride: undefined,
        })
      },
      

      setEditableTotals: (data) =>
        set((state) => ({
          subtotalImpresasOverride:
            data.subtotalImpresas ?? state.subtotalImpresasOverride,
          subtotalFotosOverride:
            data.subtotalFotos ?? state.subtotalFotosOverride,
          totalOverride: data.total ?? state.totalOverride,
        })),
      
      clearEditableTotals: () =>
        set({
          subtotalImpresasOverride: undefined,
          subtotalFotosOverride: undefined,
          totalOverride: undefined,
        }),
      

      updateTotals: (photos: Photo[]) => {
        const { items, printSelections, discountInfo } = get()

        const photoPriceMap = photos.reduce<Map<string, number>>((acc, photo) => {
          acc.set(photo.id, photo.price || 0)
          return acc
        }, new Map())

        // 🔐 Regla de negocio: toda foto marcada para imprimir sigue siendo una compra digital.
        // Por eso el subtotal digital considera TODAS las fotos del carrito.
        const subtotalFotos = items.reduce((sum, item) => {
          const price = photoPriceMap.get(item.photoId) ?? 0
          return sum + price
        }, 0)

        // Precio de impresión = precio de pack * cantidad de packs necesarios.
        // No incluye el precio digital (se suma aparte en subtotalFotos).
        const subtotalImpresas = printSelections.reduce((sum, selection) => {
          const packSize = getPackSize(selection.format)
          const packs = Math.ceil(selection.photoIds.length / packSize)
          return sum + packs * selection.format.price
        }, 0)

        const subtotal = subtotalFotos + subtotalImpresas

        let total = subtotal
        if (discountInfo) {
          if (discountInfo.type === "percent") {
            total = subtotal * (1 - discountInfo.value / 100)
          } else {
            total = Math.max(0, subtotal - discountInfo.value)
          }
        }

        const {
          subtotalImpresasOverride,
          subtotalFotosOverride,
          totalOverride,
        } = get()
        
        // Si hay override (staff), NO recalcular
        if (
          subtotalImpresasOverride !== undefined ||
          subtotalFotosOverride !== undefined ||
          totalOverride !== undefined
        ) {
          return
        }
        
        set({ subtotal, total })
        
      },
    }),
    {
      name: "cart-storage",
    },
  ),
)

interface LightboxStore extends LightboxState {
  open: (photoId: string, photos: Photo[]) => void
  close: () => void
  next: () => void
  prev: () => void
}

export const useLightboxStore = create<LightboxStore>((set, get) => ({
  isOpen: false,
  currentPhotoId: undefined,
  photos: [],

  open: (photoId: string, photos: Photo[]) => {
    set({ isOpen: true, currentPhotoId: photoId, photos })
  },

  close: () => {
    set({ isOpen: false, currentPhotoId: undefined })
  },

  next: () => {
    const { currentPhotoId, photos } = get()
    if (!currentPhotoId) return

    const currentIndex = photos.findIndex((p) => p.id === currentPhotoId)
    const nextIndex = (currentIndex + 1) % photos.length
    set({ currentPhotoId: photos[nextIndex].id })
  },

  prev: () => {
    const { currentPhotoId, photos } = get()
    if (!currentPhotoId) return

    const currentIndex = photos.findIndex((p) => p.id === currentPhotoId)
    const prevIndex = (currentIndex - 1 + photos.length) % photos.length
    set({ currentPhotoId: photos[prevIndex].id })
  },
}))

interface GalleryStore extends GalleryState {
  setFilters: (filters: Partial<Filters>) => void
  setMode: (mode: "web" | "local") => void
  setPhotos: (photos: Photo[]) => void
  selectedPhotos: string[]
  toggleSelection: (photoId: string) => void
  clearSelection: () => void
  selectAll: (photoIds: string[]) => void
}

export const useGalleryStore = create<GalleryStore>((set) => ({
  photos: [],
  filters: {},
  page: 1,
  totalPages: 1,
  mode: "web",
  selectedPhotos: [],

  setFilters: (filters: Partial<Filters>) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }))
  },

  setMode: (mode: "web" | "local") => {
    set({ mode })
  },

  setPhotos: (photos: Photo[]) => {
    set({ photos })
  },

  toggleSelection: (photoId: string) => {
    set((state) => ({
      selectedPhotos: state.selectedPhotos.includes(photoId)
        ? state.selectedPhotos.filter((id) => id !== photoId)
        : [...state.selectedPhotos, photoId],
    }))
  },

  clearSelection: () => {
    set({ selectedPhotos: [] })
  },

  selectAll: (photoIds: string[]) => {
    set({ selectedPhotos: photoIds })
  },
}))

export type LogoutReason = "manual" | "expired" | "invalid" | "storage" | "forbidden"

export interface LogoutOptions {
  reason?: LogoutReason
  redirect?: boolean
  redirectTo?: string
  silent?: boolean
}

interface AuthState {
  token: string | null
  expiresAt: number | null
  user: User | null
  isAuthenticated: boolean
  initialized: boolean
}

interface AuthStore extends AuthState {
  setToken: (token: string | null, expiresAt: number | null) => void
  setUser: (user: User | null) => void
  setSession: (session: { token: string; expiresAt: number; user: User }) => void
  isTokenExpired: (graceMs?: number) => boolean
  logout: (options?: LogoutOptions) => void
  init: () => void
}

const initialAuthState: AuthState = {
  token: null,
  expiresAt: null,
  user: null,
  isAuthenticated: false,
  initialized: false,
}

/* const computeIsAuthenticated = (snapshot: StoredAuthSnapshot) => {
  if (!snapshot.token || !snapshot.user) return false
  if (!snapshot.expiresAt) return false
  return snapshot.expiresAt > Date.now()
} */

  const computeIsAuthenticated = (snapshot: StoredAuthSnapshot) => {
    if (!snapshot.token) return false
    if (!snapshot.expiresAt) return false
    return snapshot.expiresAt > Date.now()
  }
  

const LOGOUT_MESSAGES: Record<LogoutReason, { title: string; description: string }> = {
  manual: {
    title: "Sesión cerrada",
    description: "Cerraste sesión correctamente.",
  },
  expired: {
    title: "Sesión expirada",
    description: "Tu sesión venció. Iniciá sesión nuevamente.",
  },
  invalid: {
    title: "Sesión inválida",
    description: "El token dejó de ser válido. Volvé a iniciar sesión.",
  },
  storage: {
    title: "Sesión finalizada",
    description: "La sesión se cerró en otra pestaña.",
  },
  forbidden: {
    title: "Acceso restringido",
    description: "No tenés permisos para continuar.",
  },
}

const DEFAULT_LOGIN_ROUTE = "/"
let logoutInFlight = false
let storageListenerRegistered = false

// ✅ Tipo universal (Node + Browser)
let expirationTimer: ReturnType<typeof setTimeout> | null = null

const scheduleExpirationCheck = (
  expiresAt: number | null,
  logoutFn: (options?: LogoutOptions) => void,
  reason: LogoutReason = "expired",
) => {
  if (typeof window === "undefined") return

  if (expirationTimer) {
    clearTimeout(expirationTimer)
    expirationTimer = null
  }

  if (!expiresAt) return

  const remaining = expiresAt - Date.now()

  if (remaining <= 0) {
    logoutFn({ reason })
    return
  }

  expirationTimer = setTimeout(() => {
    logoutFn({ reason })
  }, remaining)
}

const clearExpirationTimer = () => {
  if (typeof window === "undefined") return

  if (expirationTimer) {
    clearTimeout(expirationTimer)
    expirationTimer = null
  }
}



const persistSnapshot = (snapshot: StoredAuthSnapshot | null) => {
  if (!snapshot || !snapshot.token) {
    writeStoredAuthSnapshot(null)
    return
  }
  writeStoredAuthSnapshot(snapshot)
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialAuthState,

  setToken: (token: string | null, expiresAt: number | null) => {
    set((state) => {
      const normalizedExpiresAt = token && expiresAt ? expiresAt : null
      const snapshot: StoredAuthSnapshot = {
        token,
        expiresAt: normalizedExpiresAt,
        user: state.user,
      }
      persistSnapshot(snapshot)
      return {
        ...state,
        token,
        expiresAt: normalizedExpiresAt,
        isAuthenticated: computeIsAuthenticated(snapshot),
      }
    })
    scheduleExpirationCheck(get().expiresAt, get().logout)
  },

  setUser: (user: User | null) => {
    set((state) => {
      const snapshot: StoredAuthSnapshot = {
        token: state.token,
        expiresAt: state.expiresAt,
        user,
      }
      persistSnapshot(snapshot)
      return {
        ...state,
        user,
        isAuthenticated: computeIsAuthenticated(snapshot),
      }
    })
  },

  setSession: ({ token, expiresAt, user }) => {
    set((state) => {
      const snapshot: StoredAuthSnapshot = {
        token,
        expiresAt,
        user,
      }
      persistSnapshot(snapshot)
      return {
        ...state,
        token,
        expiresAt,
        user,
        isAuthenticated: computeIsAuthenticated(snapshot),
      }
    })
    scheduleExpirationCheck(expiresAt, get().logout)
  },

  isTokenExpired: (graceMs = 0) => {
    const { expiresAt } = get()
    if (!expiresAt) return true
    return isTimestampExpired(expiresAt, graceMs)
  },

  logout: (options: LogoutOptions = {}) => {
    const { reason = "manual", redirect = true, redirectTo, silent } = options
    if (logoutInFlight) return

    logoutInFlight = true
    clearExpirationTimer()

    set((state) => ({
      ...initialAuthState,
      initialized: state.initialized,
    }))

    persistSnapshot(null)

    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(LEGACY_TOKEN_KEY)
      } catch {
        // noop
      }
      try {
        window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
      } catch {
        // noop
      }
    }

    if (!silent && typeof window !== "undefined") {
      const message = LOGOUT_MESSAGES[reason] ?? LOGOUT_MESSAGES.manual
      toast({
        title: message.title,
        description: message.description,
      })
    }

    if (redirect && typeof window !== "undefined") {
      const target = redirectTo || DEFAULT_LOGIN_ROUTE
      window.location.replace(target)
    }

    setTimeout(() => {
      logoutInFlight = false
    }, 500)
  },

  init: () => {
    if (typeof window === "undefined") return
    if (get().initialized) return

    let snapshot = readStoredAuthSnapshot()

    if (!snapshot) {
      const legacyToken = window.localStorage.getItem(LEGACY_TOKEN_KEY)
      if (legacyToken) {
        snapshot = {
          token: legacyToken,
          expiresAt: getTokenExpiration(legacyToken),
          user: null,
        }
        persistSnapshot(snapshot)
      }
    }

    if (snapshot) {
      set((state) => ({
        ...state,
        token: snapshot?.token ?? null,
        expiresAt: snapshot?.expiresAt ?? null,
        user: snapshot?.user ?? null,
        isAuthenticated: computeIsAuthenticated(snapshot),
      }))

      if (isTimestampExpired(snapshot.expiresAt)) {
        get().logout({ reason: "expired" })
        return
      }

      scheduleExpirationCheck(snapshot.expiresAt ?? null, get().logout)
    }

    registerStorageSync()
    set({ initialized: true })
  },
}))

const registerStorageSync = () => {
  if (storageListenerRegistered || typeof window === "undefined") return

  window.addEventListener("storage", (event: StorageEvent) => {
    if (event.key === AUTH_STORAGE_KEY) {
      if (!event.newValue) {
        useAuthStore.getState().logout({ reason: "storage" })
        return
      }
      try {
        const snapshot = JSON.parse(event.newValue) as StoredAuthSnapshot
        useAuthStore.setState((state) => ({
          ...state,
          token: snapshot.token,
          expiresAt: snapshot.expiresAt ?? null,
          user: snapshot.user ?? null,
          isAuthenticated: computeIsAuthenticated(snapshot),
        }))
        scheduleExpirationCheck(snapshot.expiresAt ?? null, useAuthStore.getState().logout)
      } catch (error) {
        console.error("Error sincronizando autenticación entre pestañas", error)
      }
      return
    }

    if (event.key === LEGACY_TOKEN_KEY && !event.newValue) {
      useAuthStore.getState().logout({ reason: "storage" })
    }
  })

  storageListenerRegistered = true
}

if (typeof window !== "undefined") {
  useAuthStore.getState().init()
}
