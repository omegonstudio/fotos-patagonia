"use client"

import { useState } from "react"
import { Search, Plus, Edit, Trash2, Loader2, Calendar, MapPin, User, Album as AlbumIcon, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSessions } from "@/hooks/sessions/useSessions"
import { useAlbums } from "@/hooks/albums/useAlbums"
import { usePhotographers } from "@/hooks/photographers/usePhotographers"
import { useToast } from "@/hooks/use-toast"
import { SessionModal } from "@/components/molecules/session-modal"
import { DeleteConfirmationModal } from "@/components/molecules/delete-confirmation-modal"
import { formatDateTime } from "@/lib/datetime"

export default function AdminSesionesPage() {
  const { sessions, loading, error, refetch, createSession, updateSession, deleteSession, sendCartLink } = useSessions()
  const { data: albumsData } = useAlbums()
  const { photographers } = usePhotographers()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<any>(undefined)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    sessionId: number | null
  }>({ isOpen: false, sessionId: null })

  const albums = Array.isArray(albumsData) ? albumsData : []

  const filteredSessions = sessions.filter((session) =>
    session.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenAdd = () => {
    setEditingSession(undefined)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (session: any) => {
    setEditingSession(session)
    setIsModalOpen(true)
  }

  const handleOpenDelete = (sessionId: number) => {
    setDeleteConfirmation({ isOpen: true, sessionId })
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteSession(id)
      toast({
        title: "Sesión eliminada",
        description: "La sesión ha sido eliminada exitosamente",
      })
      refetch()
      setDeleteConfirmation({ isOpen: false, sessionId: null })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la sesión",
        variant: "destructive",
      })
    }
  }

  const handleSave = async (sessionData: any) => {
    try {
      if (editingSession) {
        // No enviar album_id en update (backend no lo acepta)
        const { album_id, ...updateData } = sessionData
        await updateSession(editingSession.id, updateData)
        toast({
          title: "Sesión actualizada",
          description: "La sesión ha sido actualizada exitosamente",
        })
      } else {
        await createSession(sessionData)
        toast({
          title: "Sesión creada",
          description: "La sesión ha sido creada exitosamente",
        })
      }
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo ${editingSession ? "actualizar" : "crear"} la sesión`,
        variant: "destructive",
      })
    }
  }

  const handleSendCartLink = async (sessionId: number) => {
    try {
      await sendCartLink(sessionId)
      toast({
        title: "Link enviado",
        description: "El link del carrito ha sido enviado exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el link",
        variant: "destructive",
      })
    }
  }

  const sessionToDelete = sessions.find((s) => s.id === deleteConfirmation.sessionId)

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">Error al cargar las sesiones</p>
            <Button onClick={refetch}>Reintentar</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-heading">Gestión de Sesiones</h1>
          <p className="text-muted-foreground">Administra las sesiones de fotos de eventos</p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="rounded-xl bg-primary font-semibold text-foreground hover:bg-primary-hover"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Sesión
        </Button>
      </div>

      <Card className="mb-6 rounded-2xl border-gray-200 shadow-md">
        <CardHeader>
          <CardTitle>Buscar Sesión</CardTitle>
          <CardDescription>Busca sesiones por nombre del evento o ubicación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {filteredSessions.length === 0 && !loading ? (
        <Card className="rounded-2xl border-gray-200">
          <CardContent className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-semibold text-muted-foreground">No se encontraron sesiones</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "Intenta con otros términos de búsqueda" : "Crea tu primera sesión"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="rounded-2xl border-gray-200 shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{session.event_name}</CardTitle>
                    <CardDescription className="mt-1">
                      {session.description || "Sin descripción"}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    ID: {session.id}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDateTime(session.event_date) || "Fecha inválida"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{session.location}</span>
                  </div>
                  {session.photographer && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{session.photographer.name}</span>
                    </div>
                  )}
                  {session.album && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlbumIcon className="h-4 w-4" />
                      <span>{session.album.name}</span>
                    </div>
                  )}
                  {session.photos && (
                    <div className="text-muted-foreground">
                      <Badge variant="outline">
                        {session.photos.length} foto(s)
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(session)}
                    className="flex-1 rounded-lg bg-transparent"
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendCartLink(session.id)}
                    className="flex-1 rounded-lg bg-transparent"
                  >
                    <Mail className="mr-1 h-4 w-4" />
                    Enviar Link
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(session.id)}
                    className="rounded-lg text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SessionModal
        isOpen={isModalOpen}
        mode={editingSession ? "edit" : "add"}
        session={editingSession}
        albums={albums}
        photographers={photographers}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="Eliminar sesión"
        entityName={`la sesión "${sessionToDelete?.event_name}"`}
        onConfirm={() => deleteConfirmation.sessionId && handleDelete(deleteConfirmation.sessionId)}
        onCancel={() => setDeleteConfirmation({ isOpen: false, sessionId: null })}
      />
    </div>
  )
}
