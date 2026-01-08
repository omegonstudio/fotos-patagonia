"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calendar } from "lucide-react"
import type { BackendSession } from "@/hooks/sessions/useSessions"
import { parseUtcNaiveDate } from "@/lib/datetime"

interface SessionModalProps {
  isOpen: boolean
  mode: "add" | "edit"
  session?: BackendSession
  albums: Array<{ id: number; name: string }>
  photographers: Array<{ id: number; name: string }>
  onClose: () => void
  onSave: (sessionData: {
    event_name: string
    description?: string
    event_date: string
    location: string
    photographer_id: number
    album_id: number
  }) => Promise<void>
}

export function SessionModal({ 
  isOpen, 
  mode, 
  session, 
  albums, 
  photographers, 
  onClose, 
  onSave 
}: SessionModalProps) {
  const [formData, setFormData] = useState({
    event_name: "",
    description: "",
    event_date: "",
    location: "",
    photographer_id: "",
    album_id: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  // Reset form cuando cambia el modal
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        event_name: "",
        description: "",
        event_date: "",
        location: "",
        photographer_id: "",
        album_id: "",
      })
      setIsSaving(false)
      return
    }

    if (session) {
      // Convertir fecha ISO a formato datetime-local
      let eventDateLocal = ""
      if (session.event_date) {
        const date = parseUtcNaiveDate(session.event_date)
        // Formato: YYYY-MM-DDTHH:mm
        eventDateLocal = date ? date.toISOString().slice(0, 16) : ""
      }

      setFormData({
        event_name: session.event_name || "",
        description: session.description || "",
        event_date: eventDateLocal,
        location: session.location || "",
        photographer_id: String(session.photographer_id || ""),
        album_id: String(session.album_id || ""),
      })
    } else {
      setFormData({
        event_name: "",
        description: "",
        event_date: "",
        location: "",
        photographer_id: "",
        album_id: "",
      })
    }
  }, [session, isOpen])

  const handleSave = async () => {
    if (!formData.event_name.trim() || 
        !formData.event_date || 
        !formData.location.trim() ||
        !formData.photographer_id ||
        !formData.album_id) {
      return
    }

    setIsSaving(true)
    try {
      // Convertir fecha local a ISO
      const eventDateISO = new Date(formData.event_date).toISOString()

      await onSave({
        event_name: formData.event_name.trim(),
        description: formData.description.trim() || undefined,
        event_date: eventDateISO,
        location: formData.location.trim(),
        photographer_id: parseInt(formData.photographer_id),
        album_id: parseInt(formData.album_id),
      })
      onClose()
    } catch (error) {
      console.error("Error al guardar sesión:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const isFormValid = 
    formData.event_name.trim() && 
    formData.event_date && 
    formData.location.trim() &&
    formData.photographer_id &&
    formData.album_id

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl bg-[#f2f2e4]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Nueva Sesión de Fotos" : "Editar Sesión"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Nombre del Evento */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Nombre del Evento <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.event_name}
                onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                placeholder="Ej: Maratón Bariloche 2024"
                className="rounded-lg border-gray-200"
              />
            </div>

            {/* Ubicación */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Ubicación <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ej: Bariloche, Argentina"
                className="rounded-lg border-gray-200"
              />
            </div>
          </div>

          {/* Fecha y Hora del Evento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Fecha y Hora del Evento <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="datetime-local"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="rounded-lg border-gray-200 pl-10"
              />
            </div>
          </div>

          {/* Álbum y Fotógrafo */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Álbum */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Álbum <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.album_id} 
                onValueChange={(value) => setFormData({ ...formData, album_id: value })}
                disabled={mode === "edit"} // No permitir cambiar álbum en edición
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Selecciona un álbum" />
                </SelectTrigger>
                <SelectContent>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={String(album.id)}>
                      {album.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fotógrafo */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Fotógrafo <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.photographer_id} 
                onValueChange={(value) => setFormData({ ...formData, photographer_id: value })}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Selecciona un fotógrafo" />
                </SelectTrigger>
                <SelectContent>
                  {photographers.map((photographer) => (
                    <SelectItem key={photographer.id} value={String(photographer.id)}>
                      {photographer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Descripción (opcional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe la sesión de fotos..."
              className="min-h-[100px] rounded-lg border-gray-200"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isSaving}
            className="flex-1 rounded-lg border-gray-200 bg-transparent"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            className="flex-1 rounded-lg bg-[#f9a01b] font-semibold text-foreground hover:bg-[#f9a01b]/90 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              mode === "add" ? "Crear Sesión" : "Guardar Cambios"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

