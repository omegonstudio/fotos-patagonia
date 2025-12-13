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
import type { CartState, LightboxState, GalleryState, Photo, Filters, User, PrintFormat } from "./types"

interface CartStore extends CartState {
  addItem: (photoId: string) => void
  removeItem: (photoId: string) => void
  toggleFavorite: (photoId: string) => void
  togglePrinter: (photoId: string) => void
  setPrintFormat: (photoId: string, format: PrintFormat) => void
  clearNonFavorites: () => void
  setEmail: (email: string) => void
  applyDiscount: (code: string) => Promise<void>
  saveSession: () => Promise<string>
  loadSession: (sessionId: string) => Promise<void>
  clearCart: () => void
  updateTotals: (photos: Photo[]) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      email: undefined,
      discountCode: undefined,
      discountInfo: undefined,
      subtotal: 0,
      total: 0,
      savedSessionId: undefined,
      channel: "web",

      addItem: (photoId: string) => {
        const { items } = get()
        if (items.some((item) => item.photoId === photoId)) return

        set({ items: [...items, { photoId, favorite: false, printer: false }] })
      },

      removeItem: (photoId: string) => {
        set({ items: get().items.filter((item) => item.photoId !== photoId) })
      },

      toggleFavorite: (photoId: string) => {
        set({
          items: get().items.map((item) => (item.photoId === photoId ? { ...item, favorite: !item.favorite } : item)),
        })
      },

      togglePrinter: (photoId: string) => {
        set({
          items: get().items.map((item) => (item.photoId === photoId ? { ...item, printer: !item.printer } : item)),
        })
      },

      setPrintFormat: (photoId: string, format: PrintFormat) => {
        set({
          items: get().items.map((item) =>
            item.photoId === photoId ? { ...item, printFormat: format, printer: true } : item
          ),
        })
      },

      clearNonFavorites: () => {
        set({ items: get().items.filter((item) => item.favorite) })
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
          set(state)
        }
      },

      clearCart: () => {
        set({
          items: [],
          email: undefined,
          discountCode: undefined,
          discountInfo: undefined,
          subtotal: 0,
          total: 0,
        })
      },

      updateTotals: (photos: Photo[]) => {
        const { items, discountInfo } = get()
        const subtotal = items.reduce((sum, item) => {
          // Si tiene formato de impresión, usar el precio del formato
          if (item.printer && item.printFormat) {
            return sum + item.printFormat.price
          }
          // Si no, usar el precio base de la foto
          const photo = photos.find((p) => p.id === item.photoId)
          return sum + (photo?.price || 0)
        }, 0)

        let total = subtotal
        if (discountInfo) {
          if (discountInfo.type === "percent") {
            total = subtotal * (1 - discountInfo.value / 100)
          } else {
            total = Math.max(0, subtotal - discountInfo.value)
          }
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

const computeIsAuthenticated = (snapshot: StoredAuthSnapshot) => {
  if (!snapshot.token || !snapshot.user) return false
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
let expirationTimer: ReturnType<typeof setTimeout> | null = null

const scheduleExpirationCheck = (
  expiresAt: number | null,
  logoutFn: (options?: LogoutOptions) => void,
  reason: LogoutReason = "expired",
) => {
  if (typeof window === "undefined") return
  if (expirationTimer) {
    window.clearTimeout(expirationTimer)
    expirationTimer = null
  }
  if (!expiresAt) return

  const remaining = expiresAt - Date.now()
  if (remaining <= 0) {
    logoutFn({ reason })
    return
  }

  expirationTimer = window.setTimeout(() => {
    logoutFn({ reason })
  }, remaining)
}

const clearExpirationTimer = () => {
  if (typeof window === "undefined") return
  if (expirationTimer) {
    window.clearTimeout(expirationTimer)
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
        window.sessionStorage.clear()
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
