export interface Photo {
  id: string
  albumId?: string
  albumName?: string
  sessionId?: string
  photographerId?: string
  photographerName?: string
  takenAt?: string // ISO date string
  place?: string
  timeSlot?: string // "18:30", range, etc.
  price?: number // visible only where appropriate
  description?: string
  tags?: string[] // Added tags field for photo categorization
  urls: {
    thumb: string
    web: string // with watermark (web)
    local: string // without watermark (local)
    original?: string // admin/order
  }
}

// IDs válidos para formatos de impresión
export type PrintFormatId =
  | "polaroid-large"
  | "polaroid-medium"
  | "polaroid-small"
  | "10x15"
  | "15x20"

export interface PrintFormat {
  id: PrintFormatId
  name: string
  size: string // "10x15", "13x18", etc.
  price: number
  description?: string
  active: boolean
  requiredPhotos?: number // Cantidad específica de fotos requeridas para este formato (ej: Polaroid)
}

export interface CartItem {
  photoId: string
  favorite: boolean
  printer: boolean
  printFormat?: PrintFormat // Formato seleccionado si es para imprimir
}

export interface CartState {
  items: CartItem[]
  email?: string
  discountCode?: string
  discountInfo?: { type: "percent" | "fixed"; value: number }
  subtotal: number
  total: number
  savedSessionId?: string
  channel: "web" | "local" // affects checkout flow
}

export interface Filters {
  date?: string
  place?: string
  time?: string
}

export interface SessionRow {
  id: string
  link: string
  email?: string
  createdAt: string
}

export interface OrderItem {
  photoId: string
  forPrint: boolean // true si es para impresión, false si es solo descarga digital
  printFormat?: PrintFormat // Formato de impresión si forPrint es true
  priceAtPurchase: number // Precio al momento de la compra (no se modifica después)
}

export interface Order {
  id: string
  channel: "web" | "local"
  status: "enviado" | "rechazado" | "en_espera" | "pagado" | "entregado"
  email: string
  downloadUrl?: string
  paymentMethod?: "efectivo" | "transferencia" | "posnet" | "mp"
  total: number
  createdAt: string
  editableUntil: string // +24h
  photos: string[] // photo ids (deprecated, mantener por compatibilidad)
  items?: OrderItem[] // nueva estructura con información de impresión
}

export interface Permission {
  id: number
  name: string
  description?: string
}

export interface Role {
  id: number
  name: string
  description?: string
  permissions: Permission[]
}

export interface User {
  id: number
  email: string
  is_active: boolean
  role: Role
  // Campos auxiliares para compatibilidad con código existente
  photographer_id?: number
}

// Helper function para obtener el nombre del rol
export function getUserRoleName(user: User | null): string | null {
  return user?.role?.name || null
}

// Helper function para verificar si el usuario tiene un permiso
export function hasPermission(user: User | null, permissionName: string): boolean {
  if (!user?.role?.permissions) return false
  return user.role.permissions.some(p => p.name === permissionName)
}

// Helper function para verificar si el usuario es admin
export function isAdmin(user: User | null): boolean {
  return hasPermission(user, 'full_access') || getUserRoleName(user)?.toLowerCase() === 'admin'
}

export interface Album {
  id: string | number
  name: string
  description?: string | null
  // Backend fields (from PhotoSession, populated in responses)
  sessions?: any[] // PhotoSession[]
  tags?: Tag[]
  // Legacy frontend fields (optional)
  filters?: Filters
  photographerIds?: string[]
  coverPhoto?: string
  createdAt?: string
  event?: string
  location?: string
  photoCount?: number
  isPublic?: boolean
}

export interface Photographer {
  id: number
  name: string
  commission_percentage: number
  contact_info: string
  user_id?: number
}

export interface LightboxState {
  isOpen: boolean
  currentPhotoId?: string
  photos: Photo[]
}

export interface GalleryState {
  photos: Photo[]
  filters: Filters
  page: number
  totalPages: number
  mode: "web" | "local" // determines which URL to use (with/without watermark)
}

export interface Tag {
  id: string | number
  name: string
  color?: string
  createdAt?: string
}

export interface DiscountCode {
  id: string
  code: string
  type: "percent" | "fixed"
  value: number
  maxUses?: number
  usedCount: number
  expiresAt?: string
  active: boolean
  createdAt: string
}

export interface PhotoCombo {
  id: string
  name: string
  description?: string // Descripción del combo
  totalPhotos: number // Cantidad total de fotos en el combo
  price: number // Precio total del combo
  equivalentPhotos?: number // Fotos reales que se pagan (para calcular descuento) - solo frontend
  active: boolean
  isFullAlbum: boolean // Si es un combo de álbum completo
  createdAt?: string // Solo frontend, no viene del backend
}
