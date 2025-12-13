import type { Photo, Album, Photographer, Order, User, SessionRow, Tag, DiscountCode, PhotoCombo } from "./types"

export const mockPhotographers: Photographer[] = [
  {
    id: 1,
    name: "Juan Pérez",
    contact_info: "juan@fotospatagonia.com",
    commission_percentage: 15,
  },
  {
    id: 2,
    name: "María González",
    contact_info: "maria@fotospatagonia.com",
    commission_percentage: 20,
  },
]

export const mockAlbums: Album[] = [
  {
    id: "1",
    name: "Maratón Bariloche 2024",
    photographerIds: ["1"],
    createdAt: "2024-03-15T10:00:00Z",
    event: "Maratón de Bariloche",
    location: "Bariloche, Río Negro",
    photoCount: 156,
    coverPhoto: "/patagonia-mountain-landscape-sunset.jpg",
    isPublic: true,
    tagIds: ["1", "4"],
  },
  {
    id: "2",
    name: "Trekking Fitz Roy",
    photographerIds: ["2"],
    createdAt: "2024-02-20T10:00:00Z",
    event: "Trekking al Fitz Roy",
    location: "El Chaltén, Santa Cruz",
    photoCount: 89,
    coverPhoto: "/trail-running-patagonia.jpg",
    isPublic: true,
    tagIds: ["2", "4"],
  },
  {
    id: "3",
    name: "Ciclismo Ruta 40",
    photographerIds: ["1"],
    createdAt: "2024-01-10T10:00:00Z",
    event: "Desafío Ruta 40",
    location: "Ruta 40, Patagonia",
    photoCount: 234,
    coverPhoto: "/mountain-biking-patagonia-forest.jpg",
    isPublic: true,
    tagIds: ["3"],
  },
  {
    id: "4",
    name: "Trail Running Cerro Catedral",
    photographerIds: ["2"],
    createdAt: "2024-03-01T10:00:00Z",
    event: "Trail Running Cerro Catedral",
    location: "Bariloche, Río Negro",
    photoCount: 178,
    coverPhoto: "/hiking-patagonia-mountains.jpg",
    isPublic: true,
    tagIds: ["2"],
  },
  {
    id: "5",
    name: "Kayak Lago Nahuel Huapi",
    photographerIds: ["1", "2"],
    createdAt: "2024-02-15T10:00:00Z",
    event: "Travesía en Kayak",
    location: "Lago Nahuel Huapi",
    photoCount: 92,
    coverPhoto: "/patagonia-lake-reflection.jpg",
    isPublic: true,
    tagIds: ["4"],
  },
  {
    id: "6",
    name: "Escalada en Hielo Perito Moreno",
    photographerIds: ["1", "2"],
    createdAt: "2024-01-25T10:00:00Z",
    event: "Escalada en Hielo",
    location: "Glaciar Perito Moreno",
    photoCount: 145,
    coverPhoto: "/patagonia-glacier-ice-blue.jpg",
    isPublic: true,
    tagIds: ["4"],
  },
]

export const mockPhotos: Photo[] = [
  {
    id: "1",
    albumId: "1",
    photographerId: "1",
    takenAt: "2024-03-15T10:30:00Z",
    place: "Bariloche",
    timeSlot: "10:30",
    price: 1500,
    urls: {
      thumb: "/marathon-runner.png",
      web: "/marathon-runner-with-watermark.jpg",
      local: "/marathon-runner-high-quality.jpg",
      original: "/marathon-runner-original.jpg",
    },
  },
  {
    id: "2",
    albumId: "1",
    photographerId: "1",
    takenAt: "2024-03-15T11:15:00Z",
    place: "Bariloche",
    timeSlot: "11:15",
    price: 1500,
    urls: {
      thumb: "/patagonia-landscape.jpg",
      web: "/patagonia-landscape-with-watermark.jpg",
      local: "/patagonia-landscape-high-quality.jpg",
      original: "/patagonia-landscape-original.jpg",
    },
  },
  {
    id: "3",
    albumId: "2",
    photographerId: "2",
    takenAt: "2024-02-20T14:00:00Z",
    place: "El Chaltén",
    timeSlot: "14:00",
    price: 2000,
    urls: {
      thumb: "/fitz-roy-mountain.jpg",
      web: "/fitz-roy-mountain-with-watermark.jpg",
      local: "/fitz-roy-mountain-high-quality.jpg",
      original: "/fitz-roy-mountain-original.jpg",
    },
  },
  {
    id: "4",
    albumId: "2",
    photographerId: "2",
    takenAt: "2024-02-20T15:30:00Z",
    place: "El Chaltén",
    timeSlot: "15:30",
    price: 2000,
    urls: {
      thumb: "/trekking-patagonia.jpg",
      web: "/trekking-patagonia-with-watermark.jpg",
      local: "/trekking-patagonia-high-quality.jpg",
      original: "/trekking-patagonia-original.jpg",
    },
  },
  {
    id: "5",
    albumId: "3",
    photographerId: "1",
    takenAt: "2024-01-10T09:00:00Z",
    place: "Ruta 40",
    timeSlot: "09:00",
    price: 1800,
    urls: {
      thumb: "/placeholder.svg?height=200&width=200",
      web: "/placeholder.svg?height=400&width=400",
      local: "/placeholder.svg?height=800&width=800",
      original: "/placeholder.svg?height=4000&width=4000",
    },
  },
  {
    id: "6",
    albumId: "3",
    photographerId: "1",
    takenAt: "2024-01-10T10:45:00Z",
    place: "Ruta 40",
    timeSlot: "10:45",
    price: 1800,
    urls: {
      thumb: "/placeholder.svg?height=200&width=200",
      web: "/placeholder.svg?height=400&width=400",
      local: "/placeholder.svg?height=800&width=800",
      original: "/placeholder.svg?height=4000&width=4000",
    },
  },
  {
    id: "7",
    albumId: "1",
    photographerId: "1",
    takenAt: "2024-03-15T12:00:00Z",
    place: "Bariloche",
    timeSlot: "12:00",
    price: 1500,
    urls: {
      thumb: "/placeholder.svg?height=200&width=200",
      web: "/placeholder.svg?height=400&width=400",
      local: "/placeholder.svg?height=800&width=800",
      original: "/placeholder.svg?height=4000&width=4000",
    },
  },
  {
    id: "8",
    albumId: "2",
    photographerId: "2",
    takenAt: "2024-02-20T16:00:00Z",
    place: "El Chaltén",
    timeSlot: "16:00",
    price: 2000,
    urls: {
      thumb: "/placeholder.svg?height=200&width=200",
      web: "/placeholder.svg?height=400&width=400",
      local: "/placeholder.svg?height=800&width=800",
      original: "/placeholder.svg?height=4000&width=4000",
    },
  },
]

