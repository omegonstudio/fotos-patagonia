"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { Album, Tag } from "@/lib/types"
import { useSessions } from "@/hooks/sessions/useSessions"
import { useTags } from "@/hooks/tags/useTags"
import { MultiSelectDropdown } from "./MultiSelectDropdown"

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
  const [sessionPopoverOpen, setSessionPopoverOpen] = useState(false)
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)

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

  const handleSelectSession = (value: string) => {
    const id = Number(value)
    setSelectedSessionIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setSessionPopoverOpen(false)
  }

  const handleSelectTag = (value: string) => {
    const id = Number(value)
    setSelectedTagIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setTagPopoverOpen(false)
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

            <MultiSelectDropdown
              items={sessions}
              loading={sessionsLoading}
              placeholder="Selecciona sesión"
              getKey={(s) => s.id}
              getLabel={(s) => s.event_name}
              onSelect={(id) =>
                setSelectedSessionIds((prev) =>
                  prev.includes(id) ? prev : [...prev, id]
                )
              }
            />



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

            <MultiSelectDropdown
              items={tags}
              loading={tagsLoading}
              placeholder="Selecciona tag"
              getKey={(t) => t.id}
              getLabel={(t) => t.name}
              onSelect={(id) =>
                setSelectedTagIds((prev) =>
                  prev.includes(id) ? prev : [...prev, id]
                )
              }
            />



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

