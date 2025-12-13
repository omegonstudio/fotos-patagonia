"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Album, Tag } from "@/lib/types"
import { useSessions } from "@/hooks/sessions/useSessions"
import { useTags } from "@/hooks/tags/useTags"

interface AlbumModalProps {
  isOpen: boolean
  mode: "add" | "edit"
  album?: Album
  onClose: () => void
  onSave: (album: AlbumModalFormValues) => Promise<void>
}

export interface AlbumModalFormValues extends Partial<Album> {
  sessionIds?: number[]
  tagIds?: number[]
}

export function AlbumModal({ isOpen, mode, album, onClose, onSave }: AlbumModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  // ⬇ MULTIPLE SELECTION
  const [selectedSessionIds, setSelectedSessionIds] = useState<number[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])

  const { sessions, loading: sessionsLoading } = useSessions()
  const { tags, loading: tagsLoading } = useTags()

  useEffect(() => {
    if (!isOpen) {
      setName("")
      setDescription("")
      setSelectedSessionIds([])
      setSelectedTagIds([])
      return
    }

    if (album) {
      setName(album.name)
      setDescription(album.description ?? "")

      /// backend → array
      setSelectedSessionIds(album.sessions?.map((s: any) => s.id) ?? [])
      setSelectedTagIds(album.tags?.map((t: Tag) => Number(t.id)) ?? [])
    }
  }, [album, isOpen])

  const handleSave = async () => {
    const payload: AlbumModalFormValues = {
      id: album?.id,
      name: name.trim(),
      description: description.trim(),
      sessionIds: selectedSessionIds,
      tagIds: selectedTagIds,
    }

    await onSave(payload)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl bg-[#f2f2e4]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Nuevo Álbum" : "Editar Álbum"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          {/* Nombre */}
          <div>
            <Label>Nombre del Álbum</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 rounded-lg border-gray-200"
            />
          </div>

          {/* Descripción */}
          <div>
            <Label>Descripción</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 rounded-lg border-gray-200"
            />
          </div>

          {/* Sesiones */}
          <div>
            <Label>Agregar Sesión</Label>

            <Select
              onValueChange={(value) =>
                setSelectedSessionIds((prev) =>
                  prev.includes(Number(value)) ? prev : [...prev, Number(value)]
                )
              }
              disabled={sessionsLoading}
            >
              <SelectTrigger className="mt-1 rounded-lg border-gray-200">
                <SelectValue placeholder="Selecciona sesión" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.event_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Chips de sesiones */}
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedSessionIds.map((id) => {
                const sess = sessions.find((s) => s.id === id)
                return (
                  <div
                    key={id}
                    className="px-3 py-1 bg-orange-200 text-sm rounded-full flex items-center gap-2"
                  >
                    {sess?.event_name}
                    <X
                      className="h-4 w-4 cursor-pointer"
                      onClick={() =>
                        setSelectedSessionIds((prev) => prev.filter((x) => x !== id))
                      }
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Agregar Tag</Label>

            <Select
              onValueChange={(value) =>
                setSelectedTagIds((prev) =>
                  prev.includes(Number(value)) ? prev : [...prev, Number(value)]
                )
              }
              disabled={tagsLoading}
            >
              <SelectTrigger className="mt-1 rounded-lg border-gray-200">
                <SelectValue placeholder="Selecciona tag" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={String(tag.id)}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Chips de tags */}
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTagIds.map((id) => {
                const tag = tags.find((t) => Number(t.id) === id)
                return (
                  <div
                    key={id}
                    className="px-3 py-1 bg-green-200 text-sm rounded-full flex items-center gap-2"
                  >
                    {tag?.name}
                    <X
                      className="h-4 w-4 cursor-pointer"
                      onClick={() =>
                        setSelectedTagIds((prev) => prev.filter((x) => x !== id))
                      }
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 bg-[#f9a01b] text-foreground"
            >
              {mode === "add" ? "Crear" : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

