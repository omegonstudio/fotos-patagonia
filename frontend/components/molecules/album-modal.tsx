"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import type { Album, Tag } from "@/lib/types"
import { useSessions } from "@/hooks/sessions/useSessions"
import { useTags } from "@/hooks/tags/useTags"
import { MultiSelectDropdown } from "./MultiSelectDropdown"
import { useCombos } from "@/hooks/combos/useCombos"


interface AlbumModalProps {
  isOpen: boolean
  mode: "add" | "edit"
  album?: Album
  onClose: () => void
  onSave: (album: AlbumModalFormValues) => Promise<void>
}

export interface AlbumModalFormValues extends Partial<Album> {
  sessionIds?: number[]
  comboIds?: number[]
  tagIds?: number[]
}


export function AlbumModal({ isOpen, mode, album, onClose, onSave }: AlbumModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const { combos, loading: combosLoading } = useCombos()
  const [defaultPhotoPrice, setDefaultPhotoPrice] = useState<string>("")

  // ⬇ MULTIPLE SELECTION
  const [selectedSessionIds, setSelectedSessionIds] = useState<number[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [sessionPopoverOpen, setSessionPopoverOpen] = useState(false)
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)

  const { sessions, loading: sessionsLoading } = useSessions()
  const { tags, loading: tagsLoading } = useTags()
  const [selectedComboIds, setSelectedComboIds] = useState<number[]>([])

  useEffect(() => {
    if (!isOpen) {
      setName("")
      setDescription("")
      setDefaultPhotoPrice("")
      setSelectedSessionIds([])
       setSelectedComboIds([]) 
       setSelectedTagIds([])
      return
    }
    

    if (album) {
      setName(album.name)
      setDescription(album.description ?? "")
      setDefaultPhotoPrice(album.default_photo_price?.toString() ?? "")

      /// backend → array
      setSelectedSessionIds(album.sessions?.map((s: any) => s.id) ?? [])
      setSelectedComboIds(album.combos?.map((c: any) => c.id) ?? [])
       setSelectedTagIds(album.tags?.map((t: Tag) => Number(t.id)) ?? [])
    }
  }, [album, isOpen])

  const handleSave = async () => {
    const priceValue = defaultPhotoPrice.trim()
    const payload: AlbumModalFormValues = {
      id: album?.id,
      name: name.trim(),
      description: description.trim(),
      default_photo_price: priceValue ? Number(priceValue) : undefined,
      sessionIds: selectedSessionIds,
      comboIds: selectedComboIds,
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

          {/* Precio por defecto */}
          <Input
          type="number"
          value={defaultPhotoPrice}
          onChange={(e) => setDefaultPhotoPrice(e.target.value)}
          onKeyDown={(e) => {
            // Evita que cambie con flechas (ArrowUp/ArrowDown)
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault()
            }
          }}
          onWheel={(e) => {
            // Evita que cambie con scroll del mouse
            e.currentTarget.blur()
          }}
          placeholder="Ej: 15000"
          className="mt-1 rounded-lg border-gray-200"
        />


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

            {/* Combos */}
              <div>
             <Label>Agregar Combo</Label>

                <MultiSelectDropdown
                  items={combos}
                  loading={combosLoading}
                  placeholder="Selecciona combo"
                  getKey={(c) => c.id}
                  getLabel={(c) => c.name}
                  onSelect={(id) =>
                    setSelectedComboIds((prev) =>
                      prev.includes(id) ? prev : [...prev, id]
                    )
                  }
                /> 

                {/* Chips de combos */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedComboIds.map((id) => {
                    const combo = combos.find((c) => c.id === id)
                    return (
                      <div
                        key={id}
                        className="px-3 py-1 bg-purple-200 text-sm rounded-full flex items-center gap-2"
                      >
                        {combo?.name}
                        <X
                          className="h-4 w-4 cursor-pointer"
                          onClick={() =>
                            setSelectedComboIds((prev) => prev.filter((x) => x !== id))
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

