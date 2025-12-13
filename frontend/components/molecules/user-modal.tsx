"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Mail, Lock, Shield } from "lucide-react"
import type { BackendUser } from "@/hooks/users/useUser"
import type { BackendRole } from "@/hooks/roles/useRoles"

interface UserModalProps {
  isOpen: boolean
  mode: "add" | "edit"
  user?: BackendUser
  roles: BackendRole[]
  onClose: () => void
  onSave: (userData: {
    email: string
    password?: string
    role_id: number
    is_active: boolean
  }) => Promise<void>
}

export function UserModal({ isOpen, mode, user, roles, onClose, onSave }: UserModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role_id: "",
    is_active: true,
  })
  const [isSaving, setIsSaving] = useState(false)

  // Reset form cuando cambia el modal
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: "",
        password: "",
        role_id: "",
        is_active: true,
      })
      setIsSaving(false)
      return
    }

    if (user) {
      setFormData({
        email: user.email || "",
        password: "", // No prellenar password en edit
        role_id: String(user.role.id || ""),
        is_active: user.is_active ?? true,
      })
    } else {
      setFormData({
        email: "",
        password: "",
        role_id: roles.length > 0 ? String(roles[0].id) : "",
        is_active: true,
      })
    }
  }, [user, isOpen, roles])

  const handleSave = async () => {
    if (!formData.email.trim() || !formData.role_id) {
      return
    }

    // En modo crear, password es obligatorio
    if (mode === "add" && !formData.password.trim()) {
      return
    }

    setIsSaving(true)
    try {
      const userData: any = {
        email: formData.email.trim(),
        role_id: parseInt(formData.role_id),
        is_active: formData.is_active,
      }

      // Solo incluir password si fue proporcionado
      if (formData.password.trim()) {
        userData.password = formData.password
      }

      await onSave(userData)
      onClose()
    } catch (error) {
      console.error("Error al guardar usuario:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const isFormValid = 
    formData.email.trim() && 
    formData.role_id &&
    (mode === "edit" || formData.password.trim()) // Password solo obligatorio en crear

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl bg-[#f2f2e4]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Nuevo Usuario" : "Editar Usuario"}</DialogTitle>
          <DialogDescription>
            {mode === "add" 
              ? "Completa los datos para crear un nuevo usuario" 
              : "Modifica la información del usuario"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Email <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
                className="rounded-lg border-gray-200 pl-10"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Contraseña {mode === "add" && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={mode === "edit" ? "Dejar vacío para no cambiar" : "Contraseña segura"}
                className="rounded-lg border-gray-200 pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === "edit" 
                ? "Dejar vacío si no deseas cambiar la contraseña" 
                : "Mínimo 6 caracteres"}
            </p>
          </div>

          {/* Rol */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Rol <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.role_id} 
              onValueChange={(value) => setFormData({ ...formData, role_id: value })}
            >
              <SelectTrigger className="rounded-lg border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Selecciona un rol" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    <div>
                      <div className="font-medium">{role.name}</div>
                      {role.description && (
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado Activo */}
          <div className="flex items-center space-x-2 rounded-lg bg-muted p-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active" className="font-normal">
              Usuario activo (puede iniciar sesión)
            </Label>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
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
              mode === "add" ? "Crear Usuario" : "Guardar Cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

