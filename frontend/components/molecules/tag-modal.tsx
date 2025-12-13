"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface Tag {
  id: number;
  name: string;
  color?: string;
}

interface TagModalProps {
  isOpen: boolean
  mode: "add" | "edit"
  tag?: Tag
  onClose: () => void
  onSave: (tagData: { name: string; color?: string }) => Promise<void>
}

export function TagModal({ isOpen, mode, tag, onClose, onSave }: TagModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    color: "#f9a01b",
  })
  const [isSaving, setIsSaving] = useState(false)

  // Reset form cuando cambia el modal
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: "", color: "#f9a01b" })
      setIsSaving(false)
      return
    }

    if (tag) {
      setFormData({
        name: tag.name || "",
        color: tag.color || "#f9a01b",
      })
    } else {
      setFormData({ name: "", color: "#f9a01b" })
    }
  }, [tag, isOpen])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        name: formData.name.trim(),
        color: formData.color,
      })
      onClose()
    } catch (error) {
      console.error("Error al guardar tag:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl bg-[#f2f2e4]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Nuevo Tag" : "Editar Tag"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Nombre del Tag</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Maratón, Trail Running"
              className="mt-1 rounded-lg border-gray-200"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Color</Label>
            <div className="mt-1 flex gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#f9a01b"
                className="flex-1 rounded-lg border-gray-200"
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
              disabled={!formData.name.trim() || isSaving}
              className="flex-1 rounded-lg bg-[#f9a01b] font-semibold text-foreground hover:bg-[#f9a01b]/90 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                mode === "add" ? "Crear" : "Guardar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
