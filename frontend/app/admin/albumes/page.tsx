"use client"

import type React from "react"

import { useState, useCallback } from "react"
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
import { useAlbums } from "@/hooks/albums/useAlbums"
import { usePhotographers } from "@/hooks/photographers/usePhotographers"
import { usePhotoUpload } from "@/hooks/photos/usePhotoUpload"
import { useSessions } from "@/hooks/sessions/useSessions"
import type { Album } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function AdminAlbumesPage() {
  // Hooks para backend
  const { data: albumsData, loading: albumsLoading, createAlbum, refetch: refetchAlbums } = useAlbums()
  const { photographers, loading: photographersLoading } = usePhotographers()
  const { sessions } = useSessions()
  const { uploadPhotos, uploading, progress } = usePhotoUpload()
  const { toast } = useToast()

  // Estados locales
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<string>("")
  const [selectedSession, setSelectedSession] = useState<string>("")
  const [selectedPhotographer, setSelectedPhotographer] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [newAlbumName, setNewAlbumName] = useState("")
  const [newAlbumDescription, setNewAlbumDescription] = useState("")
  const [price, setPrice] = useState<string>("100")

  // Convertir datos del backend
  const albums = Array.isArray(albumsData) ? albumsData : []
  const filteredAlbums = albums.filter((album: any) => 
    album.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filtrar sesiones del álbum seleccionado
  const availableSessions = selectedAlbum 
    ? sessions.filter((s: any) => String(s.album_id) === selectedAlbum)
    : sessions

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

      if (files.length === 0) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive",
        })
        return
      }

      setUploadedFiles((prev) => [...prev, ...files])
    },
    [toast],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith("image/"))

    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      })
      return
    }

    setUploadedFiles((prev) => [...prev, ...files])
  }

  const handleUpload = async () => {
    if (!selectedSession || !selectedPhotographer || uploadedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona una sesión, fotógrafo y al menos una imagen",
        variant: "destructive",
      })
      return
    }

    try {
      await uploadPhotos({
        files: uploadedFiles,
        photographer_id: parseInt(selectedPhotographer),
        session_id: parseInt(selectedSession),
        price: parseFloat(price),
      })

      toast({
        title: "Fotos subidas",
        description: `Se subieron ${uploadedFiles.length} foto(s) correctamente`,
      })

      setUploadedFiles([])
      setSelectedSession("")
      setSelectedPhotographer("")
    } catch (error: any) {
      toast({
        title: "Error al subir fotos",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleRemoveFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName))
  }

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return

    try {
      await createAlbum({
        name: newAlbumName.trim(),
        description: newAlbumDescription.trim() || undefined,
      })

      toast({
        title: "Álbum creado",
        description: `El álbum "${newAlbumName}" se creó correctamente`,
      })

      setNewAlbumName("")
      setNewAlbumDescription("")
      setIsDialogOpen(false)
      refetchAlbums()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo crear el álbum",
        variant: "destructive",
      })
    }
  }

  // Loading state
  if (albumsLoading || photographersLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-heading">Gestión de Álbumes</h1>
          <p className="text-muted-foreground">Administra álbumes y sube fotos con drag & drop</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl bg-primary text-foreground hover:bg-primary-hover">
              <Plus className="h-4 w-4" />
              Nuevo Álbum
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Álbum</DialogTitle>
              <DialogDescription>Ingresa el nombre del nuevo álbum</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="albumName">Nombre del Álbum</Label>
                <Input
                  id="albumName"
                  placeholder="Ej: Maratón Bariloche 2025"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="albumDescription">Descripción (opcional)</Label>
                <Input
                  id="albumDescription"
                  placeholder="Ej: Fotos del evento anual"
                  value={newAlbumDescription}
                  onChange={(e) => setNewAlbumDescription(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl bg-transparent">
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAlbum}
                disabled={!newAlbumName}
                className="rounded-xl bg-primary text-foreground hover:bg-primary-hover"
              >
                Crear Álbum
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-gray-200">
            <CardHeader>
              <CardTitle>Subir Fotos</CardTitle>
              <CardDescription>Arrastra y suelta imágenes o haz click para seleccionar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Álbum</Label>
                  <Select value={selectedAlbum} onValueChange={setSelectedAlbum}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecciona un álbum" />
                    </SelectTrigger>
                    <SelectContent>
                      {albums.map((album: any) => (
                        <SelectItem key={album.id} value={String(album.id)}>
                          {album.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sesión</Label>
                  <Select 
                    value={selectedSession} 
                    onValueChange={setSelectedSession}
                    disabled={!selectedAlbum}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={selectedAlbum ? "Selecciona una sesión" : "Primero selecciona un álbum"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSessions.map((session: any) => (
                        <SelectItem key={session.id} value={String(session.id)}>
                          {session.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fotógrafo</Label>
                  <Select value={selectedPhotographer} onValueChange={setSelectedPhotographer}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecciona un fotógrafo" />
                    </SelectTrigger>
                    <SelectContent>
                      {photographers.map((photographer: any) => (
                        <SelectItem key={photographer.id} value={String(photographer.id)}>
                          {photographer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Precio por foto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="100.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-gray-200 bg-muted/30",
                )}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-lg font-semibold">
                  {isDragging ? "Suelta las imágenes aquí" : "Arrastra y suelta imágenes"}
                </p>
                <p className="text-sm text-muted-foreground">o haz click para seleccionar archivos</p>
                <p className="mt-2 text-xs text-muted-foreground">Formatos: JPG, PNG, WEBP</p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Archivos Seleccionados ({uploadedFiles.length})</Label>
                    <Button
                      onClick={handleUpload}
                      disabled={!selectedSession || !selectedPhotographer || uploading}
                      className="gap-2 rounded-xl bg-primary text-foreground hover:bg-primary-hover"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Subiendo... {progress}%
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Subir Fotos
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-4">
                    {uploadedFiles.map((file) => (
                      <div key={file.name} className="flex items-center gap-3 rounded-lg bg-muted p-3">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(file.name)}
                          disabled={uploading}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="rounded-2xl border-gray-200">
            <CardHeader>
              <CardTitle>Álbumes Existentes</CardTitle>
              <CardDescription>Lista de álbumes disponibles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar álbum..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-xl pl-10"
                />
              </div>

              <div className="max-h-[500px] space-y-2 overflow-y-auto">
                {filteredAlbums.length === 0 ? (
                  <div className="flex min-h-[200px] items-center justify-center rounded-xl bg-muted">
                    <div className="text-center">
                      <FolderOpen className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No se encontraron álbumes</p>
                    </div>
                  </div>
                ) : (
                  filteredAlbums.map((album) => (
                    <div
                      key={album.id}
                      className={cn(
                        "cursor-pointer rounded-xl border border-gray-200 p-4 transition-colors hover:bg-muted/50",
                        selectedAlbum === String(album.id) && "border-primary bg-primary/5",
                      )}
                      onClick={() => setSelectedAlbum(String(album.id))}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{album.name}</h4>
                          {album.description && (
                            <p className="text-xs text-muted-foreground">{album.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {album.sessions?.length || 0} sesión(es)
                          </p>
                        </div>
                        {selectedAlbum === String(album.id) && (
                          <Badge className="bg-primary text-foreground">Seleccionado</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
