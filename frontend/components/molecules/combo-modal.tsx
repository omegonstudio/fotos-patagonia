"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Package } from "lucide-react"
import type { BackendCombo } from "@/hooks/combos/useCombos"
import { useToast } from "@/hooks/use-toast"

interface ComboModalProps {
  isOpen: boolean
  mode: "add" | "edit"
  combo?: BackendCombo
  onClose: () => void
  onSave: (comboData: {
    name: string
    description?: string | null
    price: number
    totalPhotos: number
    isFullAlbum: boolean
    active: boolean
  }) => Promise<void>
  isSubmitting?: boolean
}

export function ComboModal({ isOpen, mode, combo, onClose, onSave, isSubmitting = false }: ComboModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    totalPhotos: 1,
    price: 0,
    active: true,
    isFullAlbum: false,
  })

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        description: "",
        totalPhotos: 1,
        price: 0,
        active: true,
        isFullAlbum: false,
      })
      return
    }

    if (combo && mode === "edit") {
      setFormData({
        name: combo.name,
        description: combo.description || "",
        totalPhotos: combo.totalPhotos,
        price: combo.price,
        active: combo.active,
        isFullAlbum: combo.isFullAlbum || false,
      })
    } else {
      setFormData({
        name: "",
        description: "",
        totalPhotos: 1,
        price: 0,
        active: true,
        isFullAlbum: false,
      })
    }
  }, [combo, mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del combo es requerido",
        variant: "destructive",
      })
      return
    }

    if (formData.price <= 0) {
      toast({
        title: "Error",
        description: "El precio debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    if (!formData.isFullAlbum && formData.totalPhotos <= 0) {
      toast({
        title: "Error",
        description: "La cantidad de fotos debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    await onSave({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: formData.price,
      totalPhotos: formData.isFullAlbum ? 0 : formData.totalPhotos,
      isFullAlbum: formData.isFullAlbum,
      active: formData.active,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Crear Nuevo Combo" : "Editar Combo"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Crea un nuevo combo de fotos con descuento por cantidad"
              : "Modifica la información del combo"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Nombre del Combo */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre del Combo <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Ej: Combo 3 Fotos"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl pl-10"
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Describe este combo..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[80px] rounded-xl"
              />
            </div>

            {/* Checkbox para Álbum Completo */}
            <div className="flex items-center space-x-2 rounded-lg bg-muted p-3">
              <input
                type="checkbox"
                id="isFullAlbum"
                checked={formData.isFullAlbum}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isFullAlbum: e.target.checked,
                    totalPhotos: e.target.checked ? 0 : 1,
                  })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isFullAlbum" className="font-normal">
                Es un combo de álbum completo
              </Label>
            </div>

            {/* Cantidad Total de Fotos */}
            {!formData.isFullAlbum && (
              <div className="space-y-2">
                <Label htmlFor="totalPhotos">
                  Cantidad de Fotos <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="totalPhotos"
                  type="number"
                  min="1"
                  placeholder="Ej: 3"
                  value={formData.totalPhotos || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, totalPhotos: parseInt(e.target.value) || 0 })
                  }
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Número de fotos incluidas en el combo
                </p>
              </div>
            )}

            {/* Precio Total */}
            <div className="space-y-2">
              <Label htmlFor="price">
                Precio Total ($) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="100"
                placeholder="Ej: 2500"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="rounded-xl"
              />
              {!formData.isFullAlbum && formData.totalPhotos > 0 && formData.price > 0 && (
                <p className="text-xs text-muted-foreground">
                  Precio por foto: ${(formData.price / formData.totalPhotos).toFixed(2)}
                </p>
              )}
            </div>

            {/* Estado Activo */}
            <div className="flex items-center space-x-2 rounded-lg bg-muted p-3">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="active" className="font-normal">
                Combo activo y disponible para los clientes
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="rounded-xl"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="rounded-xl bg-primary text-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                mode === "add" ? "Crear Combo" : "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

