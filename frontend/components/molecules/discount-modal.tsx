"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Percent, Calendar } from "lucide-react"
import type { BackendDiscount } from "@/hooks/discounts/useDiscounts"

interface DiscountModalProps {
  isOpen: boolean
  mode: "add" | "edit"
  discount?: BackendDiscount
  onClose: () => void
  onSave: (discountData: {
    code: string
    percentage: number
    expires_at?: string | null
    is_active: boolean
  }) => Promise<void>
}

export function DiscountModal({ isOpen, mode, discount, onClose, onSave }: DiscountModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    percentage: 0,
    expires_at: "",
    is_active: true,
  })
  const [isSaving, setIsSaving] = useState(false)

  // Reset form cuando cambia el modal
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        code: "",
        percentage: 0,
        expires_at: "",
        is_active: true,
      })
      setIsSaving(false)
      return
    }

    if (discount) {
      // Convertir fecha ISO a formato date
      let expiresAtLocal = ""
      if (discount.expires_at) {
        const date = new Date(discount.expires_at)
        // Formato: YYYY-MM-DD
        expiresAtLocal = date.toISOString().slice(0, 10)
      }

      setFormData({
        code: discount.code || "",
        percentage: discount.percentage || 0,
        expires_at: expiresAtLocal,
        is_active: discount.is_active ?? true,
      })
    } else {
      setFormData({
        code: "",
        percentage: 0,
        expires_at: "",
        is_active: true,
      })
    }
  }, [discount, isOpen])

  const handleSave = async () => {
    if (!formData.code.trim() || formData.percentage <= 0 || formData.percentage > 100) {
      return
    }

    setIsSaving(true)
    try {
      // Convertir fecha local a ISO si existe
      let expiresAtISO: string | null = null
      if (formData.expires_at) {
        expiresAtISO = new Date(formData.expires_at).toISOString()
      }

      await onSave({
        code: formData.code.trim().toUpperCase(),
        percentage: formData.percentage,
        expires_at: expiresAtISO,
        is_active: formData.is_active,
      })
      onClose()
    } catch (error) {
      console.error("Error al guardar descuento:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const isFormValid = formData.code.trim() && formData.percentage > 0 && formData.percentage <= 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl bg-[#f2f2e4]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Nuevo Código de Descuento" : "Editar Código"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Código */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Código <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="PATAGONIA2024"
              className="rounded-lg border-gray-200 font-mono uppercase"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              El código debe ser único y se convertirá a mayúsculas
            </p>
          </div>

          {/* Porcentaje de Descuento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Porcentaje de Descuento <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.percentage}
                onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0 })}
                placeholder="10.00"
                className="rounded-lg border-gray-200 pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Valor entre 0 y 100
            </p>
          </div>

          {/* Fecha de Vencimiento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fecha de Vencimiento (opcional)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="rounded-lg border-gray-200 pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Dejar vacío para que no expire
            </p>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Estado</Label>
            <Select
              value={formData.is_active ? "active" : "inactive"}
              onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}
            >
              <SelectTrigger className="rounded-lg border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.is_active 
                ? "El código puede ser usado por los clientes" 
                : "El código no está disponible para uso"}
            </p>
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
              mode === "add" ? "Crear Código" : "Guardar Cambios"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
