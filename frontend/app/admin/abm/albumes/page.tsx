"use client"

import Link from "next/link"
import { useState } from "react"
import { Plus, ArrowLeft, Edit, Trash2, Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import type { Album } from "@/lib/types"
import { AlbumModal, AlbumModalFormValues } from "@/components/molecules/album-modal"
import { DeleteConfirmationModal } from "@/components/molecules/delete-confirmation-modal"
import { useAlbums } from "@/hooks/albums/useAlbums"
import {  toast, useToast } from "@/hooks/use-toast"

export default function AlbumsManagementPage() {
  const {
    data: albumsData,
    loading: albumsLoading,
    error: albumsError,
    refetch,
    createAlbum,
    updateAlbum,
    deleteAlbum,
  } = useAlbums()

  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<Album | undefined>()
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    albumId: null as string | number | null,
  })

  const albums = Array.isArray(albumsData) ? albumsData : []

  const sortedAlbums = [...albums].sort((a, b) => {
    return Number(b.id) - Number(a.id) // ID más alto primero
  })
  

  const handleSaveAlbum = async (albumPayload: AlbumModalFormValues) => {
    try {
      if (editingAlbum) {
        await updateAlbum(albumPayload.id!, albumPayload)
        toast({ title: "Álbum actualizado" })
      } else {
        await createAlbum(albumPayload)
        toast({ title: "Álbum creado" })
      }

      refetch()
      setIsModalOpen(false)
    } catch {
      toast({
        title: "Error",
        description: "No se pudo guardar el álbum",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string | number) => {
    try {
      await deleteAlbum(id)
      toast({ title: "Álbum eliminado", description: "El álbum ha sido eliminado exitosamente" })
      refetch()
      setDeleteConfirmation({ isOpen: false, albumId: null })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo eliminar el álbum",
        variant: "destructive",
      })
    }
  }
  const albumToDelete = albums.find(
    (a) => String(a.id) === String(deleteConfirmation.albumId)
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* HEADER */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/admin/abm"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <h2 className="text-4xl font-bold">Gestión de Álbumes</h2>
        </div>

        <Button
          onClick={() => {
            setEditingAlbum(undefined)
            setIsModalOpen(true)
          }}
          className="rounded-xl bg-primary font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Álbum
        </Button>
      </div>

      {/* LISTADO */}
      <div className="grid gap-4">
      {sortedAlbums.map((album) => (
          <Card key={album.id} className="rounded-2xl border-gray-200">
            <CardHeader className="flex flex-row justify-between">
              <div>
                <CardTitle>{album.name}</CardTitle>
                {album.description && (
                  <CardDescription>{album.description}</CardDescription>
                )}

                {/* TAGS */}
                {album.tags && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {album.tags.map((t) => (
                      <Badge key={t.id} variant="secondary" className="rounded-full px-3 py-1">
                        {t.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingAlbum(album)
                    setIsModalOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDeleteConfirmation({ isOpen: true, albumId: album.id })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sesiones</p>
                  <p>{album.sessions?.length || 0}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p>#{album.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODALES */}
      <AlbumModal
        isOpen={isModalOpen}
        mode={editingAlbum ? "edit" : "add"}
        album={editingAlbum}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAlbum}
      />

      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="Eliminar álbum"
        entityName={`el álbum "${albumToDelete?.name}"`}
        onConfirm={() => deleteConfirmation.albumId && handleDelete(deleteConfirmation.albumId)}
        onCancel={() => setDeleteConfirmation({ isOpen: false, albumId: null })}
      />
    </div>
  )
}




