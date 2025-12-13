"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Photographer } from "@/lib/types"

interface PhotographerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Photographer) => void | Promise<void>
  photographer?: Photographer | null
  isSubmitting?: boolean
}

const emptyPhotographer: Photographer = {
  id: 0,
  name: "",
  contact_info: "",
  commission_percentage: 0,
}

export default function PhotographerModal({ isOpen, onClose, onSave, photographer, isSubmitting = false }: PhotographerModalProps) {
  const [formData, setFormData] = useState<Photographer>(() => ({ ...emptyPhotographer }))

  // Lógica previa de contraseña (deshabilitada temporalmente a pedido del equipo)
  // const [password, setPassword] = useState("")

  useEffect(() => {
    if (photographer) {
      setFormData(photographer)
    } else {
      setFormData({ ...emptyPhotographer })
    }
  }, [photographer, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "commission_percentage" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const handleSave = async () => {
    if (!formData.name || !formData.contact_info) {
      alert("Por favor completa los campos obligatorios")
      return
    }

    const payload: Photographer = {
      id: formData.id ?? 0,
      name: formData.name.trim(),
      commission_percentage: formData.commission_percentage ?? 0,
      contact_info: formData.contact_info.trim(),
      user_id: formData.user_id,
    }

    await onSave(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl border-gray-200 bg-[#f2f2e4] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {photographer ? "Editar Fotógrafo" : "Nuevo Fotógrafo"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">
              Nombre Completo
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Juan Pérez"
              className="rounded-lg border-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_info" className="text-sm font-semibold">
              Información de contacto
            </Label>
            <Input
              id="contact_info"
              name="contact_info"
              value={formData.contact_info}
              onChange={handleChange}
              placeholder="contacto@fotospatagonia.com / +54 9 ..."
              className="rounded-lg border-gray-200"
            />
          </div>

          {/* Bloque de contraseña en pausa */}
          {/*
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold">
              Contraseña
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="rounded-lg border-gray-200"
            />
          </div>
          */}

          <div className="space-y-2">
            <Label htmlFor="commission_percentage" className="text-sm font-semibold">
              Comisión
            </Label>
            <div className="relative">
              <Input
                id="commission_percentage"
                name="commission_percentage"
                type="number"
                value={formData.commission_percentage}
                onChange={handleChange}
                placeholder="20"
                min="0"
                max="100"
                className="rounded-lg border-gray-200 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                %
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="rounded-lg border-gray-200 bg-transparent"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-lg bg-[#f9a01b] font-semibold text-gray-900 hover:bg-[#f8b84d]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
