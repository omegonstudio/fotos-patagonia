"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Plus, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PhotoModal } from "@/components/organisms/photo-modal"
import { usePhotos, type BackendPhoto } from "@/hooks/photos/usePhotos"
import { useSessions } from "@/hooks/sessions/useSessions"
import Image from "next/image"

export default function FotosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [selectedPhoto, setSelectedPhoto] = useState<BackendPhoto | undefined>(undefined)

  // Obtener fotos y sesiones del backend
  const { photos, loading, refetch } = usePhotos()
  const { sessions } = useSessions()

  const filteredPhotos = photos.filter((photo) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      photo.filename?.toLowerCase().includes(searchLower) ||
      photo.description?.toLowerCase().includes(searchLower) ||
      photo.photographer?.name?.toLowerCase().includes(searchLower)
    )
  })

  const getSessionName = (sessionId?: number) => {
    if (!sessionId) return "Sin sesión"
    const session = sessions.find((s) => s.id === sessionId)
    return session?.event_name || "Sin sesión"
  }

  const handleAddPhoto = () => {
    setModalMode("add")
    setSelectedPhoto(undefined)
    setIsModalOpen(true)
  }

  const handleEditPhoto = (photo: BackendPhoto) => {
    setModalMode("edit")
    setSelectedPhoto(photo)
    setIsModalOpen(true)
  }

  const handlePhotoSaved = () => {
    // Refrescar la lista de fotos después de guardar
    refetch()
  }

  return (
    <div className="container mx-auto px-4 py-8">
     {/*  <Link href="/admin" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al panel
      </Link> */}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold">Gestión de Fotos</h1>
          <p className="text-muted-foreground">Administra el catálogo de fotos</p>
        </div>
        <Button
          onClick={handleAddPhoto}
          className="rounded-xl bg-primary font-semibold text-foreground hover:bg-primary-hover"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Foto
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6 rounded-2xl border-gray-200">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por lugar o fecha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="rounded-2xl border-gray-200">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Cargando fotos...</p>
          </CardContent>
        </Card>
      )}

      {/* Photos Grid */}
      {!loading && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPhotos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden rounded-2xl border-gray-200">
                <div className="aspect-square bg-muted relative">
                  <Image
                    src={photo.watermark_url || photo.url}
                    alt={photo.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <CardContent className="pt-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{photo.filename}</h3>
                      {photo.description && (
                        <p className="text-sm text-muted-foreground truncate">{photo.description}</p>
                      )}
                    </div>
                    <Badge className="bg-primary/10 text-primary ml-2 flex-shrink-0">${photo.price}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Fotógrafo: {photo.photographer?.name || "Sin fotógrafo"}</p>
                    {photo.tags && photo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {photo.tags.map((tag) => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleEditPhoto(photo)}
                    variant="outline"
                    className="mt-4 w-full rounded-xl bg-transparent hover:bg-[#ffecce]"
                  >
                    Editar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPhotos.length === 0 && !loading && (
            <Card className="rounded-2xl border-gray-200">
              <CardContent className="py-12 text-center text-muted-foreground">
                No se encontraron fotos
              </CardContent>
            </Card>
          )}
        </>
      )}

      <PhotoModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        photo={selectedPhoto}
        onSave={handlePhotoSaved}
      />
    </div>
  )
}