export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    channel: "web",
    status: "pagado",
    email: "cliente1@example.com",
    paymentMethod: "mp",
    total: 4500,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    editableUntil: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    photos: ["1", "2", "3", "4", "5", "6", "7"],
    items: [
      { photoId: "1", forPrint: false }, // Solo descarga
      { photoId: "2", forPrint: true },  // Para impresión
      { photoId: "3", forPrint: true },  // Para impresión
      { photoId: "4", forPrint: false }, // Solo descarga
      { photoId: "5", forPrint: false }, // Solo descarga
      { photoId: "6", forPrint: false }, // Solo descarga
      { photoId: "7", forPrint: false }, // Solo descarga
    ],
  },
  {
    id: "ORD-002",
    channel: "local",
    status: "en_espera",
    email: "cliente2@example.com",
    paymentMethod: "efectivo",
    total: 3000,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    editableUntil: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
    photos: ["4", "5"],
    items: [
      { photoId: "4", forPrint: false }, // Solo descarga
      { photoId: "5", forPrint: false }, // Solo descarga
    ],
  },
]

export const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@fotospatagonia.com",
    role: "admin",
    permissions: ["all"],
  },
  {
    id: "2",
    email: "vendedor@fotospatagonia.com",
    role: "vendedor",
    commission: 10,
    permissions: ["view_orders", "create_orders"],
  },
]

export const mockSessions: SessionRow[] = [
  {
    id: "session-1234567890",
    link: "/carrito?session=session-1234567890",
    email: "cliente1@example.com",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "session-0987654321",
    link: "/carrito?session=session-0987654321",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
]

export const mockTags: Tag[] = [
  {
    id: "1",
    name: "Maratón",
    color: "#f9a01b",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Trail Running",
    color: "#ffecce",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Ciclismo",
    color: "#f2f2e4",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "Trekking",
    color: "#f9a01b",
    createdAt: "2024-01-01T00:00:00Z",
  },
]

export const mockDiscountCodes: DiscountCode[] = [
  {
    id: "1",
    code: "PATAGONIA2024",
    type: "percent",
    value: 10,
    maxUses: 100,
    usedCount: 45,
    expiresAt: "2024-12-31T23:59:59Z",
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    code: "MARATONBRC",
    type: "fixed",
    value: 500,
    usedCount: 23,
    expiresAt: "2024-06-30T23:59:59Z",
    active: true,
    createdAt: "2024-02-01T00:00:00Z",
  },
]

export const mockPhotoCombos: PhotoCombo[] = [
  {
    id: "1",
    name: "Foto Individual",
    totalPhotos: 1,
    price: 10000,
    equivalentPhotos: 1,
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Combo 3 Fotos",
    totalPhotos: 3,
    price: 25000,
    equivalentPhotos: 2.5,
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Combo 6 Fotos",
    totalPhotos: 6,
    price: 50000,
    equivalentPhotos: 5,
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "Combo 8 Fotos",
    totalPhotos: 8,
    price: 65000,
    equivalentPhotos: 6.5,
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "5",
    name: "Combo 10 Fotos",
    totalPhotos: 10,
    price: 75000,
    equivalentPhotos: 7.5,
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "6",
    name: "Álbum Completo",
    totalPhotos: 0, // 0 significa todas las fotos del álbum
    price: 150000,
    equivalentPhotos: 0,
    active: true,
    isFullAlbum: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
]
