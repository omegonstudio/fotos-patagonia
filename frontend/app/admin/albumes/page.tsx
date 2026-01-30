"use client"

import { useState, useCallback, useMemo } from "react"
import { Upload, Plus, Search, ImageIcon, Trash2, FolderOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useAlbumsList } from "@/hooks/albums/useAlbumsList"
import { useAlbums } from "@/hooks/albums/useAlbums"
import { usePhotographers } from "@/hooks/photographers/usePhotographers"
import { usePhotoUpload } from "@/hooks/photos/usePhotoUpload"
import { useSessions } from "@/hooks/sessions/useSessions"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function AdminAlbumesPage() {
  const { albums, loading, fetching, error, refetch } = useAlbumsList()
  const { createAlbum } = useAlbums()
  const { photographers, loading: photographersLoading } = usePhotographers()
  const { sessions } = useSessions()
  const { uploadPhotos, uploading, progress } = usePhotoUpload()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<string>("")
  const [selectedSession, setSelectedSession] = useState<string>("")
  const [selectedPhotographer, setSelectedPhotographer] = useState<string>("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [newAlbumName, setNewAlbumName] = useState("")
  const [newAlbumDescription, setNewAlbumDescription] = useState("")
  const [newAlbumDefaultPrice, setNewAlbumDefaultPrice] = useState("")
  const [price, setPrice] = useState("100")

  const filteredAlbums = useMemo(() => {
    return albums.filter((a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [albums, searchTerm])

  const availableSessions = selectedAlbum
    ? sessions.filter((s: any) => String(s.album_id) === selectedAlbum)
    : sessions

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/"),
    )
    setUploadedFiles((prev) => [...prev, ...files])
  }

  const handleUpload = async () => {
    if (!selectedAlbum || !selectedSession || !selectedPhotographer) return

    await uploadPhotos({
      files: uploadedFiles,
      photographer_id: Number(selectedPhotographer),
      session_id: Number(selectedSession),
      album_id: Number(selectedAlbum),
      price: Number(price),
    })

    toast({ title: "Fotos subidas correctamente" })
    setUploadedFiles([])
  }

  const handleCreateAlbum = async () => {
    await createAlbum({
      name: newAlbumName,
      description: newAlbumDescription || undefined,
      default_photo_price: newAlbumDefaultPrice
        ? Number(newAlbumDefaultPrice)
        : undefined,
    })
    toast({ title: "Álbum creado" })
    setIsDialogOpen(false)
    refetch()
  }

  if (loading || photographersLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive mb-4">Error al cargar álbumes</p>
        <Button onClick={refetch}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-heading">Gestión de Álbumes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Álbum
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear álbum</DialogTitle>
              <DialogDescription>Datos básicos del álbum</DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Nombre"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
            />
            <Input
              placeholder="Descripción"
              value={newAlbumDescription}
              onChange={(e) => setNewAlbumDescription(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Precio por defecto"
              value={newAlbumDefaultPrice}
              onChange={(e) => setNewAlbumDefaultPrice(e.target.value)}
            />
            <DialogFooter>
              <Button onClick={handleCreateAlbum} disabled={!newAlbumName}>
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {fetching && (
        <div className="flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <Input
        placeholder="Buscar álbum..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="grid gap-2 max-h-[400px] overflow-y-auto">
        {filteredAlbums.map((album) => (
          <div
            key={album.id}
            className={cn(
              "rounded-xl border p-3 cursor-pointer",
              selectedAlbum === String(album.id) && "border-primary",
            )}
            onClick={() => setSelectedAlbum(String(album.id))}
          >
            <h4 className="font-semibold">{album.name}</h4>
            <p className="text-xs text-muted-foreground">
              {album.photoCount} fotos
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
