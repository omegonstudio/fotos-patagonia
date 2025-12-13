"use client"

import type React from "react"

import { useAuthStore } from "@/lib/store"
import { getUserRoleName, hasPermission } from "@/lib/types"

interface UserRoleGuardProps {
  children: React.ReactNode
  allowedRoles?: string[] // Nombres de roles permitidos (ej: ["Admin", "Vendedor"])
  requiredPermissions?: string[] // Permisos requeridos (ej: ["full_access", "view_photos"])
  requireAll?: boolean // Si es true, requiere todos los permisos; si es false, requiere al menos uno
  fallback?: React.ReactNode
}

export function UserRoleGuard({ 
  children, 
  allowedRoles, 
  requiredPermissions,
  requireAll = false,
  fallback 
}: UserRoleGuardProps) {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return (
      fallback || (
        <div className="rounded-lg border border-gray-200 bg-[#ffecce]/30 p-6 text-center">
          <p className="text-muted-foreground">Debes iniciar sesión para acceder a esta sección</p>
        </div>
      )
    )
  }

  // Verificar roles permitidos
  const userRoleName = getUserRoleName(user)
  const hasAllowedRole = !allowedRoles || 
    (userRoleName && allowedRoles.some(role => role.toLowerCase() === userRoleName.toLowerCase()))

  // Verificar permisos requeridos
  let hasRequiredPermissions = true
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (requireAll) {
      hasRequiredPermissions = requiredPermissions.every(perm => hasPermission(user, perm))
    } else {
      hasRequiredPermissions = requiredPermissions.some(perm => hasPermission(user, perm))
    }
  }

  if (!hasAllowedRole || !hasRequiredPermissions) {
    return (
      fallback || (
        <div className="rounded-lg border border-gray-200 bg-[#ffecce]/30 p-6 text-center">
          <p className="text-muted-foreground">No tienes permisos para acceder a esta sección</p>
        </div>
      )
    )
  }

  return <>{children}</>
}
